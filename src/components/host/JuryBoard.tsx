"use client";

import { Button } from "@/components/ui/button";
import type { HackCriterion, HackSubmission } from "@/lib/host/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Chip, eyebrow } from "./ui";

function weighted(scores: Record<string, number>, rubric: HackCriterion[]): number {
  const w = rubric.reduce((s, c) => s + c.weight, 0) || 1;
  return Math.round((rubric.reduce((s, c) => s + (scores[c.id] ?? 0) * c.weight, 0) / w) * 10) / 10;
}

function SubmissionRow({
  s,
  rubric,
  teamName,
  trackName,
  hackathonId,
  juryKey,
}: {
  s: HackSubmission;
  rubric: HackCriterion[];
  teamName: string;
  trackName: string | null;
  hackathonId: string;
  juryKey: string;
}) {
  const router = useRouter();
  const ai = Object.fromEntries((s.ai_review?.scores ?? []).map((x) => [x.criterionId, x.score]));
  const [scores, setScores] = useState<Record<string, number>>(() => ({ ...ai, ...(s.judge_scores ?? {}) }));
  const [note, setNote] = useState(s.judge_note ?? "");
  const [saved, setSaved] = useState(s.final_score != null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const post = (action: string, body: Record<string, unknown>) =>
    startTransition(async () => {
      setError(null);
      const res = await fetch(`/api/host/${hackathonId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: juryKey, ...body }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? "Didn't save.");
        return;
      }
      if (action === "judge") setSaved(true);
      router.refresh();
    });

  const total = weighted(scores, rubric);

  return (
    <li className="rounded-3xl border border-border/50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-serif text-2xl">{s.title}</p>
          <p className={`${eyebrow} mt-1`}>
            {teamName}
            {trackName ? ` · ${trackName}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="font-serif text-4xl">{total.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">
            Grok {s.ai_review?.total.toFixed(1) ?? "–"} {saved ? <Chip tone="brand">Judged</Chip> : null}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
      {s.link ? (
        <a href={s.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-brand">
          {s.link} ↗
        </a>
      ) : null}
      {s.ai_review?.summary ? <p className="mt-4 rounded-xl bg-muted/30 p-3 text-sm">{s.ai_review.summary}</p> : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {rubric.map((c) => {
          const reason = s.ai_review?.scores.find((x) => x.criterionId === c.id)?.reason;
          return (
            <div key={c.id} className="rounded-xl border border-border/40 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {c.name} <span className="font-mono text-xs text-muted-foreground">{c.weight}%</span>
                </span>
                <span className="font-mono text-brand">{(scores[c.id] ?? 0).toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={scores[c.id] ?? 0}
                onChange={(e) => {
                  setSaved(false);
                  setScores((prev) => ({ ...prev, [c.id]: Number(e.target.value) }));
                }}
                className="mt-2 w-full accent-[hsl(var(--brand))]"
                aria-label={`${c.name} score`}
              />
              {reason ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Grok ({ai[c.id] ?? "–"}): {reason}</p> : null}
            </div>
          );
        })}
      </div>

      {s.ai_review?.questions.length ? (
        <div className="mt-4">
          <p className={eyebrow}>Ask on stage</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {s.ai_review.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <textarea
        value={note}
        onChange={(e) => {
          setSaved(false);
          setNote(e.target.value);
        }}
        rows={2}
        placeholder="Judge's note (optional)"
        className="mt-4 w-full rounded-xl border border-border/50 bg-background p-3 text-sm"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button disabled={pending} onClick={() => post("judge", { submissionId: s.id, scores, note })} className="rounded-full bg-brand px-6 text-brand-foreground hover:bg-brand/90">
          {pending ? "Saving…" : saved ? "Saved" : "Save scores"}
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => post("rescore", { submissionId: s.id })} className="rounded-full px-5">
          Ask Grok to rescore
        </Button>
        {error ? <span className="text-xs text-destructive">{error}</span> : null}
      </div>
    </li>
  );
}

export function JuryBoard({
  hackathonId,
  juryKey,
  submissions,
  rubric,
  teams,
  tracks,
}: {
  hackathonId: string;
  juryKey: string;
  submissions: HackSubmission[];
  rubric: HackCriterion[];
  teams: Record<string, string>;
  tracks: Record<string, string>;
}) {
  const ranked = [...submissions].sort((a, b) => (b.final_score ?? b.ai_review?.total ?? 0) - (a.final_score ?? a.ai_review?.total ?? 0));
  return (
    <ul className="space-y-6">
      {ranked.map((s) => (
        <SubmissionRow
          key={s.id}
          s={s}
          rubric={rubric}
          teamName={teams[s.team_id] ?? "Team"}
          trackName={s.track_id ? (tracks[s.track_id] ?? null) : null}
          hackathonId={hackathonId}
          juryKey={juryKey}
        />
      ))}
    </ul>
  );
}
