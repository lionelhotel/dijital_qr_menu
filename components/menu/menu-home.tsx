import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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
  const introTitle = localizedSetting(business.welcomeText, locale) || business.businessName;
  const introDescription = localizedSetting(business.welcomeSubText, locale) || business.venueName;
  const introButton = localizedSetting(business.serviceText, locale) || defaultIntroButton(locale);

  if (showIntro) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto grid min-h-screen max-w-6xl place-items-center px-4 py-6">
          <div className="relative grid w-full overflow-hidden rounded-lg border border-border bg-card shadow-2xl md:grid-cols-[minmax(320px,0.84fr)_minmax(0,1fr)]">
            <div className="relative mx-auto aspect-[9/16] h-[78vh] max-h-[820px] min-h-[520px] w-full max-w-[460px] overflow-hidden bg-primary text-primary-foreground md:mx-0">
              {business.introMediaUrl ? (
                isVideoMedia(business.introMediaUrl, business.introMediaKind) ? (
                  <video
                    src={business.introMediaUrl}
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <Image
                    src={business.introMediaUrl}
                    alt={business.businessName}
                    fill
                    priority
                    className="object-cover"
                    sizes="460px"
                  />
                )
              ) : (
                <Image
                  src={
                    business.coverImageUrl ??
                    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=85"
                  }
                  alt={business.businessName}
                  fill
                  priority
                  className="object-cover"
                  sizes="460px"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
              <div className="absolute left-5 top-5 flex items-center gap-3">
                {business.logoUrl ? (
                  <span className="relative h-12 w-12 overflow-hidden rounded-md bg-white/90">
                    <Image src={business.logoUrl} alt={business.businessName} fill className="object-contain p-1.5" />
                  </span>
                ) : null}
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/85">{business.venueName}</span>
              </div>
            </div>

            <div className="relative flex min-h-[520px] flex-col justify-center overflow-hidden px-6 py-10 sm:px-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--accent)/0.14),transparent_34%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--background)))]" />
              <div className="relative max-w-2xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-border bg-background/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-accent" />
                  {business.businessName}
                </div>
                <h1 className="animate-[introRise_900ms_ease-out_both] font-serif text-5xl leading-[1.02] text-foreground sm:text-6xl lg:text-7xl">
                  {introTitle}
                </h1>
                <p className="mt-5 max-w-xl animate-[introFade_1100ms_ease-out_220ms_both] text-base leading-8 text-muted-foreground sm:text-lg">
                  {introDescription}
                </p>
                <Link
                  href={`/${locale}/menu?view=menus`}
                  className="mt-8 inline-flex h-12 items-center justify-center gap-3 rounded-md bg-accent px-6 text-sm font-semibold uppercase tracking-[0.18em] text-accent-foreground shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {introButton}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
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
          {business.logoUrl ? (
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-card">
              <Image src={business.logoUrl} alt={business.businessName} fill className="object-contain p-1" />
            </div>
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-lg font-semibold text-primary-foreground">
              LH
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{business.businessName}</p>
            <p className="truncate text-xs text-muted-foreground">{business.venueName}</p>
          </div>
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
                className="mb-3 inline-flex items-center gap-2 rounded-md bg-card/95 px-3 py-2 text-sm font-medium text-primary"
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
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/20 bg-card/95 text-primary">
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

function defaultIntroButton(locale: Locale) {
  if (locale === "en") return "View menu";
  if (locale === "es") return "Ver menú";
  return "Menüyü görüntüle";
}

function isVideoMedia(url: string, kind?: string | null) {
  return kind === "VIDEO" || /\.(mp4|webm|mov)$/i.test(url);
}
