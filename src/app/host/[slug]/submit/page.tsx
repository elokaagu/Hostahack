import { SubmitForm } from "@/components/host/SubmitForm";
import { Card, Section, eyebrow } from "@/components/host/ui";
import { getBundle } from "@/lib/host/load";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HackSubmitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await getBundle(slug);
  if (!bundle) notFound();
  const { hackathon: h, teams, submissions } = bundle;
  const teamName = new Map(teams.map((t) => [t.id, t.name]));

  return (
    <div className="mt-10">
      {teams.length ? (
        <SubmitForm
          hackathonId={h.id}
          teams={teams.map((t) => ({ id: t.id, name: t.name, trackId: t.track_id }))}
          tracks={h.design.tracks.map((t) => ({ id: t.id, name: t.name }))}
          rubric={Object.fromEntries(h.design.rubric.map((c) => [c.id, c.name]))}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Submissions open once teams are formed.</p>
      )}

      <Section label={`${submissions.length} submitted`} title="Projects so far">
        <ul className="grid gap-4 md:grid-cols-2">
          {submissions.map((s) => (
            <Card key={s.id}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-base">{s.title}</p>
                {s.ai_review ? <span className="font-mono text-sm text-brand">{s.ai_review.total.toFixed(1)}</span> : null}
              </div>
              <p className={`${eyebrow} mt-1`}>{teamName.get(s.team_id)}</p>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{s.description}</p>
            </Card>
          ))}
        </ul>
      </Section>
    </div>
  );
}
