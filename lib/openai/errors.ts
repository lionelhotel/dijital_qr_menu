import "server-only";

export type OpenAIResult<T> = T | { error: string; status?: number };

export async function openAIErrorMessage(response: Response, action: string) {
  const body = await response.text().catch(() => "");
  let detail = body.slice(0, 500);
  let code = "";

  try {
    const parsed = JSON.parse(body) as {
      error?: {
        message?: string;
        code?: string | null;
        type?: string;
      };
    };
    detail = parsed.error?.message || detail;
    code = parsed.error?.code || parsed.error?.type || "";
  } catch {
    // Non-JSON error bodies can still help the admin understand what failed.
  }

  const quotaHint =
    response.status === 429
      ? " OpenAI tarafında kota, ödeme limiti veya hız limiti kontrol edilmeli."
      : "";
  const codeText = code ? ` ${code}:` : "";

  return `${action} başarısız oldu (${response.status}).${codeText} ${
    detail || "OpenAI hata detayı dönmedi."
  }${quotaHint}`;
}

export function isOpenAIError<T>(result: OpenAIResult<T>): result is { error: string; status?: number } {
  return typeof result === "object" && result !== null && "error" in result;
}
