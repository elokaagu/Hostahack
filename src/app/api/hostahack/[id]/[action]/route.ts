import {
  afterPack,
  fetchFeed,
  formTeams,
  normaliseHandle,
  profileFromX,
  reviewSubmission,
  suggestTeam,
} from "@/lib/hostahack/flows";
import {
  getHackathonById,
  hackDb,
  listParticipants,
  listSubmissions,
  listTeams,
  spendBudget,
  updateHackathon,
  weightedTotal,
} from "@/lib/hostahack/store";
import type { HackParticipant, HackSubmission, Hackathon } from "@/lib/hostahack/types";
import { isLikelyUuid } from "@/lib/id-validation";
import { getOsApiUser } from "@/lib/os-api-auth";
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; action: string }> };

const FEED_TTL_MS = 10 * 60_000;

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function keyMatches(given: unknown, expected: string): boolean {
  if (typeof given !== "string" || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function canOperate(request: NextRequest, h: Hackathon, key: unknown): Promise<boolean> {
  if (keyMatches(key, h.jury_key)) return true;
  return Boolean(await getOsApiUser(request).catch(() => null));
}

const schemas = {
  register: z.object({
    handle: z.string().trim().min(1).max(80),
    skills: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
    interests: z.string().trim().max(300).default(""),
  }),
  join: z.object({ participantId: z.string().uuid(), teamId: z.string().uuid().nullable() }),
  submit: z.object({
    teamId: z.string().uuid(),
    title: z.string().trim().min(3).max(120),
    link: z.string().trim().url().max(300).optional().or(z.literal("")),
    description: z.string().trim().min(30).max(2000),
    trackId: z.string().trim().max(40).optional(),
  }),
  judge: z.object({
    key: z.string().optional(),
    submissionId: z.string().uuid(),
    scores: z.record(z.string(), z.number().min(0).max(10)),
    note: z.string().max(600).optional(),
  }),
  keyed: z.object({ key: z.string().optional(), submissionId: z.string().uuid().optional() }),
};

export async function POST(request: NextRequest, ctx: Ctx) {
  const { id, action } = await ctx.params;
  if (!isLikelyUuid(id)) return fail("Hackathon not found", 404);
  const h = await getHackathonById(id);
  if (!h) return fail("Hackathon not found", 404);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const db = hackDb();

  try {
    switch (action) {
      case "publish": {
        if (!(await canOperate(request, h, body.key))) return fail("Only the organiser can publish.", 403);
        await updateHackathon(h.id, { status: "published", published_at: new Date().toISOString() });
        return NextResponse.json({ ok: true });
      }

      case "feed": {
        const fresh = h.feed && Date.now() - new Date(h.feed.fetchedAt).getTime() < FEED_TTL_MS;
        if (fresh) return NextResponse.json({ feed: h.feed, cached: true });
        if (!(await spendBudget("feed", h.id))) return NextResponse.json({ feed: h.feed, cached: true });
        const feed = await fetchFeed(h);
        if (feed.live || !h.feed) await updateHackathon(h.id, { feed });
        return NextResponse.json({ feed: feed.live ? feed : (h.feed ?? feed) });
      }

      case "register": {
        if (h.status === "draft") return fail("Registration opens when the hackathon is published.");
        const input = schemas.register.safeParse(body);
        if (!input.success) return fail("Add your X handle.");
        const handle = normaliseHandle(input.data.handle);
        if (!handle) return fail("That doesn't look like an X handle.");

        const existing = await listParticipants(h.id);
        const already = existing.find((p) => p.x_handle.toLowerCase() === handle.toLowerCase());
        if (already) return NextResponse.json({ participant: already, existing: true });

        if (!(await spendBudget("register", h.id))) return fail("Registrations are busy. Try again in a minute.", 429);
        const { displayName, profile } = await profileFromX(h, handle, input.data.skills, input.data.interests);
        const { data: inserted, error } = await db
          .from("hostahack_participants")
          .insert({
            hackathon_id: h.id,
            x_handle: handle,
            display_name: displayName,
            skills: profile.skills,
            interests: input.data.interests || null,
            profile,
          })
          .select("*")
          .single();
        if (error) throw new Error(error.message);
        const me = inserted as HackParticipant;

        const teams = await listTeams(h.id);
        const suggestion = await suggestTeam(h, me, [...existing, me], teams).catch((e) => {
          console.error("hostahack.suggestTeam failed", e);
          return null;
        });
        if (suggestion) await db.from("hostahack_participants").update({ suggestion }).eq("id", me.id);
        console.info("hostahack.register", { hackathon: h.slug, source: profile.source, suggested: Boolean(suggestion?.teamId) });
        return NextResponse.json({ participant: { ...me, suggestion } });
      }

      case "join": {
        const input = schemas.join.safeParse(body);
        if (!input.success) return fail("Invalid request");
        const participants = await listParticipants(h.id);
        const me = participants.find((p) => p.id === input.data.participantId);
        if (!me) return fail("Participant not found", 404);

        let teamId = input.data.teamId;
        if (teamId) {
          const size = participants.filter((p) => p.team_id === teamId).length;
          if (size >= 4) return fail("That team is full.");
        } else {
          const { data: team, error } = await db
            .from("hostahack_teams")
            .insert({ hackathon_id: h.id, name: `Team ${me.display_name.replace(/^@/, "").split(" ")[0]}`, track_id: me.profile?.preferredTrackId ?? null, rationale: me.suggestion?.why ?? null })
            .select("id")
            .single();
          if (error) throw new Error(error.message);
          teamId = team.id as string;
        }
        await db.from("hostahack_participants").update({ team_id: teamId }).eq("id", me.id);
        return NextResponse.json({ teamId });
      }

      case "form-teams": {
        const participants = await listParticipants(h.id);
        const solo = participants.filter((p) => !p.team_id);
        if (solo.length < 2) return fail("Fewer than two people are waiting for a team.");
        if (!(await spendBudget("teams", h.id))) return fail("Team forming is busy. Try again shortly.", 429);
        const formed = await formTeams(h, solo);
        for (const t of formed) {
          const { data: team, error } = await db
            .from("hostahack_teams")
            .insert({ hackathon_id: h.id, name: t.name, track_id: t.trackId, rationale: t.rationale })
            .select("id")
            .single();
          if (error) throw new Error(error.message);
          await db.from("hostahack_participants").update({ team_id: team.id }).in("id", t.memberIds);
        }
        return NextResponse.json({ formed: formed.length });
      }

      case "submit": {
        const input = schemas.submit.safeParse(body);
        if (!input.success) return fail("Add a title, and a description of at least a couple of sentences.");
        const teams = await listTeams(h.id);
        const team = teams.find((t) => t.id === input.data.teamId);
        if (!team) return fail("Team not found", 404);
        if (!(await spendBudget("score", h.id))) return fail("Scoring is busy. Try again shortly.", 429);

        const trackId = h.design.tracks.some((t) => t.id === input.data.trackId) ? input.data.trackId! : team.track_id;
        const { data: saved, error } = await db
          .from("hostahack_submissions")
          .upsert(
            {
              hackathon_id: h.id,
              team_id: team.id,
              title: input.data.title,
              link: input.data.link || null,
              description: input.data.description,
              track_id: trackId,
              ai_review: null,
              judge_scores: null,
              final_score: null,
            },
            { onConflict: "team_id" },
          )
          .select("*")
          .single();
        if (error) throw new Error(error.message);
        const submission = saved as HackSubmission;
        const members = (await listParticipants(h.id)).filter((p) => p.team_id === team.id);
        const review = await reviewSubmission(h, submission, members);
        await db.from("hostahack_submissions").update({ ai_review: review }).eq("id", submission.id);
        if (h.status === "published") await updateHackathon(h.id, { status: "judging" });
        return NextResponse.json({ submission: { ...submission, ai_review: review } });
      }

      case "rescore": {
        const input = schemas.keyed.safeParse(body);
        if (!input.success || !input.data.submissionId) return fail("Invalid request");
        if (!(await canOperate(request, h, input.data.key))) return fail("Jury access needed.", 403);
        if (!(await spendBudget("score", h.id))) return fail("Scoring is busy. Try again shortly.", 429);
        const submission = (await listSubmissions(h.id)).find((s) => s.id === input.data.submissionId);
        if (!submission) return fail("Submission not found", 404);
        const members = (await listParticipants(h.id)).filter((p) => p.team_id === submission.team_id);
        const review = await reviewSubmission(h, submission, members);
        await db.from("hostahack_submissions").update({ ai_review: review }).eq("id", submission.id);
        return NextResponse.json({ review });
      }

      case "judge": {
        const input = schemas.judge.safeParse(body);
        if (!input.success) return fail("Invalid scores");
        if (!(await canOperate(request, h, input.data.key))) return fail("Jury access needed.", 403);
        const ids = new Set(h.design.rubric.map((c) => c.id));
        const scores = Object.fromEntries(Object.entries(input.data.scores).filter(([k]) => ids.has(k)));
        const final = weightedTotal(scores, h.design.rubric);
        await db
          .from("hostahack_submissions")
          .update({ judge_scores: scores, judge_note: input.data.note ?? null, final_score: final })
          .eq("id", input.data.submissionId)
          .eq("hackathon_id", h.id);
        return NextResponse.json({ final });
      }

      case "finalise": {
        if (!(await canOperate(request, h, body.key))) return fail("Jury access needed.", 403);
        const submissions = await listSubmissions(h.id);
        for (const s of submissions) {
          if (s.final_score == null && s.ai_review) {
            await db.from("hostahack_submissions").update({ final_score: s.ai_review.total }).eq("id", s.id);
          }
        }
        await updateHackathon(h.id, { status: "results", finalised_at: new Date().toISOString() });
        return NextResponse.json({ ok: true });
      }

      case "after": {
        if (!(await canOperate(request, h, body.key))) return fail("Jury access needed.", 403);
        if (!(await spendBudget("after", h.id))) return fail("Busy. Try again shortly.", 429);
        const [participants, teams, submissions] = await Promise.all([listParticipants(h.id), listTeams(h.id), listSubmissions(h.id)]);
        const after = await afterPack(h, participants, teams, submissions);
        await updateHackathon(h.id, { after });
        return NextResponse.json({ after });
      }

      default:
        return fail("Unknown action", 404);
    }
  } catch (error) {
    console.error(`hostahack.${action} failed`, error);
    return fail(error instanceof Error && error.message.includes("Grok") ? "Grok didn't respond in time. Try again." : "Something went wrong. Try again.", 502);
  }
}
