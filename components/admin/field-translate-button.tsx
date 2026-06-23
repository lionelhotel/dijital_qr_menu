"use client";

import { Languages } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type TranslationResponse = {
  translations?: Record<string, { en: string; es: string }>;
  error?: string;
};

type FieldTranslateButtonProps = {
  sourceName: string;
  targetName: string;
  targetLocale: "en" | "es";
};

export function FieldTranslateButton({ sourceName, targetName, targetLocale }: FieldTranslateButtonProps) {
  const [pending, setPending] = useState(false);

  async function translate(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.closest("form");
    if (!form) return;

    const source = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name='${sourceName}']`);
    const target = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name='${targetName}']`);
    const sourceValue = source?.value.trim();

    if (!sourceValue || !target) {
      showFlash("error", "Çevirmek için önce ilgili Türkçe alanı doldurun.");
      return;
    }

    const prefix = sourceName.replace(/_tr$/, "");
    setPending(true);
    try {
      const response = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: { [prefix]: sourceValue } })
      });
      const data = (await response.json()) as TranslationResponse;
      const translated = data.translations?.[prefix]?.[targetLocale];
      if (!response.ok || !translated) throw new Error(data.error || "Çeviri yapılamadı.");

      target.value = translated;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      showFlash("success", targetLocale === "en" ? "İngilizce alan çevrildi." : "İspanyolca alan çevrildi.");
    } catch (error) {
      showFlash("error", error instanceof Error ? error.message : "Çeviri sırasında hata oluştu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      onClick={translate}
      disabled={pending}
      aria-label={targetLocale === "en" ? "İngilizceye çevir" : "İspanyolcaya çevir"}
      title={targetLocale === "en" ? "İngilizceye çevir" : "İspanyolcaya çevir"}
      className="shrink-0"
    >
      <Languages className="h-4 w-4" />
    </Button>
  );
}

function showFlash(type: "success" | "error" | "info", message: string) {
  const flash = { type, message, createdAt: Date.now() };
  document.cookie = `admin_flash=${encodeURIComponent(JSON.stringify(flash))}; path=/; max-age=30; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent("admin-flash", { detail: flash }));
}
