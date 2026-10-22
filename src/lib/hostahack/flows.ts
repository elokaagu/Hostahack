import "server-only";

import { completeJson } from "@/lib/ai/llm-client";
import { withVoice } from "@/lib/brand/voice";
import { grokJson, hasGrok, recentWindow } from "@/lib/hostbot/grok";
import type {
  AiReview,
  HackAfter,
  HackDesign,
  HackFeed,
  HackParticipant,
  HackResearch,
  HackSubmission,
  HackTeam,
  Hackathon,
  ParticipantProfile,
  TeamSuggestion,
  XPost,
} from "./types";

// ---------- helpers ----------

function str(value: unknown, max = 600): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function arr<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function num(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

export function normaliseHandle(raw: string): string | null {
  const handle = raw
    .trim()
    .replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0];
  return HANDLE_RE.test(handle) ? handle : null;
}

function isXUrl(url: string): boolean {
  return /^https:\/\/(x|twitter)\.com\//i.test(url);
}

function cleanPosts(value: unknown, max: number): XPost[] {
  return arr(value)
    .map((p) => ({
      handle: normaliseHandle(str(p.handle, 40)) ?? "",
      text: str(p.text, 280),
      url: str(p.url, 300),
    }))
    .filter((p) => p.handle && p.text && isXUrl(p.url))
    .slice(0, max);
}

function idOf(value: unknown, fallback: string): string {
  const s = str(value, 40).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return s || fallback;
}

