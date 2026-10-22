import { designHackathon, researchOnX } from "@/lib/hostahack/flows";
import { hackDb, newJuryKey, slugify, spendBudget } from "@/lib/hostahack/store";
import { getOsApiUser } from "@/lib/os-api-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 180;
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    clientName: z.string().trim().min(2).max(80),
    brief: z.string().trim().min(40).max(8000),
  })
  .strict();

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Give a client name and a brief of at least a few sentences." }, { status: 400 });
  }

  const operator = await getOsApiUser(request).catch(() => null);
  if (!(await spendBudget("design"))) {
    return NextResponse.json({ error: "Hostahack is designing a lot of hackathons right now. Try again shortly." }, { status: 429 });
  }

  const { clientName, brief } = parsed.data;
  try {
    const [{ design, engine }, research] = await Promise.all([designHackathon(clientName, brief), researchOnX(clientName, brief)]);

    const { data, error } = await hackDb()
      .from("hostahack_hackathons")
      .insert({
        slug: slugify(`${clientName} ${design.title}`),
        client_name: clientName,
        client_brief: brief,
        status: "draft",
        design,
        research,
        jury_key: newJuryKey(),
        sandbox: !operator,
        created_by: operator?.id ?? null,
      })
      .select("id, slug, jury_key")
      .single();
    if (error) throw new Error(error.message);

    console.info("hostahack.create", { slug: data.slug, engine, research: research.live, operator: Boolean(operator) });
    return NextResponse.json({ id: data.id, slug: data.slug, juryKey: data.jury_key, engine });
  } catch (error) {
    console.error("hostahack.create failed", error);
    return NextResponse.json({ error: "Hostahack couldn't design that hackathon. Try again." }, { status: 502 });
  }
}
