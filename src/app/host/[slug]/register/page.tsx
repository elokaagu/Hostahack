import { RegisterPanel } from "@/components/host/RegisterPanel";
import { getBundle } from "@/lib/host/load";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HackRegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await getBundle(slug);
  if (!bundle) notFound();
  const { hackathon: h, participants, teams } = bundle;

  const people = Object.fromEntries(participants.map((p) => [p.id, { name: p.display_name, headline: p.profile?.headline ?? "" }]));
  const teamRefs = Object.fromEntries(teams.map((t) => [t.id, { name: t.name, size: participants.filter((p) => p.team_id === t.id).length }]));
  const tracks = Object.fromEntries(h.design.tracks.map((t) => [t.id, t.name]));

  return (
    <div className="mt-10">
      <RegisterPanel slug={h.slug} hackathonId={h.id} open={h.status !== "draft"} people={people} teams={teamRefs} tracks={tracks} />
    </div>
  );
}
