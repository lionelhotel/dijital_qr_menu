export const locales = ["tr", "en", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  tr: "TR",
  en: "EN",
  es: "ES"
};

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}

export function detectLocale(acceptLanguage: string | null, saved?: string | null): Locale {
  if (isLocale(saved)) return saved;

  const parts = acceptLanguage
    ?.split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter(Boolean);

  for (const part of parts ?? []) {
    const base = part.split("-")[0];
    if (isLocale(base)) return base;
  }

  return defaultLocale;
}

export function fallbackText<T extends Record<string, string | null | undefined>>(
  values: T,
  locale: Locale
) {
  return values[locale] || values.en || values.tr || "";
}
