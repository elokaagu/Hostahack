"use client";

import type { HackFeed } from "@/lib/hostahack/types";
import { useEffect, useState } from "react";
import { PostLink, eyebrow } from "./ui";

const TTL_MS = 10 * 60_000;

export function FeedPanel({ hackathonId, initial, hashtag }: { hackathonId: string; initial: HackFeed | null; hashtag: string }) {
  const [feed, setFeed] = useState<HackFeed | null>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stale = !initial || Date.now() - new Date(initial.fetchedAt).getTime() > TTL_MS;
    if (!stale) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/hostahack/${hackathonId}/feed`, { method: "POST" })
      .then((r) => r.json())
      .then((json: { feed?: HackFeed }) => {
        if (!cancelled && json.feed) setFeed(json.feed);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [hackathonId, initial]);

  return (
    <div className="rounded-3xl border border-border/50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={eyebrow}>Live on X · {hashtag}</p>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {loading ? "Grok is reading X…" : feed?.fetchedAt ? `Updated ${new Date(feed.fetchedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}
        </span>
      </div>
      {feed?.summary ? <p className="mt-3 text-sm leading-relaxed">{feed.summary}</p> : null}
      {feed?.posts.length ? (
        <ul className="mt-4 grid gap-2 md:grid-cols-2">
          {feed.posts.map((p) => (
            <li key={p.url}>
              <PostLink post={p} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {loading ? "Searching X for posts about this hackathon." : (feed?.note ?? "No posts yet. Post with the hashtag and it shows up here.")}
        </p>
      )}
    </div>
  );
}
