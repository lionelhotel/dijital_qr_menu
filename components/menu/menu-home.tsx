import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Utensils } from "lucide-react";
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
    <main className="menu-horizon-shell min-h-screen bg-[#0e0e0e] text-[#e4e2e1]">
      <header className="fixed left-0 top-0 z-40 w-full border-b border-white/5 bg-[#0e0e0e]/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
          <Link href={`/${locale}/menu`} className="flex min-w-0 flex-1 items-center gap-3">
            {business.logoUrl ? (
              <span className="relative h-10 w-10 shrink-0 overflow-hidden border border-[#d4af37]/35 bg-black/40">
                <Image src={business.logoUrl} alt={business.businessName} fill className="object-contain p-1" />
              </span>
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#d4af37]/35 bg-black/40 text-[#f2ca50]">
                <Utensils className="h-5 w-5" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold uppercase text-[#f2ca50]">{business.businessName}</span>
              <span className="block truncate text-[11px] text-[#d0c5af]/70">{business.venueName}</span>
            </span>
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </header>

      <section className="relative flex min-h-screen flex-col pt-16">
        {backHref ? (
          <Link
            href={backHref}
            className="fixed left-5 top-20 z-30 inline-flex items-center gap-2 border border-[#d4af37]/40 bg-black/45 px-3 py-2 text-xs font-medium text-[#f2ca50] shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur transition hover:bg-[#d4af37] hover:text-[#241a00]"
          >
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        ) : null}

        <div className="menu-horizon-bands flex min-h-[calc(100svh-4rem)] flex-1 flex-col">
          {categories.map((category, index) => {
            const subtitle = category.description || `${category.productCount} ${locale === "en" ? "items" : locale === "es" ? "productos" : "ürün"}`;
            return (
              <Link
                key={category.id}
                href={basePath ? `${basePath}/${category.slug}` : `/${locale}/menu/${category.slug}`}
                className="menu-horizon-band group relative flex min-h-[34svh] flex-1 items-center justify-center overflow-hidden border-b border-white/5 text-center"
              >
                <Image
                  src={category.imageUrl ?? business.coverImageUrl ?? "/placeholders/category.svg"}
                  alt={category.label ?? ""}
                  fill
                  priority={index < 2}
                  className="menu-horizon-image object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(14,14,14,0.48),rgba(14,14,14,0.18)_34%,rgba(14,14,14,0.18)_66%,rgba(14,14,14,0.62))]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.16),transparent_42%)] opacity-75" />
                <div className="relative z-10 max-w-4xl px-5 py-10">
                  <p className="mb-3 line-clamp-2 text-[10px] font-medium uppercase text-[#f2ca50]/45 sm:text-xs">
                    {subtitle}
                  </p>
                  <h2 className="font-sans text-4xl font-thin uppercase leading-none text-[#f2ca50] drop-shadow-[0_10px_30px_rgba(0,0,0,0.65)] transition duration-700 group-hover:text-[#ffe088] sm:text-6xl">
                    {category.label}
                  </h2>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="pointer-events-none fixed bottom-4 left-0 z-20 w-full text-center">
          <p className="text-[8px] uppercase text-[#f2ca50]/25">{localizedSetting(business.welcomeText, locale) || t(locale, "welcome")}</p>
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
