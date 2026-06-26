import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/dictionaries";
import { LanguageSwitcher } from "./language-switcher";

type MenuHomeProps = {
  locale: Locale;
  basePath?: string;
  backHref?: string;
  backLabel?: string;
  business: {
    businessName: string;
    venueName: string;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
    introMediaUrl?: string | null;
    introMediaKind?: string | null;
    introZoomEnabled?: boolean | null;
    welcomeText?: unknown;
    welcomeSubText?: unknown;
    serviceText?: unknown;
  };
  categories: {
    id: string;
    slug: string;
    label?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    productCount: number;
  }[];
  showIntro?: boolean;
};

export function MenuHome({ locale, basePath, backHref, backLabel = "Başa dön", business, categories, showIntro = false }: MenuHomeProps) {
  const introTitles = localizedCycle(business.welcomeText, business.businessName);
  const introDescriptions = localizedCycle(business.welcomeSubText, business.venueName);
  const introButton = localizedSetting(business.serviceText, locale) || defaultIntroButton(locale);
  const introMediaUrl =
    business.introMediaUrl ??
    business.coverImageUrl ??
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=85";
  const introIsVideo = isVideoMedia(introMediaUrl, business.introMediaKind);

  if (showIntro) {
    return (
      <main className="min-h-[100svh] bg-black text-white">
        <section className="relative min-h-[100svh] overflow-hidden">
          <div className="absolute inset-0">
            {introIsVideo ? (
              <video
                src={introMediaUrl}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              />
            ) : (
              <Image
                src={introMediaUrl}
                alt={business.businessName}
                fill
                priority
                className={`object-cover ${business.introZoomEnabled ?? true ? "animate-[introMediaZoom_16s_ease-in-out_infinite_alternate]" : ""}`}
                sizes="100vw"
              />
            )}
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.42),rgba(0,0,0,0.12)_34%,rgba(0,0,0,0.82))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(168,132,79,0.30),transparent_34%)]" />

          <div className="relative z-10 flex min-h-[100svh] flex-col px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <Link href={`/${locale}/menu`} className="flex min-w-0 items-center gap-3">
                {business.logoUrl ? (
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white/90 shadow-lg">
                    <Image src={business.logoUrl} alt={business.businessName} fill className="object-contain p-1.5" />
                  </span>
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/12 font-serif text-lg font-semibold backdrop-blur">
                    LH
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold uppercase tracking-[0.22em] text-white/82">{business.businessName}</p>
                  <p className="truncate text-xs tracking-[0.18em] text-white/58">{business.venueName}</p>
                </div>
              </Link>
            </div>

            <div className="flex flex-1 flex-col justify-end pb-[max(2rem,env(safe-area-inset-bottom))] pt-10">
              <div className="relative min-h-[9.5rem] sm:min-h-[11rem]">
                {introTitles.map((item, index) => (
                  <h1
                    key={item.locale}
                    className="intro-cycle-item absolute inset-x-0 bottom-0 font-serif text-5xl leading-[1.02] text-white drop-shadow-2xl sm:text-7xl"
                    style={{ animationDelay: `${index * 4}s` }}
                  >
                    {item.text}
                  </h1>
                ))}
              </div>

              <div className="relative mt-4 min-h-[5.5rem] max-w-xl">
                {introDescriptions.map((item, index) => (
                  <p
                    key={item.locale}
                    className="intro-cycle-item absolute inset-x-0 top-0 text-base leading-7 text-white/82 drop-shadow sm:text-lg sm:leading-8"
                    style={{ animationDelay: `${index * 4}s` }}
                  >
                    {item.text}
                  </p>
                ))}
              </div>

              <Link
                href={`/${locale}/menu?view=menus`}
                aria-label={introButton}
                title={introButton}
                className="group relative mx-auto mt-10 flex h-24 w-24 items-center justify-center rounded-full border border-white/25 bg-black/36 text-white shadow-[0_0_36px_rgba(168,132,79,0.55)] backdrop-blur transition hover:-translate-y-1 hover:bg-black/46"
              >
                <span className="absolute -inset-3 rounded-full bg-accent/20 blur-xl transition group-hover:bg-accent/30" />
                <span className="absolute inset-0 animate-[introSparkle_2.4s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.85),transparent_28%)] opacity-55" />
                <span className="absolute inset-[2px] rounded-full bg-black/48" />
                <ClocheIcon />
                <span className="sr-only">{introButton}</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-12 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href={`/${locale}/menu`} className="flex min-w-0 flex-1 items-center gap-3">
            {business.logoUrl ? (
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-card">
                <Image src={business.logoUrl} alt={business.businessName} fill className="object-contain p-1" />
              </span>
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-lg font-semibold text-primary-foreground">
                LH
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{business.businessName}</span>
              <span className="block truncate text-xs text-muted-foreground">{business.venueName}</span>
            </span>
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pt-4 sm:pt-6">
        <div className="relative min-h-[190px] overflow-hidden rounded-lg border border-border bg-primary text-primary-foreground shadow-2xl sm:min-h-[270px]">
          <Image
            src={
              business.coverImageUrl ??
              "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80"
            }
            alt={business.venueName}
            fill
            priority
            className="object-cover opacity-65"
            sizes="(max-width: 768px) 100vw, 1024px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/45 to-transparent" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
          <div className="absolute bottom-0 max-w-2xl p-4 sm:p-8">
            {backHref ? (
              <Link
                href={backHref}
                className="mb-3 inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground shadow-lg transition hover:bg-accent/90"
              >
                <ChevronLeft className="h-4 w-4" />
                {backLabel}
              </Link>
            ) : null}
            <h1 className="animate-[introRise_700ms_ease-out_both] font-serif text-3xl leading-tight sm:text-5xl">{business.businessName}</h1>
            <p className="mt-1 text-base text-primary-foreground/90 sm:text-lg">{business.venueName}</p>
            <p className="mt-3 max-w-xl animate-[introFade_900ms_ease-out_150ms_both] text-sm text-primary-foreground/90 sm:text-base">
              {localizedSetting(business.welcomeText, locale) || t(locale, "welcome")}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-5 sm:py-8">
        <div className="space-y-3 sm:space-y-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={basePath ? `${basePath}/${category.slug}` : `/${locale}/menu/${category.slug}`}
              className="group relative block min-h-[150px] overflow-hidden rounded-lg border border-border bg-primary text-primary-foreground shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl sm:min-h-[190px]"
            >
              <Image
                src={category.imageUrl ?? "/placeholders/category.svg"}
                alt={category.label ?? ""}
                fill
                className="object-cover opacity-75 transition group-hover:scale-105 group-hover:opacity-85"
                sizes="(max-width: 768px) 100vw, 1024px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/45 to-primary/15" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
              <div className="absolute inset-0 flex items-center justify-between gap-4 p-5 sm:p-7">
                <div className="max-w-xl">
                  <h2 className="font-serif text-3xl leading-tight sm:text-4xl">{category.label}</h2>
                  {category.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-primary-foreground/82 sm:text-base">
                      {category.description}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs uppercase text-primary-foreground/70">
                    {category.productCount} ürün
                  </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-accent/50 bg-accent text-accent-foreground shadow-lg transition group-hover:bg-accent/90">
                  <ChevronRight className="h-5 w-5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function localizedSetting(value: unknown, locale: Locale) {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return String(record[locale] || record.tr || record.en || "");
}

function localizedCycle(value: unknown, fallback: string) {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return (["tr", "en", "es"] as Locale[]).map((item) => ({
    locale: item,
    text: String(record[item] || record.tr || record.en || fallback)
  }));
}

function defaultIntroButton(locale: Locale) {
  if (locale === "en") return "View menu";
  if (locale === "es") return "Ver menú";
  return "Menüyü görüntüle";
}

function isVideoMedia(url: string, kind?: string | null) {
  return kind === "VIDEO" || /\.(mp4|webm|mov)$/i.test(url);
}

function ClocheIcon() {
  return (
    <svg
      viewBox="0 0 120 92"
      aria-hidden="true"
      className="relative z-10 h-16 w-16 drop-shadow-[0_0_10px_rgba(255,255,255,0.55)]"
      fill="none"
    >
      <path
        d="M18 72h84"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M28 72c1.8-27.5 15-48 32-48s30.2 20.5 32 48"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M54 24a6 6 0 1 1 12 0"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M19 72h-6a7 7 0 0 0 0 14h94a7 7 0 0 0 0-14h-6"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M27 8c6 7 6 15 0 22M93 8c6 7 6 15 0 22M42 3c6 7 6 16 0 24M78 3c6 7 6 16 0 24"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        className="animate-[introSteam_2.6s_ease-in-out_infinite]"
      />
    </svg>
  );
}
