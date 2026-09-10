/**
 * Lovable AI Gateway helper (server-only).
 * Every call streams from the gateway and is accumulated here.
 */
const ENDPOINT = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export type JsonSchemaSpec = {
  name: string;
  schema: Record<string, unknown>;
};

function friendlyError(status: number, message: string): string {
  if (status === 402) return message || "The AI credits for this workspace have run out.";
  if (status === 403) return message || "AI access is currently blocked for this workspace.";
  if (status === 429) return "The AI is busy right now. Please try again in a few seconds.";
  if (status >= 500) return "The AI service is temporarily unavailable. Please try again.";
  return message || "The AI request could not be completed.";
}

export async function callAI(opts: {
  system: string;
  input: string | unknown[];
  schema?: JsonSchemaSpec;
  effort?: "low" | "medium" | "high";
}): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this app.");

  const body: Record<string, unknown> = {
    model: MODEL,
    stream: true,
    instructions: opts.system,
    input: opts.input,
    reasoning: { effort: opts.effort ?? "low" },
  };

  if (opts.schema) {
    body["text"] = {
      format: {
        type: "json_schema",
        name: opts.schema.name,
        strict: true,
        schema: opts.schema.schema,
      },
    };
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    let detail = "";
    try {
      const text = await res.text();
      const parsed = JSON.parse(text) as { error?: { message?: string }; message?: string };
      detail = parsed?.error?.message ?? parsed?.message ?? text.slice(0, 300);
    } catch {
      /* ignore parse issues */
    }
    throw new Error(friendlyError(res.status, detail));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let out = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let index: number;
    while ((index = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          out += event.delta;
        } else if (event.type === "response.completed" && !out && event.response?.output_text) {
          out = event.response.output_text;
        }
      } catch {
        /* skip malformed chunks */
      }
    }
  }

  return out.trim();
}

export async function callAIJson<T>(opts: {
  system: string;
  input: string | unknown[];
  schema: JsonSchemaSpec;
  effort?: "low" | "medium" | "high";
}): Promise<T> {
  const text = await callAI(opts);
  if (!text) throw new Error("The AI returned an empty response. Please try again.");
  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) return JSON.parse(text.slice(start, end + 1)) as T;
    throw new Error("The AI response could not be read. Please try again.");
  }
}
