import "server-only";

const XAI_RESPONSES_URL = "https://api.x.ai/v1/responses";

export const GROK_MODEL = process.env.XAI_MODEL?.trim() || "grok-4.7";

/** Default reasoning effort keeps structured JSON calls in the 10 to 20 second range. */
const REASONING_EFFORT = process.env.XAI_REASONING_EFFORT?.trim() || "low";

export function hasGrok(): boolean {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

export type XSearchOptions = {
  allowedHandles?: string[];
  fromDate?: string;
  maxTurns?: number;
};

export type GrokJsonResult<T> = {
  data: T;
  citations: string[];
  postsFetched: number | null;
};

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: Array<{ type?: string; url?: string }>;
    }>;
  }>;
  citations?: Array<string | { url?: string }>;
  usage?: { server_side_tool_usage_details?: { x_posts_fetched?: number } };
};

function daysAgo(days: number): string {
  const d = new Date(Date.now() - days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export function recentWindow(days = 30): string {
  return daysAgo(days);
}

function parseJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new Error("Grok returned text that isn't JSON");
  }
}

function extract(payload: ResponsesPayload): { text: string; citations: string[] } {
  const citations = new Set<string>();
  let text = payload.output_text ?? "";
  for (const item of payload.output ?? []) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type === "output_text" && part.text && !payload.output_text) text += part.text;
      for (const a of part.annotations ?? []) if (a.url) citations.add(a.url);
    }
  }
  for (const c of payload.citations ?? []) {
    const url = typeof c === "string" ? c : c.url;
    if (url) citations.add(url);
  }
  return { text, citations: [...citations] };
}

/** One Grok call through the Responses API, optionally with live X search. */
export async function grokJson<T>(options: {
  system: string;
  user: string;
  xSearch?: XSearchOptions;
  timeoutMs?: number;
  effort?: "low" | "medium" | "high";
}): Promise<GrokJsonResult<T>> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) throw new Error("XAI_API_KEY is not configured");

  const body: Record<string, unknown> = {
    model: GROK_MODEL,
    input: [
      {
        role: "system",
        content: `${options.system}\n\nRespond with one JSON object only. No markdown fences, no commentary.`,
      },
      { role: "user", content: options.user },
    ],
  };
  if (REASONING_EFFORT !== "none") body.reasoning = { effort: options.effort ?? REASONING_EFFORT };

  if (options.xSearch) {
    const tool: Record<string, unknown> = { type: "x_search" };
    if (options.xSearch.allowedHandles?.length) {
      tool.allowed_x_handles = options.xSearch.allowedHandles.slice(0, 20);
    }
    if (options.xSearch.fromDate) tool.from_date = options.xSearch.fromDate;
    body.tools = [tool];
    if (options.xSearch.maxTurns) body.max_turns = options.xSearch.maxTurns;
  }

  const send = async (payload: Record<string, unknown>) =>
    fetch(XAI_RESPONSES_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(options.timeoutMs ?? 55_000),
    });

  let res = await send(body);
  if (res.status === 400 && ("max_turns" in body || "reasoning" in body)) {
    const { max_turns: _turns, reasoning: _reasoning, ...rest } = body;
    res = await send(rest);
  }
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`Grok request failed (${res.status}): ${detail}`);
  }

  const payload = (await res.json()) as ResponsesPayload;
  const { text, citations } = extract(payload);
  if (!text.trim()) throw new Error("Grok returned an empty response");
  return {
    data: parseJson<T>(text),
    citations,
    postsFetched: payload.usage?.server_side_tool_usage_details?.x_posts_fetched ?? null,
  };
}
