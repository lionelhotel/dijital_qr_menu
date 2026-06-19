"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import { localeLabels } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();

  function setLocale(nextLocale: Locale) {
    document.cookie = `menu_locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    const parts = pathname.split("/");
    if (locales.includes(parts[1] as Locale)) {
      parts[1] = nextLocale;
      router.push(parts.join("/"));
      return;
    }
    router.push(`/${nextLocale}/menu`);
  }

  return (
    <div className="flex rounded-md border border-border bg-card p-1" aria-label="Language">
      {locales.map((item) => (
        <Button
          key={item}
          type="button"
          size="sm"
          variant={item === locale ? "accent" : "ghost"}
          className="h-8 min-w-10 px-2"
          onClick={() => setLocale(item)}
        >
          {localeLabels[item]}
        </Button>
      ))}
    </div>
  );
}
