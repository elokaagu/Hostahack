import { Avatar, Card, Chip, Section, eyebrow } from "@/components/hostahack/ui";
import { getBundle } from "@/lib/hostahack/load";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HackResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await getBundle(slug);
  if (!bundle) notFound();
  const { hackathon: h, submissions, teams, participants } = bundle;

  const teamName = new Map(teams.map((t) => [t.id, t.name]));
  const people = new Map(participants.map((p) => [p.id, p]));
  const score = (s: (typeof submissions)[number]) => s.final_score ?? s.ai_review?.total ?? 0;
  const ranked = [...submissions].sort((a, b) => score(b) - score(a));
  const final = h.status === "results";

  const trackWinners = h.design.tracks
    .map((t) => ({ track: t, winner: ranked.find((s) => s.track_id === t.id) }))
    .filter((x) => x.winner);

  return (
    <div>
      <Section label={final ? "Final results" : "Provisional ranking"} title={final ? "Results" : "Live ranking, before the jury finalises"}>
        {ranked.length ? (
          <ol className="space-y-3">
            {ranked.map((s, i) => (
              <li key={s.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/50 p-5">
                <span className="w-10 font-serif text-3xl text-brand">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-base">{s.title}</p>
                  <p className={`${eyebrow} mt-1`}>
                    {teamName.get(s.team_id)} · {participants.filter((p) => p.team_id === s.team_id).map((p) => p.display_name).join(", ")}
                  </p>
                  {s.judge_note ? <p className="mt-2 text-sm text-muted-foreground">Jury: {s.judge_note}</p> : null}
                </div>
                <div className="text-right">
                  <p className="font-serif text-3xl">{score(s).toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">{s.final_score != null ? "Jury score" : "Grok pre-score"}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        )}
      </Section>

      {trackWinners.length ? (
        <Section label="Track prizes">
          <div className="grid gap-4 md:grid-cols-2">
            {trackWinners.map(({ track, winner }) => (
              <Card key={track.id}>
                <p className={eyebrow}>{track.name}</p>
                <p className="mt-2 text-base">{winner!.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {teamName.get(winner!.team_id)} · {track.prize}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {h.after ? (
        <>
          <Section label="After the hackathon" title="Keeping the community active">
            <div className="grid gap-4 md:grid-cols-3">
              {h.after.nextEvents.map((e) => (
                <Card key={e.title}>
                  <p className={eyebrow}>{e.when}</p>
                  <p className="mt-2 text-base">{e.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{e.why}</p>
                </Card>
              ))}
            </div>
          </Section>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <p className={eyebrow}>Follow-ups drafted</p>
              <ul className="mt-4 space-y-3">
                {h.after.followUps.map((f) => {
                  const p = people.get(f.participantId);
                  return (
                    <li key={f.participantId} className="rounded-2xl border border-border/50 p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar name={p?.display_name ?? "?"} />
                        <span>To {p?.display_name}</span>
                      </div>
                      <p className="mt-3 leading-relaxed">{f.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{f.why}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="space-y-8">
              <div>
                <p className={eyebrow}>Likely champions for {h.client_name}</p>
                <ul className="mt-4 space-y-3">
                  {h.after.champions.map((c) => (
                    <li key={c.participantId} className="rounded-2xl border border-border/50 p-4 text-sm">
                      <span>{people.get(c.participantId)?.display_name}</span>
                      <p className="mt-1 text-muted-foreground">{c.reason}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className={eyebrow}>Scorecard against {h.client_name}&apos;s goals</p>
                <ul className="mt-4 space-y-2">
                  {h.after.scorecard.map((m) => (
                    <li key={m.measure} className="rounded-xl border border-border/40 px-4 py-3 text-sm">
                      <span>{m.measure}</span>
                      <p className="mt-1 text-muted-foreground">{m.status}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Section>
          <Chip>Follow-ups appear here once the jury drafts them</Chip>
        </Section>
      )}
    </div>
  );
}
