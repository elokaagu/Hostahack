import { FeedPanel } from "@/components/hostahack/FeedPanel";
import { Card, Section, eyebrow } from "@/components/hostahack/ui";
import { getBundle } from "@/lib/hostahack/load";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HackOverview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await getBundle(slug);
  if (!bundle) notFound();
  const { hackathon: h, participants, teams, submissions } = bundle;
  const d = h.design;

  const stats = [
    { value: participants.length, label: "Builders registered" },
    { value: teams.length, label: "Teams formed" },
    { value: submissions.length, label: "Projects submitted" },
    { value: d.capacity, label: "Places" },
  ];

  return (
    <div>
      <div className="mt-10 grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <p className="max-w-2xl text-lg leading-relaxed md:text-xl">{d.tagline}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{d.theme}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {d.date} · {d.venue} · {d.format} · {d.hashtag}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/hostahack/${h.slug}/register`} className="rounded-full bg-brand px-6 py-3 text-sm text-brand-foreground hover:bg-brand/90">
              Register with your X handle
            </Link>
            <Link href={`/hostahack/${h.slug}/teams`} className="rounded-full border border-border/60 px-6 py-3 text-sm hover:border-brand">
              See the teams
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <Card key={s.label} className="p-4">
              <p className="font-serif text-3xl">{s.value}</p>
              <p className={`${eyebrow} mt-1`}>{s.label}</p>
            </Card>
          ))}
        </div>
      </div>

      {d.audience ? (
        <p className="mt-8 max-w-3xl border-l-2 border-brand pl-4 text-sm leading-relaxed text-muted-foreground">Who should apply: {d.audience}</p>
      ) : null}

      <Section label="Tracks" title="Real problems, with a host and a prize">
        <p className="-mt-2 mb-5 text-xs text-muted-foreground">Track hosts are proposed by Hostahack from the client&apos;s target accounts until each one confirms.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {d.tracks.map((t) => (
            <Card key={t.id}>
              <p className="text-base text-foreground">{t.name}</p>
              <p className={`${eyebrow} mt-1`}>Hosted by {t.host}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.brief}</p>
              {t.prize ? <p className="mt-3 text-sm text-brand">Prize: {t.prize}</p> : null}
            </Card>
          ))}
        </div>
      </Section>

      <div className="mt-14 grid gap-8 md:grid-cols-2">
        <div>
          <p className={eyebrow}>Schedule</p>
          <ol className="mt-4 space-y-2">
            {d.schedule.map((s) => (
              <li key={`${s.time}-${s.item}`} className="flex gap-4 rounded-xl border border-border/40 px-4 py-3 text-sm">
                <span className="w-14 shrink-0 font-mono text-xs text-brand">{s.time}</span>
                <span>{s.item}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-8">
          <div>
            <p className={eyebrow}>Prizes</p>
            <ul className="mt-4 space-y-2">
              {d.prizes.map((p) => (
                <li key={p.name} className="flex justify-between gap-4 rounded-xl border border-border/40 px-4 py-3 text-sm">
                  <span>{p.name}</span>
                  <span className="text-right text-muted-foreground">{p.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={eyebrow}>Judging</p>
            <ul className="mt-4 space-y-2">
              {d.rubric.map((c) => (
                <li key={c.id} className="rounded-xl border border-border/40 px-4 py-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span>{c.name}</span>
                    <span className="font-mono text-xs text-brand">{c.weight}%</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={eyebrow}>Rules</p>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {d.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Section>
        <FeedPanel hackathonId={h.id} initial={h.feed} hashtag={d.hashtag} />
      </Section>
    </div>
  );
}
