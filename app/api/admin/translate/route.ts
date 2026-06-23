import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { translateTurkishFields } from "@/lib/openai/translate";

export async function POST(request: Request) {
  await requireAdmin();
  const body = (await request.json()) as { values?: Record<string, string> };
  const values = body.values ?? {};

  if (!Object.keys(values).length) {
    return NextResponse.json({ error: "Çevrilecek Türkçe alan bulunamadı." }, { status: 400 });
  }

  const result = await translateTurkishFields(values);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
