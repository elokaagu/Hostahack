import { getFlagshipDemo } from "@/lib/hostahack/load";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hostahack · Satellite Studio",
  description:
    "The hackathon operating system Satellite Labs uses to design, build and run hackathons for clients. Grok designs the event, reads X to find builders, matches teams and pre-scores every submission.",
  robots: { index: false, follow: false },
};

const eyebrow = "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground";

const COMPARISON = [
  {
    stage: "Design the event",
    today: "Weeks of docs and calls to agree tracks, rubric, schedule, rules and prizes.",
    hostahack: "Paste the client brief. Grok returns tracks with hosts and prizes, a weighted rubric, a timed schedule, rules, mentor needs and success metrics.",
    hours: ["20 h", "1 h"],
  },
  {
    stage: "Find builders and mentors",
    today: "Scrolling X and LinkedIn, then cold DMs from a spreadsheet.",
    hostahack: "Grok searches X for who is posting about the theme and returns people to invite, each with the post that shows why.",
    hours: ["12 h", "1 h"],
  },
  {
    stage: "Registration",
    today: "A 15-question Google Form, then someone reads every answer.",
    hostahack: "One field: an X handle. Grok builds a profile from the builder's own posts in about 20 seconds.",
    hours: ["8 h", "0 h"],
  },
  {
    stage: "Teams",
    today: "A #looking-for-team channel in Discord and the first two hours of the event lost.",
    hostahack: "Each builder is matched to the team with an open seat that needs their skills, with the reason, on registration.",
    hours: ["4 h", "0.5 h"],
  },
  {
    stage: "Live buzz",
    today: "Screenshots of posts pasted into Discord.",
    hostahack: "A live X feed of the hashtag and the theme on the event page.",
    hours: ["6 h", "0 h"],
  },
  {
    stage: "Judging",
    today: "Devpost plus a scoring spreadsheet; judges read every README cold.",
    hostahack: "Every submission is pre-scored against the weighted rubric with reasons and stage questions. Judges move sliders and finalise.",
    hours: ["8 h", "0.5 h"],
  },
  {
    stage: "After",
    today: "A thank-you email, if anyone has time.",
    hostahack: "Personal follow-ups, likely champions for the client and the next three events, drafted from what people built.",
    hours: ["10 h", "1 h"],
  },
];

const STAGES = [
  { n: "01", name: "Design", body: "Grok turns a client brief into a complete hackathon design and researches X for builders and mentors worth inviting." },
  { n: "02", name: "Build", body: "One click publishes a branded hackathon page with tracks, schedule, prizes, rules and registration." },
  { n: "03", name: "Run", body: "Builders register with an X handle, get a profile and a team match, follow the live X feed and submit. Grok pre-scores every project." },
  { n: "04", name: "After", body: "Judges finalise, results publish, and Grok drafts the follow-ups that keep the community building with the client." },
];

