"use client";

import { Languages } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type TranslationResponse = {
  translations?: Record<string, { en: string; es: string }>;
  error?: string;
};

export function TranslateButton() {
  const [pending, setPending] = useState(false);

  async function translate(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.closest("form");
    if (!form) return;

    const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[name$='_tr']"));
    const values = Object.fromEntries(
      fields
        .map((field) => [field.name.replace(/_tr$/, ""), field.value.trim()])
        .filter(([, value]) => value)
    );

    if (!Object.keys(values).length) {
      document.cookie = `admin_flash=${encodeURIComponent(JSON.stringify({
        type: "error",
        message: "Çevirmek için önce Türkçe alanları doldurun.",
        createdAt: Date.now()
      }))}; path=/; max-age=30; SameSite=Lax`;
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values })
      });
      const data = (await response.json()) as TranslationResponse;
      if (!response.ok || !data.translations) {
        throw new Error(data.error || "Çeviri yapılamadı.");
      }

      for (const [prefix, translated] of Object.entries(data.translations)) {
        const en = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name='${prefix}_en']`);
        const es = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name='${prefix}_es']`);
        if (en) en.value = translated.en;
        if (es) es.value = translated.es;
      }

      document.cookie = `admin_flash=${encodeURIComponent(JSON.stringify({
        type: "success",
        message: "İngilizce ve İspanyolca alanlar çevrildi.",
        createdAt: Date.now()
      }))}; path=/; max-age=30; SameSite=Lax`;
    } catch (error) {
      document.cookie = `admin_flash=${encodeURIComponent(JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "Çeviri sırasında hata oluştu.",
        createdAt: Date.now()
      }))}; path=/; max-age=30; SameSite=Lax`;
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={translate} disabled={pending}>
      <Languages className="h-4 w-4" />
      {pending ? "Çevriliyor" : "TR alanlarını EN/ES çevir"}
    </Button>
  );
}
