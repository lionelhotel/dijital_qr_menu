import "server-only";

export async function translateTurkishFields(values: Record<string, string>) {
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
        model: process.env.OPENAI_TRANSLATION_MODEL || process.env.OPENAI_NUTRITION_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Translate Turkish admin form fields into English and Spanish for a hotel restaurant menu. Preserve meaning, keep concise menu wording, and return JSON only."
          },
          {
            role: "user",
            content: JSON.stringify({
              sourceLanguage: "tr",
              targetLanguages: ["en", "es"],
              values
            })
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "admin_form_translations",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                translations: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      field: { type: "string" },
                      en: { type: "string" },
                      es: { type: "string" }
                    },
                    required: ["field", "en", "es"]
                  }
                },
              },
              required: ["translations"]
            },
            strict: true
          }
        }
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("OpenAI translation failed", response.status, body.slice(0, 500));
      return { error: `OpenAI çeviri isteği başarısız oldu (${response.status}).` };
    }

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };
    const text = data.output_text ?? data.output?.flatMap((item) => item.content ?? []).find((item) => item.text)?.text;
    if (!text) return { error: "OpenAI çeviri yanıtı boş döndü." };

    const parsed = JSON.parse(text) as { translations: Array<{ field: string; en: string; es: string }> };
    return {
      translations: Object.fromEntries(
        parsed.translations
          .filter((item) => item.field && values[item.field] !== undefined)
          .map((item) => [item.field, { en: item.en, es: item.es }])
      )
    };
  } catch (error) {
    console.error("OpenAI translation error", error);
    return { error: error instanceof Error ? error.message : "Çeviri sırasında beklenmeyen hata oluştu." };
  }
}
