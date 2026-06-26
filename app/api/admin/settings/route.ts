import { NextResponse } from "next/server";
import { saveSettings } from "@/lib/admin/actions";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    await saveSettings(formData);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin settings update failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ayarlar kaydedilemedi." },
      { status: 500 }
    );
  }
}
