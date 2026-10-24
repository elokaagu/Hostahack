import { HostTour, type TourStep } from "@/components/host/HostTour";
import { getFlagshipDemo } from "@/lib/host/load";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demo walkthrough · Host",
  description: "A guided tour of Host: write a brief from scratch, and Grok designs, publishes and runs the hackathon.",
  robots: { index: false, follow: false },
};

export default async function HostVideoPage() {
  const example = await getFlagshipDemo().catch(() => null);
  const base = example ? `/host/${example.slug}` : null;

  const steps: TourStep[] = [
    {
      title: "The problem",
      caption:
        "Hackathons run on five tools at once: Discord, Google Forms, Devpost, spreadsheets and DMs. Host runs the whole event in one place, with Grok and live X search doing the work organisers do by hand.",
      src: "/host",
      seconds: 12,
    },
    {
      title: "Start from a blank brief",
      caption:
        "Say who is hosting and describe the event in a few sentences: who it's for, what to build, where and when. That's all Host needs to start.",
      src: "/host/console",
      seconds: 12,
    },
  ];

  if (base && example) {
    steps.push(
      {
        title: "Grok designs the event",
        caption:
          "From a short brief, Grok designed this one: theme, tracks, a weighted judging rubric, schedule and prizes, plus what builders are posting about the theme on X right now and who to invite.",
        src: `${base}/design?key=${encodeURIComponent(example.jury_key)}`,
        seconds: 14,
      },
      {
        title: "Publish the hackathon page",
        caption: "One click publishes a public page with tracks, schedule, prizes and rules, and a live feed of X posts about the event.",
        src: base,
        seconds: 12,
      },
      {
        title: "Register with an X handle",
        caption:
          "Builders sign up with their X handle. Grok reads their public posts and builds a profile of what they make and what they're good at.",
        src: `${base}/register`,
        seconds: 13,
      },
      {
        title: "Teams formed with reasons",
        caption: "Grok forms balanced teams from those profiles, with a reason for every match: complementary skills, shared interests and the track each team suits.",
        src: `${base}/teams`,
        seconds: 13,
      },
      {
        title: "Submit on the same site",
        caption: "Teams submit their project, repo and demo on the event page, so nothing gets lost across Devpost, forms and DMs.",
        src: `${base}/submit`,
        seconds: 10,
      },
      {
        title: "Jury: pre-scored against the rubric",
        caption: "Grok pre-scores every submission against the rubric and explains each score. Judges adjust, confirm and finalise in one view.",
        src: `${base}/jury?key=${encodeURIComponent(example.jury_key)}`,
        seconds: 14,
      },
      {
        title: "Results and what happens next",
        caption: "Results publish to the same page, and Grok drafts follow-ups so the community keeps building after the event. Now build your own.",
        src: `${base}/results`,
        seconds: 14,
      },
    );
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/host" className="font-mono text-xs uppercase tracking-[0.14em] text-brand">
            Host · Satellite Studio
          </Link>
          <Link href="/host/console" className="rounded-full bg-brand px-4 py-2 text-xs text-brand-foreground hover:bg-brand/90">
            Design your hackathon
          </Link>
        </div>
        <h1 className="mt-8 font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] md:text-6xl">Host, start to finish</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          A 2-minute guided tour. Every screen is the live product. The example event was designed by Grok from a short brief written from scratch. Use the arrow keys
          to skip and space to pause.
        </p>
        <div className="mt-8">
          <HostTour steps={steps} />
        </div>
      </div>
    </main>
  );
}
