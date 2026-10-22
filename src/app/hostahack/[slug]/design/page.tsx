import { ActionButton } from "@/components/hostahack/ActionButton";
import { Card, Chip, PostLink, Section, eyebrow } from "@/components/hostahack/ui";
import { getBundle } from "@/lib/hostahack/load";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ key?: string }> };

export default async function HackDesignPage({ params, searchParams }: Props) {
  const [{ slug }, { key }] = await Promise.all([params, searchParams]);
  const bundle = await getBundle(slug);
  if (!bundle) notFound();
  const { hackathon: h } = bundle;
  const d = h.design;
  const r = h.research;
  const isOrganiser = Boolean(key && key === h.jury_key);

  return (
    <div>
      <div className="mt-10 rounded-3xl border border-brand/30 bg-brand/[0.06] p-6 md:p-8">
        <p className={`${eyebrow} text-brand`}>Design · generated from the client brief</p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Grok read {h.client_name}&apos;s brief and designed the tracks, weighted rubric, schedule, rules, prizes, mentor plan and success metrics,
          then searched X for what builders are posting about the theme and who to invite.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          {h.status === "draft" ? (
            isOrganiser ? (
              <ActionButton hackathonId={h.id} action="publish" body={{ key }} label="Publish the hackathon page" pendingLabel="Publishing…" />
            ) : (
              <span className="text-sm text-muted-foreground">Draft. The organiser publishes it from their console link.</span>
            )
          ) : (
            <Link href={`/hostahack/${h.slug}`} className="rounded-full bg-brand px-6 py-2.5 text-sm text-brand-foreground">
              Open the live hackathon page
            </Link>
          )}
        </div>
      </div>

      <details className="mt-8 rounded-2xl border border-border/50 p-5">
        <summary className="cursor-pointer text-sm text-muted-foreground">The client brief Grok worked from</summary>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{h.client_brief}</p>
      </details>

      <Section label="Live X research" title={r?.live ? "What builders are posting about this" : "X research"}>
        {r?.live ? (
          <>
            {r.hook ? <p className="max-w-3xl text-lg leading-relaxed">{r.hook}</p> : null}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {r.themes.map((t) => (
                <Card key={t.theme}>
                  <p className="text-sm">{t.theme}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{t.summary}</p>
                  <ul className="mt-4 space-y-2">
                    {t.posts.map((p) => (
                      <li key={p.url}>
                        <PostLink post={p} />
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
            {r.invite.length ? (
              <div className="mt-8">
                <p className={eyebrow}>Builders and mentors to invite · found on X</p>
                <ul className="mt-4 grid gap-3 md:grid-cols-2">
                  {r.invite.map((p) => (
                    <li key={p.handle}>
                      <a href={`https://x.com/${p.handle}`} target="_blank" rel="noreferrer" className="block rounded-2xl border border-border/50 p-4 transition-colors hover:border-brand">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm">
                            {p.name || p.handle} <span className="text-brand">@{p.handle} ↗</span>
                          </p>
                          <Chip tone={p.kind === "mentor" ? "brand" : "muted"}>{p.kind}</Chip>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{p.why}</p>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="mt-4 text-xs text-muted-foreground">
              {r.postsFetched ? `${r.postsFetched} X posts read` : "X search"} · {r.citations.length} cited sources
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{r?.note ?? "No X research for this hackathon."}</p>
        )}
      </Section>

      <div className="mt-14 grid gap-8 md:grid-cols-2">
        <Card>
          <p className={eyebrow}>Format</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>{d.date}</li>
            <li>{d.venue}</li>
            <li>{d.format}</li>
            <li>{d.capacity} places · {d.hashtag}</li>
          </ul>
        </Card>
        <Card>
          <p className={eyebrow}>Mentors to recruit</p>
          <ul className="mt-3 space-y-3 text-sm">
            {d.mentorNeeds.map((m) => (
              <li key={m.role}>
                <span>{m.role}</span>
                <p className="text-muted-foreground">{m.why}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className={eyebrow}>Weighted rubric</p>
          <ul className="mt-3 space-y-2 text-sm">
            {d.rubric.map((c) => (
              <li key={c.id}>
                <div className="flex justify-between gap-3">
                  <span>{c.name}</span>
                  <span className="font-mono text-xs text-brand">{c.weight}%</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-muted">
                  <div className="h-1 rounded-full bg-brand" style={{ width: `${Math.min(100, c.weight)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className={eyebrow}>Success metrics for {h.client_name}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {d.successMetrics.map((m) => (
              <li key={m.measure} className="flex justify-between gap-4">
                <span>{m.measure}</span>
                <span className="text-right text-muted-foreground">{m.target}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
