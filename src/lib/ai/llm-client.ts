import { getOpenAIClient, handleAIError } from "@/lib/ai/utils";

export type LlmProvider = "openai" | "anthropic";

export function resolveDeckLlmProvider(): LlmProvider {
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  return "openai";
}

export async function completeJson<T>(
  system: string,
  user: string,
  options?: { provider?: LlmProvider; model?: string; temperature?: number },
): Promise<T> {
  const provider = options?.provider ?? resolveDeckLlmProvider();

  try {
    if (provider === "anthropic") {
      return await completeJsonAnthropic<T>(system, user, options);
    }
    return await completeJsonOpenAI<T>(system, user, options);
  } catch (error) {
    if (
      provider === "anthropic" &&
      process.env.OPENAI_API_KEY?.trim()
    ) {
      try {
        return await completeJsonOpenAI<T>(system, user, options);
      } catch (fallbackError) {
        throw handleAIError(fallbackError);
      }
    }
    throw handleAIError(error);
  }
}

async function completeJsonOpenAI<T>(
  system: string,
  user: string,
  options?: { model?: string; temperature?: number },
): Promise<T> {
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: options?.model ?? "gpt-4o",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: options?.temperature ?? 0.55,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");
  return JSON.parse(content) as T;
}

async function completeJsonAnthropic<T>(
  system: string,
  user: string,
  options?: { model?: string; temperature?: number },
): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: options?.model ?? "claude-sonnet-4-6",
      max_tokens: 8192,
      temperature: options?.temperature ?? 0.55,
      system: `${system}\n\nRespond with valid JSON only. No markdown fences.`,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(formatAnthropicError(errText, response.status));
  }

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = payload.content?.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("No response from Anthropic");

  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(cleaned) as T;
}

function formatAnthropicError(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as {
      error?: { type?: string; message?: string };
    };
    const message = parsed.error?.message?.trim();
    if (message) {
      if (parsed.error?.type === "not_found_error" && message.startsWith("model:")) {
        return `Claude model unavailable (${message.replace("model: ", "")}). Retrying with OpenAI if configured.`;
      }
      return message;
    }
  } catch {
    // fall through
  }
  return body.trim() || `Anthropic request failed (${status})`;
}
