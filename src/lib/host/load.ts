import "server-only";

import { cache } from "react";
import { hackDb, loadBundle } from "./store";
import type { Hackathon } from "./types";

export const getBundle = cache(async (slug: string) => loadBundle(slug));

/** The example hackathon shown in the /host/video walkthrough. */
export const getFlagshipDemo = cache(async (): Promise<Pick<Hackathon, "slug" | "jury_key" | "client_name" | "design" | "status"> | null> => {
  const { data } = await hackDb()
    .from("host_hackathons")
    .select("slug, jury_key, client_name, design, status")
    .eq("sandbox", false)
    .neq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Pick<Hackathon, "slug" | "jury_key" | "client_name" | "design" | "status"> | null) ?? null;
});
