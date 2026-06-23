import "server-only";

import { openAIErrorMessage, type OpenAIResult } from "./errors";

type NutritionInput = {
  name: string;
  description?: string | null;
  ingredients?: string | null;
  portion?: string | null;
};

type NutritionResult = {
  calories: number;
  note: string;
};

export async function estimateCaloriesPerPortion(input: NutritionInput): Promise<OpenAIResult<NutritionResult>> {
  if (!process.env.OPENAI_API_KEY) {
    return { error: "OPENAI_API_KEY tanımlı değil." };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_NUTRITION_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Estimate menu item nutrition per one served portion. Return conservative JSON only. Do not include markdown."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Estimate calories for one portion. If uncertain, use a typical hotel restaurant portion.",
              item: input,
              output: { caloriesKcal: "integer", reasoning: "short Turkish note" }
            })
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "nutrition_estimate",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                caloriesKcal: { type: "integer", minimum: 0, maximum: 2500 },
                reasoning: { type: "string" }
              },
              required: ["caloriesKcal", "reasoning"]
            },
            strict: true
          }
        }
      })
    });

    if (!response.ok) {
      const message = await openAIErrorMessage(response, "OpenAI kalori isteği");
      console.error("OpenAI nutrition request failed", message);
      return { error: message, status: response.status };
    }

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };
    const text = data.output_text ?? data.output?.flatMap((item) => item.content ?? []).find((item) => item.text)?.text;
    if (!text) return { error: "OpenAI kalori yanıtı boş döndü." };

    const parsed = JSON.parse(text) as { caloriesKcal: number; reasoning: string };
    if (!Number.isFinite(parsed.caloriesKcal)) {
      return { error: "OpenAI kalori yanıtında geçerli kalori değeri bulunamadı." };
    }

    return {
      calories: Math.round(parsed.caloriesKcal),
      note: parsed.reasoning
    };
  } catch (error) {
    console.error("OpenAI nutrition estimate failed", error);
    return { error: error instanceof Error ? error.message : "Kalori hesaplama sırasında beklenmeyen hata oluştu." };
  }
}
