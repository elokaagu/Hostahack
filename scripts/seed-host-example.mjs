// Seeds the example hackathon used in the /host/video walkthrough, through Host's real API flow.
// Usage: node scripts/seed-host-example.mjs [baseUrl]
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

const BASE = process.argv[2] || "http://localhost:3311";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const HOST = "London Builders Night";
const BRIEF = `A one-day build night in London for about 60 developers, designers and community organisers. The theme is community infrastructure: tools that help communities find new members, collaborate across groups, run events and keep people active after the first meetup. Builders should leave with working prototypes that a real community could start using the following week, and every project should be open source so other communities can fork and run it. Saturday 15 November, 10:00 to 20:00, in a studio in Shoreditch, with lunch, mentors on hand and demos to a small jury at 18:00. Success means at least 10 working projects, 3 that a community keeps using a month later, and most builders joining the next event.`;

async function call(path, body) {
  const t = Date.now();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(240_000),
  });
  const json = await res.json().catch(() => ({}));
  console.log(`${path} → ${res.status} in ${Math.round((Date.now() - t) / 1000)}s`);
  if (!res.ok) throw new Error(`${path}: ${json.error ?? res.status}`);
  return json;
}

const BUILDERS = [
  ["Maya Chen", ["rust", "systems", "terminal tools"], "Writes Rust CLI tools and a tiling terminal multiplexer.", ["A GPU-aware terminal multiplexer", "A Rust log-tailing tool with 2k GitHub stars"]],
  ["Tomi Adebayo", ["react", "typescript", "design systems"], "Frontend engineer building design systems at a fintech.", ["An open-source React component kit"]],
  ["Sasha Ivanova", ["ml", "python", "evals"], "ML engineer working on LLM evaluation pipelines.", ["An eval harness for code agents"]],
  ["Ben Okoro", ["hardware", "embedded", "c"], "Embedded engineer who builds keyboards and small devices.", ["A split mechanical keyboard with custom firmware"]],
  ["Priya Nair", ["product", "research", "figma"], "Product designer focused on developer tools.", ["Redesigned onboarding for a CI product"]],
  ["Leo Martins", ["go", "infrastructure", "kubernetes"], "Platform engineer running Kubernetes at scale.", ["A self-hosted preview environment system"]],
  ["Hana Suzuki", ["swift", "macos", "ux"], "Builds native macOS apps for focus and writing.", ["A distraction-free markdown editor for macOS"]],
  ["Kwesi Mensah", ["data", "sql", "analytics"], "Data engineer building internal analytics at a scale-up.", ["A semantic layer for product analytics"]],
  ["Ella Byrne", ["ai agents", "typescript", "llm"], "Builds AI coding agents and IDE extensions.", ["A VS Code agent that writes migration scripts"]],
  ["Omar Haddad", ["security", "rust", "linux"], "Security engineer hardening Linux developer machines.", ["A sandboxing tool for untrusted build scripts"]],
  ["Grace Wu", ["founder", "go-to-market", "product"], "Founder of a two-person devtools start-up.", ["Launched a database branching tool to 400 teams"]],
  ["Daniel Reyes", ["audio", "c++", "realtime"], "Audio software engineer working on real-time DSP.", ["A low-latency audio plugin host"]],
  ["Nadia Rahman", ["research", "hci", "python"], "HCI researcher studying how engineers focus.", ["A study of interruption cost in pair programming"]],
  ["Felix Wagner", ["backend", "postgres", "elixir"], "Backend engineer building real-time collaboration.", ["A CRDT sync server in Elixir"]],
  ["Zara Ali", ["frontend", "webgl", "creative coding"], "Creative technologist working with WebGL and shaders.", ["Interactive data art for a museum"]],
  ["Ravi Patel", ["enterprise", "platform", "java"], "Staff engineer at a bank modernising developer tooling.", ["Moved 300 engineers to a new internal platform"]],
  ["Lucy Hart", ["devrel", "writing", "community"], "Developer advocate who runs a London meetup.", ["Grew a meetup to 3,000 members"]],
  ["Ade Bello", ["mobile", "kotlin", "android"], "Android engineer building offline-first apps.", ["An offline-first field survey app"]],
];

const LATE = [
  ["Iris Novak", ["design", "prototyping", "hardware"], "Industrial designer who prototypes hardware enclosures.", ["A modular desk dock for laptops"]],
  ["Sam Osei", ["python", "automation", "devops"], "DevOps engineer automating release pipelines.", ["A release-notes bot used by 40 repos"]],
  ["Chloe Martin", ["typescript", "node", "apis"], "API engineer at a payments company.", ["An open-source webhook tester"]],
];

