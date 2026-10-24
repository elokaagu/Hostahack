"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { HackSubmission } from "@/lib/host/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { eyebrow } from "./ui";

export function SubmitForm({
  hackathonId,
  teams,
  tracks,
  rubric,
}: {
  hackathonId: string;
  teams: { id: string; name: string; trackId: string | null }[];
  tracks: { id: string; name: string }[];
  rubric: Record<string, string>;
}) {
  const router = useRouter();
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [trackId, setTrackId] = useState(teams[0]?.trackId ?? tracks[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<HackSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/host/${hackathonId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, trackId, title, link, description }),
      });
      const json = (await res.json().catch(() => null)) as { submission?: HackSubmission; error?: string } | null;
      if (!res.ok || !json?.submission) {
        setError(json?.error ?? "Submission didn't go through.");
        return;
      }
      setResult(json.submission);
      router.refresh();
    });
  };

  const select = "h-11 w-full rounded-full border border-border/60 bg-background px-4 text-sm";

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
      <form
        className="space-y-3 rounded-3xl border border-border/50 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <p className={eyebrow}>Submit your project</p>
        <select
          className={select}
          value={teamId}
          onChange={(e) => {
            setTeamId(e.target.value);
            const t = teams.find((x) => x.id === e.target.value);
            if (t?.trackId) setTrackId(t.trackId);
          }}
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select className={select} value={trackId} onChange={(e) => setTrackId(e.target.value)}>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" className="h-11 rounded-full px-4" />
        <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Repo or demo link (optional)" className="h-11 rounded-full px-4" />
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="What you built, who it's for and how it works" className="rounded-2xl p-4" />
        <Button type="submit" disabled={pending || !teamId || title.trim().length < 3 || description.trim().length < 30} className="h-11 w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
          {pending ? "Grok is scoring it against the rubric…" : "Submit and get scored"}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>

      <div>
        {result?.ai_review ? (
          <div className="rounded-3xl border border-brand/40 p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className={`${eyebrow} text-brand`}>Grok&apos;s pre-score</p>
              <p className="font-serif text-4xl">{result.ai_review.total.toFixed(1)}</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{result.ai_review.summary}</p>
            <ul className="mt-4 space-y-2">
              {result.ai_review.scores.map((s) => (
                <li key={s.criterionId} className="rounded-xl border border-border/40 p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span>{rubric[s.criterionId] ?? s.criterionId}</span>
                    <span className="font-mono text-brand">{s.score}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.reason}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">Human judges see this, adjust it and finalise the results.</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/60 p-8 text-sm leading-relaxed text-muted-foreground">
            Every submission is pre-scored against the weighted rubric the moment it lands, with a reason for each score and the questions judges should ask on stage.
          </div>
        )}
      </div>
    </div>
  );
}