function today(): string {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

async function smartJson<T>(system: string, user: string, timeoutMs = 100_000): Promise<{ data: T; engine: string }> {
  if (hasGrok()) {
    try {
      const { data } = await grokJson<T>({ system, user, timeoutMs });
      return { data, engine: "Grok" };
    } catch (error) {
      console.error("Hostahack Grok call failed, falling back:", error);
    }
  }
  const data = await completeJson<T>(system, `${user}\n\nKeep strings concise.`, { temperature: 0.5, model: "claude-haiku-4-5" });
  return { data, engine: "Claude (fallback)" };
}

// ---------- Design ----------

const DESIGN_SYSTEM = withVoice(
  `You are Hostahack, the hackathon designer Satellite Labs uses to run hackathons for clients.
From a client brief you design a hackathon that serves the client's commercial goal and gives builders a reason to come.
Tracks are real problems with a named host (the client, a partner or a target account) and a prize.
The rubric has 4 or 5 criteria whose weights sum to 100. Schedules are timed. Rules are short and enforceable.
Success metrics are measurable and tied to the client's goals.`,
);

export async function designHackathon(clientName: string, brief: string): Promise<{ design: HackDesign; engine: string }> {
  const context = `Today is ${today()}.
Client: ${clientName}
Client brief:
${brief.slice(0, 6000)}`;

  // Two smaller calls in parallel: Grok's output speed, not reasoning, sets the latency.
  const [core, ops] = await Promise.all([
    smartJson<Record<string, unknown>>(
      DESIGN_SYSTEM,
      `${context}

Design the event and its tracks. Return JSON:
{
  "title": string (max 6 words), "tagline": string (1 sentence), "theme": string (1 sentence),
  "hashtag": string (starts with #, no spaces), "date": string, "venue": string, "format": string (e.g. "One day, in person"),
  "capacity": number, "audience": string (who should apply, 1 sentence),
  "tracks": [{ "id": string (kebab-case), "name": string, "brief": string (2 sentences), "host": string, "prize": string }] (3 or 4),
  "prizes": [{ "name": string, "value": string }] (3 to 5)
}`,
      150_000,
    ),
    smartJson<Record<string, unknown>>(
      DESIGN_SYSTEM,
      `${context}

Design how the event runs and is judged. Return JSON:
{
  "rubric": [{ "id": string (kebab-case), "name": string, "weight": number, "description": string (1 sentence) }] (4 or 5, weights sum to 100),
  "schedule": [{ "time": string (HH:MM), "item": string }] (8 to 10),
  "rules": string[] (5 to 7, one sentence each),
  "mentorNeeds": [{ "role": string, "why": string }] (3 to 4),
  "successMetrics": [{ "measure": string, "target": string }] (4 to 5)
}`,
      150_000,
    ),
  ]);
  const data = { ...ops.data, ...core.data };
  const engine = core.engine === ops.engine ? core.engine : `${core.engine} + ${ops.engine}`;

  const tracks = arr(data.tracks)
    .map((t, i) => ({
      id: idOf(t.id ?? t.name, `track-${i + 1}`),
      name: str(t.name, 80),
      brief: str(t.brief, 500),
      host: str(t.host, 80),
      prize: str(t.prize, 120),
    }))
    .filter((t) => t.name)
    .slice(0, 5);

  let rubric = arr(data.rubric)
    .map((c, i) => ({
      id: idOf(c.id ?? c.name, `criterion-${i + 1}`),
      name: str(c.name, 60),
      weight: Math.max(1, num(c.weight, 20)),
      description: str(c.description, 240),
    }))
    .filter((c) => c.name)
    .slice(0, 6);
  const weightSum = rubric.reduce((s, c) => s + c.weight, 0);
  if (weightSum && weightSum !== 100) {
    rubric = rubric.map((c) => ({ ...c, weight: Math.round((c.weight / weightSum) * 100) }));
  }

  const hashtag = str(data.hashtag, 40).replace(/\s+/g, "");
  const design: HackDesign = {
    title: str(data.title, 80) || `${clientName} Build Day`,
    tagline: str(data.tagline, 200),
    theme: str(data.theme, 300),
    hashtag: hashtag.startsWith("#") ? hashtag : `#${hashtag || clientName.replace(/\W+/g, "")}BuildDay`,
    date: str(data.date, 80) || "Date to be confirmed",
    venue: str(data.venue, 120) || "London",
    format: str(data.format, 80) || "One day, in person",
    capacity: Math.max(10, Math.min(1000, num(data.capacity, 60))),
    audience: str(data.audience, 300),
    tracks,
    rubric,
    schedule: arr(data.schedule).map((s) => ({ time: str(s.time, 20), item: str(s.item, 160) })).filter((s) => s.item).slice(0, 12),
    rules: arr<unknown>(data.rules).map((r) => str(r, 200)).filter(Boolean).slice(0, 8),
    prizes: arr(data.prizes).map((p) => ({ name: str(p.name, 80), value: str(p.value, 120) })).filter((p) => p.name).slice(0, 6),
    mentorNeeds: arr(data.mentorNeeds).map((m) => ({ role: str(m.role, 80), why: str(m.why, 200) })).filter((m) => m.role).slice(0, 5),
    successMetrics: arr(data.successMetrics)
      .map((m) => ({ measure: str(m.measure, 120), target: str(m.target, 80) }))
      .filter((m) => m.measure)
      .slice(0, 6),
  };
  return { design, engine };
}

// ---------- X research ----------

const RESEARCH_SYSTEM = withVoice(
  `You research X for a hackathon organiser. Use the x_search tool.
Only report posts you actually found, with their real URLs. Never invent posts, handles or URLs.
Every person you suggest inviting must come with the URL of a post of theirs that you found.`,
);

/** Runs from the client brief so it can start in parallel with the design. */
export async function researchOnX(clientName: string, brief: string): Promise<HackResearch> {
  if (!hasGrok()) {
    return { live: false, hook: "", themes: [], invite: [], citations: [], postsFetched: null, note: "Live X research needs XAI_API_KEY." };
  }
  try {
    const { data, citations, postsFetched } = await grokJson<Record<string, unknown>>({
      system: RESEARCH_SYSTEM,
      user: `A hackathon for ${clientName}. Client brief (excerpt):
${brief.slice(0, 1800)}

Search X for what builders have posted in the last 45 days about the problems, tools and themes in this brief, with a bias to London and the UK.
Return JSON:
{
  "hook": string (1 sentence on what builders are talking about),
  "themes": [{ "theme": string (3 to 5 words), "summary": string, "posts": [{ "handle": string, "text": string, "url": string }] }] (3 themes, up to 2 posts each),
  "invite": [{ "handle": string, "name": string, "why": string, "kind": "builder" | "mentor", "url": string (a post of theirs you found) }] (6 people)
}`,
      xSearch: { fromDate: recentWindow(45), maxTurns: 3 },
      timeoutMs: 150_000,
    });

    const invite = arr(data.invite)
      .map((p) => {
        const handle = normaliseHandle(str(p.handle, 40)) ?? "";
        const url = str(p.url, 300);
        return {
          handle,
          name: str(p.name, 80),
          why: str(p.why, 240),
          kind: (p.kind === "mentor" ? "mentor" : "builder") as "builder" | "mentor",
          url,
        };
      })
      .filter((p) => p.handle && isXUrl(p.url) && (p.url.toLowerCase().includes(`/${p.handle.toLowerCase()}/`) || p.url.includes("/i/status/")))
      .slice(0, 8)
      .map(({ url: _url, ...rest }) => rest);

    return {
      live: true,
      hook: str(data.hook, 300),
      themes: arr(data.themes)
        .map((t) => ({ theme: str(t.theme, 60), summary: str(t.summary, 280), posts: cleanPosts(t.posts, 2) }))
        .filter((t) => t.theme)
        .slice(0, 4),
      invite,
      citations: citations.filter(isXUrl).slice(0, 15),
      postsFetched,
    };
  } catch (error) {
    console.error("Hostahack X research failed:", error);
    return { live: false, hook: "", themes: [], invite: [], citations: [], postsFetched: null, note: "X research didn't return in time." };
  }
}

// ---------- Live feed ----------

export async function fetchFeed(h: Hackathon): Promise<HackFeed> {
  const fetchedAt = new Date().toISOString();
  if (!hasGrok()) return { live: false, posts: [], summary: "", fetchedAt, postsFetched: null, note: "Live feed needs XAI_API_KEY." };
  try {
    const { data, postsFetched } = await grokJson<Record<string, unknown>>({
      system: withVoice("You curate a live X feed for a hackathon. Use x_search. Only include real posts you found, with real URLs."),
      user: `Hackathon: ${h.design.title} by ${h.client_name}. Hashtag ${h.design.hashtag}. Theme: ${h.design.theme}

Find up to 8 recent X posts that a participant would want in the event feed: posts using the hashtag, posts about ${h.client_name}, and posts about the theme from builders.
Return JSON: { "summary": string (1 sentence), "posts": [{ "handle": string, "text": string, "url": string }] }`,
      xSearch: { fromDate: recentWindow(14), maxTurns: 2 },
      timeoutMs: 90_000,
    });
    return { live: true, posts: cleanPosts(data.posts, 8), summary: str(data.summary, 300), fetchedAt, postsFetched };
  } catch (error) {
    console.error("Hostahack feed failed:", error);
    return { live: false, posts: [], summary: "", fetchedAt, postsFetched: null, note: "The X feed didn't load in time." };
  }
}

// ---------- Builder profile ----------

export async function profileFromX(
  h: Hackathon,
  handle: string,
  selfSkills: string[],
  interests: string,
): Promise<{ displayName: string; profile: ParticipantProfile }> {
  const trackList = h.design.tracks.map((t) => `${t.id}: ${t.name} — ${t.brief}`).join("\n");
  const fallback = (): { displayName: string; profile: ParticipantProfile } => ({
    displayName: `@${handle}`,
    profile: {
      headline: interests || "Builder",
      skills: selfSkills,
      interests: interests ? [interests] : [],
      builds: [],
      strengths: selfSkills.length ? `Says they work with ${selfSkills.join(", ")}.` : "",
      preferredTrackId: h.design.tracks[0]?.id ?? null,
      evidence: [],
      source: "self",
    },
  });
  if (!hasGrok()) return fallback();

  const { data } = await grokJson<Record<string, unknown>>({
    system: withVoice(
      `You build a short builder profile for a hackathon from a person's own public X posts. Use x_search on their handle.
Cite only posts you actually found. If you find nothing, say so in the headline and rely on what they told us.`,
    ),
    user: `Person: @${handle}
Skills they gave: ${selfSkills.join(", ") || "none given"}
Interests they gave: ${interests || "none given"}

Hackathon tracks:
${trackList}

Return JSON:
{
  "displayName": string,
  "headline": string (1 sentence: what they build),
  "skills": string[] (up to 6, from their posts and what they told us),
  "interests": string[] (up to 4),
  "builds": string[] (up to 3 things they have built or shipped, from their posts),
  "strengths": string (1 sentence on what they'd bring to a team),
  "preferredTrackId": string (one of the track ids),
  "evidence": [{ "handle": string, "text": string, "url": string }] (up to 2 of their posts)
}`,
    xSearch: { allowedHandles: [handle], fromDate: recentWindow(180), maxTurns: 2 },
    timeoutMs: 90_000,
  });

  const trackIds = new Set(h.design.tracks.map((t) => t.id));
  const preferred = str(data.preferredTrackId, 40);
  const skills = arr<unknown>(data.skills).map((s) => str(s, 40)).filter(Boolean);
  return {
    displayName: str(data.displayName, 80) || `@${handle}`,
    profile: {
      headline: str(data.headline, 240),
      skills: [...new Set([...skills, ...selfSkills])].slice(0, 8),
      interests: arr<unknown>(data.interests).map((s) => str(s, 60)).filter(Boolean).slice(0, 4),
      builds: arr<unknown>(data.builds).map((s) => str(s, 160)).filter(Boolean).slice(0, 3),
      strengths: str(data.strengths, 240),
      preferredTrackId: trackIds.has(preferred) ? preferred : (h.design.tracks[0]?.id ?? null),
      evidence: cleanPosts(data.evidence, 2),
      source: "x",
    },
  };
}

function participantLine(p: HackParticipant): string {
  const prof = p.profile;
  return `${p.id} | ${p.display_name} | ${prof?.headline ?? ""} | skills: ${(prof?.skills ?? p.skills).join(", ")} | track: ${prof?.preferredTrackId ?? "-"}`;
}

// ---------- Team matching ----------

export async function suggestTeam(
  h: Hackathon,
  me: HackParticipant,
  participants: HackParticipant[],
  teams: HackTeam[],
): Promise<TeamSuggestion> {
  const members = new Map<string, HackParticipant[]>();
  for (const p of participants) if (p.team_id) members.set(p.team_id, [...(members.get(p.team_id) ?? []), p]);
  const openTeams = teams.filter((t) => (members.get(t.id)?.length ?? 0) < 4);
  const solo = participants.filter((p) => !p.team_id && p.id !== me.id);

  const teamBlock = openTeams
    .map((t) => `${t.id} | ${t.name} | track ${t.track_id ?? "-"} | members: ${(members.get(t.id) ?? []).map((m) => `${m.display_name} (${(m.profile?.skills ?? m.skills).slice(0, 3).join(", ")})`).join("; ")}`)
    .join("\n");

  const { data } = await smartJson<Record<string, unknown>>(
    withVoice(
      `You match a new hackathon participant to the team where they add the most. Balance skills (product, design, frontend, backend, hardware, ML, data) and shared interests.
Prefer an existing team with an open seat that lacks this person's skills. Name the gap they fill.`,
    ),
    `Hackathon tracks: ${h.design.tracks.map((t) => `${t.id}: ${t.name}`).join("; ")}

New participant:
${participantLine(me)}
Strengths: ${me.profile?.strengths ?? ""}

Teams with an open seat (id | name | track | members):
${teamBlock || "none"}

Participants without a team:
${solo.map(participantLine).join("\n") || "none"}

Return JSON:
{ "teamId": string | null (an open team id, or null to start a new team), "why": string (1 to 2 sentences), "role": string (their role in the team),
  "teammates": [{ "participantId": string, "why": string }] (2 or 3 people: team members if joining a team, else people without a team) }`,
    90_000,
  );

  const team = openTeams.find((t) => t.id === str(data.teamId, 40)) ?? null;
  const validIds = new Set(participants.map((p) => p.id));
  return {
    teamId: team?.id ?? null,
    teamName: team?.name ?? null,
    why: str(data.why, 400),
    role: str(data.role, 80),
    teammates: arr(data.teammates)
      .map((t) => ({ participantId: str(t.participantId, 40), why: str(t.why, 240) }))
      .filter((t) => validIds.has(t.participantId) && t.participantId !== me.id)
      .slice(0, 3),
  };
}

export async function formTeams(
  h: Hackathon,
  solo: HackParticipant[],
): Promise<{ name: string; trackId: string | null; rationale: string; memberIds: string[] }[]> {
  if (solo.length < 2) return [];
  const { data } = await smartJson<Record<string, unknown>>(
    withVoice(
      `You form balanced hackathon teams of 3 or 4. Each team needs a mix of skills that can ship a demo in a day, and a track that fits its members.
Give each team a short name and one sentence on why the mix works.`,
    ),
    `Tracks: ${h.design.tracks.map((t) => `${t.id}: ${t.name}`).join("; ")}

Participants without a team:
${solo.map(participantLine).join("\n")}

Return JSON: { "teams": [{ "name": string, "trackId": string, "rationale": string, "memberIds": string[] }] }
Use every participant exactly once. Teams of 3 or 4; a team of 2 only if nothing else works.`,
    120_000,
  );

  const pool = new Set(solo.map((p) => p.id));
  const trackIds = new Set(h.design.tracks.map((t) => t.id));
  const out: { name: string; trackId: string | null; rationale: string; memberIds: string[] }[] = [];
  for (const t of arr(data.teams)) {
    const memberIds = arr<unknown>(t.memberIds).map((m) => str(m, 40)).filter((m) => pool.has(m));
    memberIds.forEach((m) => pool.delete(m));
    if (memberIds.length < 2) continue;
    const trackId = str(t.trackId, 40);
    out.push({ name: str(t.name, 60) || `Team ${out.length + 1}`, trackId: trackIds.has(trackId) ? trackId : null, rationale: str(t.rationale, 300), memberIds });
  }
  return out;
}

// ---------- Scoring ----------

export async function reviewSubmission(h: Hackathon, s: HackSubmission, teamMembers: HackParticipant[]): Promise<AiReview> {
  const track = h.design.tracks.find((t) => t.id === s.track_id);
  const { data, engine } = await smartJson<Record<string, unknown>>(
    withVoice(
      `You pre-score hackathon submissions for human judges. Score each criterion from 1 to 10 with one concrete sentence of reasoning.
Be calibrated: 5 is a typical one-day hack, 8 is notable, 10 is exceptional. Name strengths and the questions judges should ask on stage.`,
    ),
    `Hackathon: ${h.design.title} for ${h.client_name}. Theme: ${h.design.theme}
Track: ${track ? `${track.name} — ${track.brief}` : "none chosen"}
Rubric (id | name | weight | description):
${h.design.rubric.map((c) => `${c.id} | ${c.name} | ${c.weight} | ${c.description}`).join("\n")}

Submission: ${s.title}
Link: ${s.link ?? "none"}
Description: ${s.description}
Team: ${teamMembers.map((m) => `${m.display_name} (${(m.profile?.skills ?? m.skills).slice(0, 3).join(", ")})`).join("; ")}

Return JSON:
{ "scores": [{ "criterionId": string, "score": number, "reason": string }] (one per rubric criterion),
  "summary": string (1 to 2 sentences), "strengths": string[] (2 to 3), "questions": string[] (2) }`,
    100_000,
  );

  const ids = new Set(h.design.rubric.map((c) => c.id));
  const scores = arr(data.scores)
    .map((x) => ({ criterionId: str(x.criterionId, 40), score: Math.max(1, Math.min(10, Math.round(num(x.score, 5) * 10) / 10)), reason: str(x.reason, 300) }))
    .filter((x) => ids.has(x.criterionId));
  const map = Object.fromEntries(scores.map((x) => [x.criterionId, x.score]));
  const totalWeight = h.design.rubric.reduce((sum, c) => sum + c.weight, 0) || 1;
  const total = Math.round((h.design.rubric.reduce((sum, c) => sum + (map[c.id] ?? 0) * c.weight, 0) / totalWeight) * 10) / 10;

  return {
    scores,
    total,
    summary: str(data.summary, 400),
    strengths: arr<unknown>(data.strengths).map((x) => str(x, 200)).filter(Boolean).slice(0, 3),
    questions: arr<unknown>(data.questions).map((x) => str(x, 200)).filter(Boolean).slice(0, 3),
    engine,
    reviewedAt: new Date().toISOString(),
  };
}

// ---------- After ----------

export async function afterPack(
  h: Hackathon,
  participants: HackParticipant[],
  teams: HackTeam[],
  submissions: HackSubmission[],
): Promise<HackAfter> {
  const teamName = new Map(teams.map((t) => [t.id, t.name]));
  const ranked = [...submissions].sort((a, b) => (b.final_score ?? b.ai_review?.total ?? 0) - (a.final_score ?? a.ai_review?.total ?? 0));
  const { data } = await smartJson<Record<string, unknown>>(
    withVoice(
      `You plan what happens after a hackathon so the community stays active and the client's goals are met.
Follow-ups are short personal messages tied to what each person built. Champions are people likely to advocate for the client's product inside their organisation or community.
Next events build on what this room responded to.`,
    ),
    `Client: ${h.client_name}. Hackathon: ${h.design.title}. Client goals (success metrics): ${h.design.successMetrics.map((m) => `${m.measure}: ${m.target}`).join("; ")}

Results (rank | team | project | score):
${ranked.map((s, i) => `${i + 1} | ${teamName.get(s.team_id) ?? "-"} | ${s.title} | ${s.final_score ?? s.ai_review?.total ?? "-"}`).join("\n")}

Participants (id | name | headline | skills | team):
${participants.map((p) => `${p.id} | ${p.display_name} | ${p.profile?.headline ?? ""} | ${(p.profile?.skills ?? p.skills).slice(0, 4).join(", ")} | ${p.team_id ? teamName.get(p.team_id) : "no team"}`).join("\n")}

Return JSON:
{ "followUps": [{ "participantId": string, "message": string, "why": string }] (6),
  "champions": [{ "participantId": string, "reason": string }] (4),
  "nextEvents": [{ "title": string, "when": string, "why": string }] (3),
  "scorecard": [{ "measure": string, "status": string }] (one per success metric, with what this hackathon achieved so far) }
Keep every message under 60 words.`,
    150_000,
  );

  const ids = new Set(participants.map((p) => p.id));
  return {
    followUps: arr(data.followUps)
      .map((f) => ({ participantId: str(f.participantId, 40), message: str(f.message, 500), why: str(f.why, 200) }))
      .filter((f) => ids.has(f.participantId) && f.message)
      .slice(0, 8),
    champions: arr(data.champions)
      .map((c) => ({ participantId: str(c.participantId, 40), reason: str(c.reason, 240) }))
      .filter((c) => ids.has(c.participantId))
      .slice(0, 6),
    nextEvents: arr(data.nextEvents).map((e) => ({ title: str(e.title, 80), when: str(e.when, 60), why: str(e.why, 240) })).filter((e) => e.title).slice(0, 4),
    scorecard: arr(data.scorecard).map((m) => ({ measure: str(m.measure, 120), status: str(m.status, 200) })).filter((m) => m.measure).slice(0, 6),
    generatedAt: new Date().toISOString(),
  };
}
