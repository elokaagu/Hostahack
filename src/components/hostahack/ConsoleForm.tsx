"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authedFetch } from "@/lib/authed-fetch";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { eyebrow } from "./ui";

const STEPS = [
  "Reading the client brief and their goals",
  "Designing tracks with real hosts and prizes",
  "Weighting the rubric and timing the schedule",
  "Writing rules, mentor needs and success metrics",
  "Searching X for what builders are posting about the theme",
  "Finding builders and mentors to invite, with the posts that prove it",
];

export function ConsoleForm({ defaultClient, defaultBrief }: { defaultClient: string; defaultBrief: string }) {
  const router = useRouter();
  const [clientName, setClientName] = useState(defaultClient);
  const [brief, setBrief] = useState(defaultBrief);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!pending) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 12_000);
    return () => clearInterval(t);
  }, [pending]);

  const design = () => {
    setError(null);
    startTransition(async () => {
      const res = await authedFetch("/api/hostahack/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, brief }),
      }).catch(() => null);
      const json = res ? ((await res.json().catch(() => null)) as { slug?: string; juryKey?: string; error?: string } | null) : null;
      if (!res?.ok || !json?.slug) {
        setError(json?.error ?? "Hostahack couldn't design that hackathon. Try again.");
        return;
      }
      router.push(`/hostahack/${json.slug}/design?key=${encodeURIComponent(json.juryKey ?? "")}`);
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={eyebrow} htmlFor="client">
          Client
        </label>
        <Input id="client" value={clientName} onChange={(e) => setClientName(e.target.value)} disabled={pending} className="mt-2 h-12 rounded-full px-5 text-base" />
      </div>
      <div>
        <label className={eyebrow} htmlFor="brief">
          Client brief: who they are, what they want from the hackathon, dates and targets
        </label>
        <Textarea id="brief" value={brief} onChange={(e) => setBrief(e.target.value)} disabled={pending} rows={14} className="mt-2 rounded-2xl p-5 text-sm leading-relaxed" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button size="lg" onClick={design} disabled={pending || clientName.trim().length < 2 || brief.trim().length < 40} className="rounded-full bg-brand px-8 text-brand-foreground hover:bg-brand/90">
          {pending ? "Designing the hackathon…" : "Design the hackathon"}
        </Button>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Grok · live X search · about 60 to 90 seconds</span>
      </div>
      {pending ? (
        <ol className="space-y-2 rounded-2xl border border-border/50 p-5">
          {STEPS.map((s, i) => (
            <li key={s} className={i === step ? "animate-pulse text-sm" : i < step ? "text-sm text-muted-foreground line-through decoration-brand/60" : "text-sm text-muted-foreground/50"}>
              <span className="mr-3 font-mono text-xs text-brand">{String(i + 1).padStart(2, "0")}</span>
              {s}
            </li>
          ))}
        </ol>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