export default async function HostahackLanding() {
  const demo = await getFlagshipDemo().catch(() => null);
  const base = demo ? `/hostahack/${demo.slug}` : null;
  const juryKey = demo ? encodeURIComponent(demo.jury_key) : "";

  const links = base
    ? [
        { href: base, label: "Hackathon page", body: "What builders see: tracks, schedule, prizes, rules and the live X feed." },
        { href: `${base}/design?key=${juryKey}`, label: "Design", body: "The full design Grok produced from Caligra's brief, with the X research." },
        { href: `${base}/register`, label: "Register yourself", body: "Enter your X handle. Get your profile and a team match in under a minute." },
        { href: `${base}/teams`, label: "Teams", body: "Balanced teams with the reason each mix works." },
        { href: `${base}/jury?key=${juryKey}`, label: "Jury room", body: "Grok's pre-scores with reasons. Adjust, save and finalise." },
        { href: `${base}/results`, label: "Results and after", body: "Ranking, track prizes, follow-ups, champions and next events." },
      ]
    : [];

  const today = COMPARISON.reduce((s, r) => s + parseFloat(r.hours[0]), 0);
  const withHostahack = COMPARISON.reduce((s, r) => s + parseFloat(r.hours[1]), 0);

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand">Hostahack · Satellite Studio</p>
          <Link href="/hostahack/console" className="rounded-full border border-border/60 px-4 py-2 text-xs text-muted-foreground hover:border-brand hover:text-foreground">
            Operator console
          </Link>
        </div>

        <h1 className="mt-10 max-w-4xl font-serif text-5xl font-normal leading-[0.98] tracking-[-0.03em] md:text-7xl lg:text-8xl">
          Hackathons that run themselves around the builders.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Hostahack is the operating system Satellite Labs uses to design, build and run hackathons for clients. Grok designs the event from a brief, reads X to find
          the right builders, matches teams, keeps a live feed, pre-scores every submission and drafts the follow-ups.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          {base ? (
            <Link href={base} className="rounded-full bg-brand px-7 py-3.5 text-sm text-brand-foreground hover:bg-brand/90">
              Open the Caligra build day
            </Link>
          ) : null}
          {base ? (
            <Link href={`${base}/register`} className="rounded-full border border-border/60 px-7 py-3.5 text-sm hover:border-brand">
              Register with your X handle
            </Link>
          ) : null}
          <Link href="/hostahack/console" className="rounded-full border border-border/60 px-7 py-3.5 text-sm hover:border-brand">
            Design your own hackathon
          </Link>
        </div>

        {links.length ? (
          <section className="mt-20">
            <p className={eyebrow}>For the jury · live demo with Caligra</p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">{demo?.design.title}: every stage, live</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Caligra makes Workbench and the c100 Developer Terminal. Satellite is running its first London build day. This demo was designed from Caligra&apos;s real
              brief with live Grok and X search; the builders, teams and projects in it are demo participants so you can see a full event, and you can register
              yourself. The jury links below include the jury key.
            </p>
            <ul className="mt-8 grid gap-3 md:grid-cols-3">
              {links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="block h-full rounded-2xl border border-border/50 p-5 transition-colors hover:border-brand">
                    <p className="text-base">
                      {l.label} <span className="text-brand">→</span>
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.body}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-20">
          <p className={eyebrow}>Four stages, one system</p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {STAGES.map((s) => (
              <div key={s.n} className="rounded-2xl border border-border/50 p-5">
                <span className="font-mono text-xs text-brand">{s.n}</span>
                <p className="mt-4 text-xl">{s.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <p className={eyebrow}>Against Discord, Google Forms, Devpost and spreadsheets</p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
            {today} organiser hours down to {withHostahack}: about {Math.round(today / withHostahack)}x
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">Estimates for a 60-person, one-day hackathon run by Satellite.</p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-border/50">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border/50 text-muted-foreground">
                <tr>
                  <th className="p-4 font-normal">Stage</th>
                  <th className="p-4 font-normal">Today</th>
                  <th className="p-4 font-normal">With Hostahack</th>
                  <th className="p-4 text-right font-normal">Hours</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.stage} className="border-b border-border/30 align-top last:border-0">
                    <td className="p-4">{row.stage}</td>
                    <td className="p-4 text-muted-foreground">{row.today}</td>
                    <td className="p-4">{row.hostahack}</td>
                    <td className="whitespace-nowrap p-4 text-right font-mono text-xs">
                      <span className="text-muted-foreground line-through">{row.hours[0]}</span> <span className="text-brand">{row.hours[1]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/50 p-5">
              <p className="font-serif text-4xl">Under 1 min</p>
              <p className="mt-2 text-sm text-muted-foreground">From X handle to a profile and a team match, against an hour or more in a Discord channel.</p>
            </div>
            <div className="rounded-2xl border border-border/50 p-5">
              <p className="font-serif text-4xl">0 cold reads</p>
              <p className="mt-2 text-sm text-muted-foreground">Every submission reaches judges with a weighted pre-score, reasons and questions to ask.</p>
            </div>
            <div className="rounded-2xl border border-border/50 p-5">
              <p className="font-serif text-4xl">Every event compounds</p>
              <p className="mt-2 text-sm text-muted-foreground">Profiles, teams, results and follow-ups stay with the community, so the next build day starts with people who already know each other.</p>
            </div>
          </div>
        </section>

        <section className="mt-20 rounded-3xl border border-brand/30 bg-brand/[0.06] p-6 md:p-10">
          <p className={`${eyebrow} text-brand`}>Why it matters to a real community</p>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed">
            Most of a hackathon&apos;s value comes from who meets whom and what they do next. Hostahack puts the people in the middle: builders are found from what
            they actually post, matched on the gap they fill, judged with care and followed up personally. For a client like Caligra, that turns one build day
            into champions inside the companies it wants to win.
          </p>
        </section>

        <footer className="mt-20 border-t border-border/40 pt-6 text-xs leading-relaxed text-muted-foreground">
          Hostahack is a Satellite Studio product, built on Grok with live X search. Public Grok calls are capped per hour.
        </footer>
      </div>
    </main>
  );
}
