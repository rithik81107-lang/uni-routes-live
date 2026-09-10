import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ScanInput = z.object({
  image: z.string().min(32).max(6_000_000),
});

export type ScanResult = {
  category: "plastic" | "paper" | "glass" | "metal" | "food" | "ewaste" | "mixed";
  item: string;
  confidence: number;
  unclear: boolean;
  disposal: string;
  tips: string[];
  recyclable: boolean;
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    category: {
      type: "string",
      enum: ["plastic", "paper", "glass", "metal", "food", "ewaste", "mixed"],
    },
    item: { type: "string" },
    confidence: { type: "number" },
    unclear: { type: "boolean" },
    disposal: { type: "string" },
    tips: { type: "array", items: { type: "string" } },
    recyclable: { type: "boolean" },
  },
  required: ["category", "item", "confidence", "unclear", "disposal", "tips", "recyclable"],
};

export const classifyWaste = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ScanInput.parse(data))
  .handler(async ({ data }): Promise<ScanResult> => {
    const { callAIJson } = await import("./ai.server");

    const result = await callAIJson<ScanResult>({
      system:
        "You are a waste-sorting assistant for a community cleanup app. Look at the photo and " +
        "identify the dominant waste type. Categories: plastic, paper, glass, metal, food, ewaste, mixed. " +
        "Set confidence between 0 and 1. Set unclear to true when the photo is blurry, empty, or does not " +
        "clearly show waste — in that case still give your best guess. 'disposal' is one short sentence of " +
        "plain advice. Give 2-4 short practical tips. Keep the language simple and friendly.",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Identify the waste in this photo and how to dispose of it." },
            { type: "input_image", image_url: data.image },
          ],
        },
      ],
      schema: { name: "waste_scan", schema: SCHEMA },
      effort: "low",
    });

    return {
      ...result,
      confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0)),
      tips: Array.isArray(result.tips) ? result.tips.slice(0, 4) : [],
    };
  });
