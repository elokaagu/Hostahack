"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HackParticipant } from "@/lib/host/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Chip, PostLink, eyebrow } from "./ui";

type PersonRef = { name: string; headline: string };
type TeamRef = { name: string; size: number };

const STEPS = ["Reading your public posts on X", "Building your builder profile", "Finding the team where you add the most"];

export function RegisterPanel({
  slug,
  hackathonId,
  open,
  people,
  teams,
  tracks,
}: {
  slug: string;
  hackathonId: string;
  open: boolean;
  people: Record<string, PersonRef>;
  teams: Record<string, TeamRef>;
  tracks: Record<string, string>;
}) {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [me, setMe] = useState<HackParticipant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [joining, startJoin] = useTransition();
  const [joined, setJoined] = useState<string | null>(null);

  useEffect(() => {
    if (!pending) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 9000);
    return () => clearInterval(t);
  }, [pending]);

  const register = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/host/${hackathonId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8),
          interests,
        }),
      });
      const json = (await res.json().catch(() => null)) as { participant?: HackParticipant; error?: string } | null;
      if (!res.ok || !json?.participant) {
        setError(json?.error ?? "Registration didn't go through. Try again.");
        return;
      }
      setMe(json.participant);
    });
  };

  const join = (teamId: string | null) => {
    if (!me) return;
    startJoin(async () => {
      const res = await fetch(`/api/host/${hackathonId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: me.id, teamId }),
      });
      const json = (await res.json().catch(() => null)) as { teamId?: string; error?: string } | null;
      if (!res.ok || !json?.teamId) {
        setError(json?.error ?? "Couldn't join that team.");
        return;
      }
      setJoined(json.teamId);
      router.refresh();
    });
  };

  const profile = me?.profile;
  const suggestion = me?.suggestion;

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
      <div className="rounded-3xl border border-brand/30 bg-brand/[0.06] p-6">
        <p className={`${eyebrow} text-brand`}>Register</p>
        <h2 className="mt-2 font-serif text-3xl tracking-tight">One field: your X handle</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Grok reads your recent public posts to build your profile and match you to a team. Skills and interests are optional.
        </p>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (handle.trim()) register();
          }}
        >
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@yourhandle" disabled={pending || !open || Boolean(me)} className="h-12 rounded-full px-5" autoComplete="off" spellCheck={false} />
          <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills, comma separated (optional)" disabled={pending || !open || Boolean(me)} className="h-11 rounded-full px-5" />
          <Input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="What you want to build (optional)" disabled={pending || !open || Boolean(me)} className="h-11 rounded-full px-5" />
          <Button type="submit" size="lg" disabled={pending || !open || !handle.trim() || Boolean(me)} className="h-12 w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
            {pending ? "Grok is reading your posts…" : me ? "Registered" : "Register and find my team"}
          </Button>
        </form>
        {!open ? <p className="mt-3 text-xs text-muted-foreground">Registration opens when the organiser publishes the hackathon.</p> : null}
        {pending ? (
          <ol className="mt-5 space-y-1.5">
            {STEPS.map((s, i) => (
              <li key={s} className={i === step ? "animate-pulse text-sm" : i < step ? "text-sm text-muted-foreground line-through" : "text-sm text-muted-foreground/50"}>
                <span className="mr-2 font-mono text-xs text-brand">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        ) : null}
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </div>

      <div>
        {me && profile ? (
          <div className="space-y-5">
            <div className="rounded-3xl border border-border/50 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={eyebrow}>Your builder profile · @{me.x_handle}</p>
                <Chip tone={profile.source === "x" ? "brand" : "muted"}>{profile.source === "x" ? "Built from your X posts" : "From what you told us"}</Chip>
              </div>
              <p className="mt-3 font-serif text-2xl">{me.display_name}</p>
              {profile.headline ? <p className="mt-2 text-sm leading-relaxed">{profile.headline}</p> : null}
              {profile.skills.length ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </div>
              ) : null}
              {profile.builds.length ? (
                <div className="mt-4">
                  <p className={eyebrow}>Things you&apos;ve shipped</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {profile.builds.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {profile.preferredTrackId && tracks[profile.preferredTrackId] ? (
                <p className="mt-4 text-sm">
                  Best-fit track: <span className="text-brand">{tracks[profile.preferredTrackId]}</span>
                </p>
              ) : null}
              {profile.evidence.length ? (
                <div className="mt-4 space-y-2">
                  <p className={eyebrow}>Based on</p>
                  {profile.evidence.map((p) => (
                    <PostLink key={p.url} post={p} />
                  ))}
                </div>
              ) : null}
            </div>

            {suggestion ? (
              <div className="rounded-3xl border border-brand/40 p-6">
                <p className={`${eyebrow} text-brand`}>Your team match</p>
                <p className="mt-3 font-serif text-2xl">
                  {suggestion.teamId ? `Join ${suggestion.teamName ?? teams[suggestion.teamId]?.name ?? "this team"}` : "Start a new team"}
                </p>
                {suggestion.role ? <p className="mt-1 text-sm text-muted-foreground">Your role: {suggestion.role}</p> : null}
                <p className="mt-3 text-sm leading-relaxed">{suggestion.why}</p>
                {suggestion.teammates.length ? (
                  <ul className="mt-4 space-y-3">
                    {suggestion.teammates.map((t) => (
                      <li key={t.participantId} className="rounded-xl border border-border/40 p-3 text-sm">
                        <span>{people[t.participantId]?.name ?? "A builder"}</span>
                        <span className="text-muted-foreground"> · {people[t.participantId]?.headline}</span>
                        <p className="mt-1 text-muted-foreground">{t.why}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {joined ? (
                    <Link href={`/host/${slug}/teams`} className="rounded-full bg-brand px-6 py-2.5 text-sm text-brand-foreground">
                      You&apos;re in. See your team
                    </Link>
                  ) : (
                    <>
                      <Button disabled={joining} onClick={() => join(suggestion.teamId)} className="rounded-full bg-brand px-6 text-brand-foreground hover:bg-brand/90">
                        {joining ? "Joining…" : suggestion.teamId ? "Join this team" : "Start the team"}
                      </Button>
                      {suggestion.teamId ? (
                        <Button variant="outline" disabled={joining} onClick={() => join(null)} className="rounded-full px-6">
                          Start my own team
                        </Button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/60 p-8 text-sm leading-relaxed text-muted-foreground">
            <p className={eyebrow}>What happens next</p>
            <ol className="mt-4 list-decimal space-y-2 pl-5">
              <li>Grok reads your last six months of public posts on X.</li>
              <li>You get a builder profile: skills, things you&apos;ve shipped and your best-fit track, with the posts it came from.</li>
              <li>Grok matches you to the team with an open seat that needs your skills, and tells you why.</li>
              <li>One click and you&apos;re on the team. No #looking-for-team channel.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
