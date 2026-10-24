import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import type {
  HackParticipant,
  HackSubmission,
  HackTeam,
  Hackathon,
  PublicHackathon,
} from "./types";

/** Hourly caps on Grok-backed actions across all visitors. */
const HOURLY_CAPS: Record<string, number> = {
  design: 15,
  register: 120,
  teams: 40,
  score: 80,
  feed: 30,
  after: 20,
};

export function hackDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Supabase is not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init = {}) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

export function newJuryKey(): string {
  return randomBytes(12).toString("base64url");
}

export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "hackathon"}-${randomBytes(3).toString("hex")}`;
}

/** Returns false when the hourly cap for an action is spent; otherwise logs the call. */
export async function spendBudget(action: keyof typeof HOURLY_CAPS, hackathonId?: string): Promise<boolean> {
  const db = hackDb();
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db
    .from("host_calls")
    .select("id", { count: "exact", head: true })
    .eq("action", action)
    .gte("created_at", since);
  if ((count ?? 0) >= HOURLY_CAPS[action]) return false;
  await db.from("host_calls").insert({ action, hackathon_id: hackathonId ?? null });
  return true;
}

export function toPublic(h: Hackathon): PublicHackathon {
  const { jury_key: _hidden, ...rest } = h;
  return rest;
}

export async function getHackathonBySlug(slug: string): Promise<Hackathon | null> {
  const { data } = await hackDb().from("host_hackathons").select("*").eq("slug", slug).maybeSingle();
  return (data as Hackathon | null) ?? null;
}

export async function getHackathonById(id: string): Promise<Hackathon | null> {
  const { data } = await hackDb().from("host_hackathons").select("*").eq("id", id).maybeSingle();
  return (data as Hackathon | null) ?? null;
}

export async function updateHackathon(id: string, patch: Partial<Hackathon>): Promise<void> {
  const { error } = await hackDb().from("host_hackathons").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listParticipants(hackathonId: string): Promise<HackParticipant[]> {
  const { data } = await hackDb()
    .from("host_participants")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .order("created_at", { ascending: true });
  return (data as HackParticipant[] | null) ?? [];
}

export async function listTeams(hackathonId: string): Promise<HackTeam[]> {
  const { data } = await hackDb()
    .from("host_teams")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .order("created_at", { ascending: true });
  return (data as HackTeam[] | null) ?? [];
}

export async function listSubmissions(hackathonId: string): Promise<HackSubmission[]> {
  const { data } = await hackDb()
    .from("host_submissions")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .order("created_at", { ascending: true });
  return (data as HackSubmission[] | null) ?? [];
}

export async function listShowcase(limit = 12): Promise<PublicHackathon[]> {
  const { data } = await hackDb()
    .from("host_hackathons")
    .select("*")
    .neq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data as Hackathon[] | null) ?? []).map(toPublic);
}

export type HackBundle = {
  hackathon: Hackathon;
  participants: HackParticipant[];
  teams: HackTeam[];
  submissions: HackSubmission[];
};

export async function loadBundle(slug: string): Promise<HackBundle | null> {
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) return null;
  const [participants, teams, submissions] = await Promise.all([
    listParticipants(hackathon.id),
    listTeams(hackathon.id),
    listSubmissions(hackathon.id),
  ]);
  return { hackathon, participants, teams, submissions };
}

export function weightedTotal(
  scores: Record<string, number>,
  rubric: { id: string; weight: number }[],
): number {
  const totalWeight = rubric.reduce((sum, c) => sum + c.weight, 0) || 1;
  const raw = rubric.reduce((sum, c) => sum + (scores[c.id] ?? 0) * c.weight, 0);
  return Math.round((raw / totalWeight) * 10) / 10;
}