function row(hackathonId, [name, skills, headline, builds], i, prefix) {
  return {
    hackathon_id: hackathonId,
    x_handle: `${prefix}_${name.split(" ")[0].toLowerCase()}${i}`,
    display_name: name,
    skills,
    interests: headline,
    seeded: true,
    profile: { headline, skills, interests: [], builds, strengths: `Brings ${skills.slice(0, 2).join(" and ")}.`, preferredTrackId: null, evidence: [], source: "seed" },
  };
}

async function writeSubmissions(design, teams, members) {
  const res = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.XAI_MODEL || "grok-4.7",
      input: [
        { role: "system", content: "You write realistic one-day hackathon project submissions. British English. Respond with one JSON object only." },
        {
          role: "user",
          content: `Hackathon: ${design.title}. Theme: ${design.theme}
Tracks: ${design.tracks.map((t) => `${t.id}: ${t.name} — ${t.brief}`).join("\n")}
Teams (id | name | track | members and skills):
${teams.map((t) => `${t.id} | ${t.name} | ${t.track_id} | ${members.filter((m) => m.team_id === t.id).map((m) => `${m.display_name} (${m.skills.join(", ")})`).join("; ")}`).join("\n")}

Write one submission per team, varied in ambition and quality (some excellent, some rough), each solving a real problem for an online or local community.
Return JSON: { "submissions": [{ "teamId": string, "trackId": string, "title": string, "link": string (a plausible https://github.com/... URL), "description": string (3 to 4 sentences) }] }`,
        },
      ],
    }),
    signal: AbortSignal.timeout(200_000),
  });
  const json = await res.json();
  const text = json.output_text ?? (json.output ?? []).filter((o) => o.type === "message").flatMap((o) => o.content ?? []).map((c) => c.text ?? "").join("");
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
  return JSON.parse(cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1)).submissions;
}

const created = await call("/api/host/create", { clientName: HOST, brief: BRIEF });
const { id, slug, juryKey } = created;
console.log("created", slug, "engine", created.engine);
await db.from("host_hackathons").update({ sandbox: false }).eq("id", id);
await call(`/api/host/${id}/publish`, { key: juryKey });

const { error: insErr } = await db.from("host_participants").insert(BUILDERS.map((b, i) => row(id, b, i, "demo")));
if (insErr) throw insErr;
await call(`/api/host/${id}/form-teams`);

const { data: teams } = await db.from("host_teams").select("*").eq("hackathon_id", id);
const { data: members } = await db.from("host_participants").select("*").eq("hackathon_id", id);
console.log("teams", teams.length);

const subs = await writeSubmissions((await db.from("host_hackathons").select("design").eq("id", id).single()).data.design, teams, members);
const teamIds = new Set(teams.map((t) => t.id));
let done = 0;
for (const s of subs.filter((x) => teamIds.has(x.teamId)).slice(0, Math.max(1, teams.length - 1))) {
  await call(`/api/host/${id}/submit`, { teamId: s.teamId, trackId: s.trackId, title: s.title.slice(0, 120), link: s.link, description: s.description.slice(0, 2000) });
  done++;
}
console.log("submissions", done);

const { error: lateErr } = await db.from("host_participants").insert(LATE.map((b, i) => row(id, b, i, "late")));
if (lateErr) throw lateErr;

const { data: scored } = await db.from("host_submissions").select("*").eq("hackathon_id", id);
const ranked = scored.sort((a, b) => (b.ai_review?.total ?? 0) - (a.ai_review?.total ?? 0));
for (const [i, s] of ranked.slice(0, 2).entries()) {
  const scores = Object.fromEntries((s.ai_review?.scores ?? []).map((x) => [x.criterionId, Math.min(10, x.score + (i === 0 ? 0.5 : -0.5))]));
  await call(`/api/host/${id}/judge`, { key: juryKey, submissionId: s.id, scores, note: i === 0 ? "Strongest live demo of the day; a real community could use this next week." : "Great idea, the demo was rough on stage." });
}
await call(`/api/host/${id}/finalise`, { key: juryKey });
await call(`/api/host/${id}/after`, { key: juryKey });
await call(`/api/host/${id}/feed`);

console.log(JSON.stringify({ slug, id, jury: `/host/${slug}/jury?key=${juryKey}` }));
