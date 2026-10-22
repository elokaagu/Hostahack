"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { href: "", label: "Overview" },
  { href: "/design", label: "Design" },
  { href: "/register", label: "Register" },
  { href: "/teams", label: "Teams" },
  { href: "/submit", label: "Submit" },
  { href: "/jury", label: "Jury" },
  { href: "/results", label: "Results" },
];

export function HackTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const key = useSearchParams().get("key");
  const base = `/hostahack/${slug}`;
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const active = pathname === href;
        const withKey = key && (tab.href === "/jury" || tab.href === "/design") ? `${href}?key=${encodeURIComponent(key)}` : href;
        return (
          <Link
            key={tab.label}
            href={withKey}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors",
              active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
