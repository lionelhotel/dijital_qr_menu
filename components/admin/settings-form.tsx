"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SettingsForm({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setSaving(true);
        void (async () => {
          try {
            const response = await fetch("/api/admin/settings", {
              method: "POST",
              body: new FormData(form)
            });
            const data = (await response.json().catch(() => ({}))) as { error?: string };
            if (!response.ok) throw new Error(data.error || "Ayarlar kaydedilemedi.");
            showFlash("success", "Ayarlar basariyla kaydedildi.");
            router.refresh();
          } catch (error) {
            showFlash("error", error instanceof Error ? error.message : "Ayarlar kaydedilemedi.");
          } finally {
            setSaving(false);
          }
        })();
      }}
      data-saving={saving ? "true" : "false"}
      className="mt-6 grid gap-6 lg:grid-cols-2"
    >
      {children}
    </form>
  );
}

function showFlash(type: "success" | "error" | "info", message: string) {
  const flash = { type, message, createdAt: Date.now() };
  document.cookie = `admin_flash=${encodeURIComponent(JSON.stringify(flash))}; path=/; max-age=30; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent("admin-flash", { detail: flash }));
}
