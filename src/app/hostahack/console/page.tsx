import { ConsoleForm } from "@/components/hostahack/ConsoleForm";
import { CALIGRA_BRIEF, CALIGRA_CLIENT } from "@/lib/hostahack/caligra-brief";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Operator console · Hostahack",
  robots: { index: false, follow: false },
};

export default function HostahackConsolePage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-12 md:py-20">
        <Link href="/hostahack" className="font-mono text-xs uppercase tracking-[0.14em] text-brand">
          Hostahack · Satellite Studio
        </Link>
        <h1 className="mt-6 font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] md:text-6xl">Design a hackathon from a client brief</h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          Paste what the client told you. Grok designs the whole event and researches X for the builders and mentors to invite. You review the design, then publish the
          hackathon page in one click. The Caligra brief is filled in so you can try it.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Signed-in Satellite operators create client hackathons. Everyone else creates a sandbox hackathon, which works the same way.
        </p>
        <div className="mt-10">
          <ConsoleForm defaultClient={CALIGRA_CLIENT} defaultBrief={CALIGRA_BRIEF} />
        </div>
      </div>
    </main>
  );
}
