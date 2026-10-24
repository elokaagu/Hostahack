"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type TourStep = {
  title: string;
  caption: string;
  src: string;
  seconds: number;
};

const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 800;

export function HostTour({ steps }: { steps: TourStep[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [scale, setScale] = useState(0.5);
  const stageRef = useRef<HTMLDivElement>(null);
  const step = steps[index];

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / FRAME_WIDTH));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const go = useCallback(
    (next: number) => {
      setIndex(((next % steps.length) + steps.length) % steps.length);
      setElapsed(0);
    },
    [steps.length],
  );

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setElapsed((e) => {
        if (e + 0.1 >= step.seconds) {
          setIndex((i) => (i + 1) % steps.length);
          return 0;
        }
        return e + 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [playing, step.seconds, steps.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-black">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted" />
          <span className="ml-3 truncate font-mono text-[11px] text-muted-foreground">satellitelabs.xyz{step.src}</span>
        </div>

        <div
          ref={stageRef}
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: `${FRAME_WIDTH} / ${FRAME_HEIGHT}` }}
        >
          {steps.map((s, i) => (
            <iframe
              key={s.src}
              src={s.src}
              title={s.title}
              loading={Math.abs(i - index) <= 1 ? "eager" : "lazy"}
              className="absolute left-0 top-0 origin-top-left border-0 bg-background transition-opacity duration-500"
              style={{
                width: FRAME_WIDTH,
                height: FRAME_HEIGHT,
                transform: `scale(${scale})`,
                opacity: i === index ? 1 : 0,
                pointerEvents: i === index ? "auto" : "none",
              }}
            />
          ))}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pt-16 md:p-8 md:pt-24">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand">
              {String(index + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")} · {step.title}
            </p>
            <p className="mt-2 max-w-3xl text-base leading-relaxed text-white md:text-xl">{step.caption}</p>
          </div>
        </div>

        <div className="h-1 w-full bg-muted/30">
          <div className="h-full bg-brand transition-[width] duration-100 ease-linear" style={{ width: `${(elapsed / step.seconds) * 100}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => go(index - 1)}
          className="rounded-full border border-border/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="rounded-full bg-brand px-5 py-2 text-sm text-brand-foreground transition-opacity hover:opacity-90"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          className="rounded-full border border-border/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
        >
          Next →
        </button>
        <Link
          href={step.src}
          target="_blank"
          className="ml-auto rounded-full border border-border/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
        >
          Open this page ↗
        </Link>
      </div>

      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.src}>
            <button
              type="button"
              onClick={() => go(i)}
              className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs transition-colors ${
                i === index ? "border-brand bg-brand/10 text-foreground" : "border-border/50 text-muted-foreground hover:border-brand/60"
              }`}
            >
              <span className="mr-2 font-mono text-brand">{String(i + 1).padStart(2, "0")}</span>
              {s.title}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
