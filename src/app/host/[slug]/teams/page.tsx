import { ActionButton } from "@/components/host/ActionButton";
import { Avatar, Card, Chip, Section, eyebrow } from "@/components/host/ui";
import { getBundle } from "@/lib/host/load";
import type { HackParticipant } from "@/lib/host/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function Person({ p }: { p: HackParticipant }) {
  return (
    <li className="flex items-start gap-3">
      <Avatar name={p.display_name} />
      <div className="min-w-0">
        <p className="text-sm">
          {p.display_name}{" "}
          {p.seeded ? (
            <span className="text-xs text-muted-foreground">· demo builder</span>
          ) : (
            <a href={`https://x.com/${p.x_handle}`} target="_blank" rel="noreferrer" className="text-xs text-brand">
              @{p.x_handle} ↗
            </a>
          )}
        </p>
        {p.profile?.headline ? <p className="text-xs leading-relaxed text-muted-foreground">{p.profile.headline}</p> : null}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {(p.profile?.skills ?? p.skills).slice(0, 4).map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        </div>
      </div>
    </li>
  );
}

export default async function HackTeamsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await getBundle(slug);
  if (!bundle) notFound();
  const { hackathon: h, participants, teams, submissions } = bundle;
  const tracks = new Map(h.design.tracks.map((t) => [t.id, t.name]));
  const solo = participants.filter((p) => !p.team_id);
  const submitted = new Set(submissions.map((s) => s.team_id));

  return (
    <div>
      <Section
        label={`${teams.length} teams · ${participants.length} builders`}
        title="Teams, matched by Grok"
        action={
          <Link href={`/host/${h.slug}/register`} className="rounded-full border border-border/60 px-4 py-2 text-sm hover:border-brand">
            Register and get matched
          </Link>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {teams.map((t) => {
            const members = participants.filter((p) => p.team_id === t.id);
            return (
              <Card key={t.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base">{t.name}</p>
                  <div className="flex gap-1.5">
                    {t.track_id && tracks.get(t.track_id) ? <Chip tone="brand">{tracks.get(t.track_id)}</Chip> : null}
                    {submitted.has(t.id) ? <Chip>Submitted</Chip> : members.length < 4 ? <Chip>{4 - members.length} open</Chip> : null}
                  </div>
                </div>
                {t.rationale ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.rationale}</p> : null}
                <ul className="mt-4 space-y-3">
                  {members.map((p) => (
                    <Person key={p.id} p={p} />
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section
        label="Waiting for a team"
        title={solo.length ? `${solo.length} builders without a team` : "Everyone has a team"}
        action={
          solo.length >= 2 ? (
            <ActionButton hackathonId={h.id} action="form-teams" label="Form balanced teams with Grok" pendingLabel="Grok is balancing the teams…" />
          ) : null
        }
      >
        {solo.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {solo.map((p) => (
              <Card key={p.id}>
                <ul>
                  <Person p={p} />
                </ul>
              </Card>
            ))}
          </ul>
        ) : (
          <p className={eyebrow}>New registrations are matched to a team as they arrive.</p>
        )}
      </Section>
    </div>
  );
}
