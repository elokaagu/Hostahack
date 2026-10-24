import type { XPost } from "@/lib/host/types";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const eyebrow = "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground";

export function Section({
  label,
  title,
  children,
  className,
  action,
}: {
  label?: string;
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("mt-14", className)}>
      {label || title || action ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {label ? <p className={eyebrow}>{label}</p> : null}
            {title ? <h2 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">{title}</h2> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={label || title ? "mt-6" : undefined}>{children}</div>
    </section>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-border/50 p-5", className)}>{children}</div>;
}

export function Chip({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "brand" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
        tone === "brand" ? "border-brand/30 bg-brand/10 text-brand" : "border-border/70 bg-muted/30 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function PostLink({ post }: { post: XPost }) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className="text-brand">@{post.handle}</span> “{post.text}” ↗
    </a>
  );
}

export function initials(name: string): string {
  return name
    .replace(/^@/, "")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium">{initials(name)}</span>
  );
}
