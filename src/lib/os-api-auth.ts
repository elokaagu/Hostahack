import { createClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

/**
 * Operator auth for Host's console routes. Verifies the Supabase access
 * token sent as a Bearer header. Set HOST_OPERATOR_EMAILS (comma-separated)
 * to limit operator actions to named accounts. HOSTAHACK_OPERATOR_EMAILS is
 * still read as a fallback for installs set up before the rename.
 */
const OPERATOR_EMAILS = (process.env.HOST_OPERATOR_EMAILS ?? process.env.HOSTAHACK_OPERATOR_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function getOsApiUser(request: NextRequest): Promise<User | null> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!token || !url || !anonKey) return null;

  const { data } = await createClient(url, anonKey).auth.getUser(token);
  const user = data.user ?? null;
  if (!user) return null;
  if (OPERATOR_EMAILS.length && !OPERATOR_EMAILS.includes((user.email ?? "").toLowerCase())) return null;
  return user;
}
