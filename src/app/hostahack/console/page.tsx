import { ConsoleForm } from "@/components/hostahack/ConsoleForm";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Design your hackathon · Hostahack",
  robots: { index: false, follow: false },
};

export default function HostahackConsolePage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-12 md:py-20">
        <Link href="/hostahack" className="font-mono text-xs uppercase tracking-[0.14em] text-brand">
          Hostahack · Satellite Studio
        </Link>
        <h1 className="mt-6 font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] md:text-6xl">Design your hackathon</h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          Say who is hosting and describe the event in a few sentences: who it&apos;s for, what you want people to build, where and when. Grok designs the whole
          hackathon and searches X for builders and mentors worth inviting. You review the design, then publish the hackathon page in one click and run it from there.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Anyone can create a hackathon here. Satellite operators who are signed in create client hackathons; everyone else creates a sandbox hackathon that works the
          same way.
        </p>
        <div className="mt-10">
          <ConsoleForm />
        </div>
      </div>
    </main>
  );
}
