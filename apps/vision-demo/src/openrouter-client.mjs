import { apiUrl } from "./env.mjs";

export const parseModelJson = (text) => {
  const raw = String(text ?? "").trim();
  const withoutFence = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? withoutFence.slice(start, end + 1) : withoutFence;
  return JSON.parse(candidate);
};

export const extractText = (payload) => {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === "string") return part;
      if (typeof part?.text === "string") return part.text;
      return "";
    }).join("").trim();
  }
  return "";
};

export const callOpenRouter = async ({ apiKey, model, messages, maxTokens = 700, timeoutMs = 90000, headers = {} }) => {
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is required for cloud model calls.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0,
        max_tokens: maxTokens
      }),
      signal: controller.signal
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`OpenRouter HTTP ${response.status}: ${text.slice(0, 1000)}`);
    }

    const payload = JSON.parse(text);
    const rawText = extractText(payload);
    return {
      rawText,
      parsed: parseModelJson(rawText),
      latencyMs: Date.now() - started,
      returnedModel: payload.model || null,
      usage: payload.usage || null
    };
  } finally {
    clearTimeout(timer);
  }
};
