import { ActionButton } from "@/components/hostahack/ActionButton";
import { JuryBoard } from "@/components/hostahack/JuryBoard";
import { Section, eyebrow } from "@/components/hostahack/ui";
import { getBundle } from "@/lib/hostahack/load";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ key?: string }> };

export default async function HackJuryPage({ params, searchParams }: Props) {
  const [{ slug }, { key }] = await Promise.all([params, searchParams]);
  const bundle = await getBundle(slug);
  if (!bundle) notFound();
  const { hackathon: h, submissions, teams } = bundle;

  if (!key || key !== h.jury_key) {
    return (
      <div className="mt-10 max-w-xl rounded-3xl border border-border/50 p-8">
        <p className={eyebrow}>Jury room</p>
        <h2 className="mt-2 font-serif text-3xl">Judges use their private link</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The organiser sends each judge a jury link. It opens every submission with Grok&apos;s pre-scores and reasons, ready to adjust and finalise.
        </p>
        <form className="mt-6 flex gap-2" action={`/hostahack/${h.slug}/jury`}>
          <input name="key" placeholder="Jury key" className="h-11 flex-1 rounded-full border border-border/60 bg-background px-4 text-sm" />
          <button className="rounded-full bg-brand px-5 text-sm text-brand-foreground">Open</button>
        </form>
      </div>
    );
  }

  const unscored = submissions.filter((s) => !s.ai_review).length;

  return (
    <div>
      <Section
        label={`Jury room · ${submissions.length} submissions`}
        title="Pre-scored by Grok. Finalised by people."
        action={
          <div className="flex flex-wrap items-start gap-3">
            <ActionButton hackathonId={h.id} action="finalise" body={{ key }} label={h.status === "results" ? "Re-publish results" : "Finalise and publish results"} pendingLabel="Publishing…" />
            <ActionButton hackathonId={h.id} action="after" body={{ key }} label="Draft follow-ups" pendingLabel="Grok is drafting…" variant="outline" />
            <Link href={`/hostahack/${h.slug}/results`} className="rounded-full border border-border/60 px-5 py-2 text-sm hover:border-brand">
              Results page
            </Link>
          </div>
        }
      >
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Sliders start at Grok&apos;s scores. Move any of them, add a note and save: the weighted total updates as you go, and the results page uses the judges&apos; scores.
          {unscored ? ` ${unscored} submissions are still being scored.` : ""}
        </p>
        <JuryBoard
          hackathonId={h.id}
          juryKey={key}
          submissions={submissions}
          rubric={h.design.rubric}
          teams={Object.fromEntries(teams.map((t) => [t.id, t.name]))}
          tracks={Object.fromEntries(h.design.tracks.map((t) => [t.id, t.name]))}
        />
      </Section>
    </div>
  );
}
