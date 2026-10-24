import { HackTabs } from "@/components/host/HackTabs";
import { Chip } from "@/components/host/ui";
import { getBundle } from "@/lib/host/load";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; children: ReactNode };

const STATUS_LABEL = { draft: "Draft", published: "Registration open", judging: "Judging", results: "Results out" } as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getBundle(slug);
  return {
    title: bundle ? `${bundle.hackathon.design.title} · ${bundle.hackathon.client_name} · Host` : "Host",
    description: bundle?.hackathon.design.tagline,
    robots: { index: false, follow: false },
  };
}

export default async function HackLayout({ params, children }: Props) {
  const { slug } = await params;
  const bundle = await getBundle(slug);
  if (!bundle) notFound();
  const { hackathon: h } = bundle;

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/host" className="font-mono text-xs uppercase tracking-[0.14em] text-brand">
            Host · Satellite Studio
          </Link>
          <div className="flex items-center gap-2">
            {h.sandbox ? <Chip>Sandbox</Chip> : <Chip tone="brand">Client hackathon</Chip>}
            <Chip tone="brand">{STATUS_LABEL[h.status]}</Chip>
          </div>
        </div>
        <div className="mt-8">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{h.client_name} presents</p>
          <h1 className="mt-2 font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] md:text-6xl">{h.design.title}</h1>
        </div>
        <div className="mt-6 border-b border-border/40 pb-3">
          <Suspense fallback={null}>
            <HackTabs slug={h.slug} />
          </Suspense>
        </div>
        {children}
        <footer className="mt-20 border-t border-border/40 pt-6 text-xs leading-relaxed text-muted-foreground">
          Designed, built and run on Host by Satellite Labs · Grok with live X search
        </footer>
      </div>
    </main>
  );
}
