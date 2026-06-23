"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Flash = {
  type: "success" | "error" | "info";
  message: string;
  createdAt: number;
};

export function AdminFlash() {
  const [flash, setFlash] = useState<Flash | null>(null);

  useEffect(() => {
    function parseFlash(raw: string) {
      let decoded = raw;
      for (let index = 0; index < 3; index += 1) {
        try {
          decoded = decodeURIComponent(decoded);
        } catch {
          break;
        }
      }
      return JSON.parse(decoded) as Flash;
    }

    function readFlash() {
      const raw = document.cookie
        .split("; ")
        .find((item) => item.startsWith("admin_flash="))
        ?.split("=")[1];
      if (!raw) return;

      try {
        const parsed = parseFlash(raw);
        setFlash(parsed);
        document.cookie = "admin_flash=; path=/; max-age=0; SameSite=Lax";
      } catch {
        document.cookie = "admin_flash=; path=/; max-age=0; SameSite=Lax";
      }
    }

    function handleFlash(event: Event) {
      const customEvent = event as CustomEvent<Flash>;
      if (customEvent.detail) setFlash(customEvent.detail);
    }

    readFlash();
    window.addEventListener("admin-flash", handleFlash);
    const timer = window.setInterval(readFlash, 800);
    return () => {
      window.removeEventListener("admin-flash", handleFlash);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 4500);
    return () => window.clearTimeout(timer);
  }, [flash]);

  if (!flash) return null;

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 flex max-w-md items-start gap-3 rounded-md border bg-card p-4 text-sm shadow-lg",
        flash.type === "success" && "border-green-200 text-green-900",
        flash.type === "error" && "border-destructive/30 text-destructive",
        flash.type === "info" && "border-border text-foreground"
      )}
      role="status"
    >
      <p className="leading-6">{flash.message}</p>
      <button type="button" onClick={() => setFlash(null)} aria-label="Bildirimi kapat">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
