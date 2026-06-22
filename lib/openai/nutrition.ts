import "server-only";

type NutritionInput = {
  name: string;
  description?: string | null;
  ingredients?: string | null;
  portion?: string | null;
};

export async function estimateCaloriesPerPortion(input: NutritionInput) {
  if (!process.env.OPENAI_API_KEY) return null;

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
      const body = await response.text().catch(() => "");
      console.error("OpenAI nutrition request failed", response.status, body.slice(0, 500));
      return null;
    }

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };
    const text = data.output_text ?? data.output?.flatMap((item) => item.content ?? []).find((item) => item.text)?.text;
    if (!text) return null;

    const parsed = JSON.parse(text) as { caloriesKcal: number; reasoning: string };
    if (!Number.isFinite(parsed.caloriesKcal)) return null;

    return {
      calories: Math.round(parsed.caloriesKcal),
      note: parsed.reasoning
    };
  } catch (error) {
    console.error("OpenAI nutrition estimate failed", error);
    return null;
  }
}
