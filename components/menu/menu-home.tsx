import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/dictionaries";
import { LanguageSwitcher } from "./language-switcher";

type MenuHomeProps = {
  locale: Locale;
  business: {
    businessName: string;
    venueName: string;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
  };
  categories: {
    id: string;
    slug: string;
    label?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    productCount: number;
  }[];
};

export function MenuHome({ locale, business, categories }: MenuHomeProps) {
  return (
    <main className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-lg font-semibold text-primary-foreground">
            LH
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{business.businessName}</p>
            <p className="truncate text-xs text-muted-foreground">{business.venueName}</p>
          </div>
          <LanguageSwitcher locale={locale} />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pt-4 sm:pt-6">
        <div className="relative min-h-[190px] overflow-hidden rounded-lg bg-primary text-primary-foreground sm:min-h-[270px]">
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
          <div className="absolute bottom-0 max-w-2xl p-4 sm:p-8">
            <h1 className="font-serif text-3xl leading-tight sm:text-5xl">{business.businessName}</h1>
            <p className="mt-1 text-base text-primary-foreground/90 sm:text-lg">{business.venueName}</p>
            <p className="mt-3 max-w-xl text-sm text-primary-foreground/90 sm:text-base">{t(locale, "welcome")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-5 sm:py-8">
        <div className="space-y-3 sm:space-y-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${locale}/menu/${category.slug}`}
              className="group relative block min-h-[150px] overflow-hidden rounded-lg border border-border bg-primary text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg sm:min-h-[190px]"
            >
              <Image
                src={category.imageUrl ?? "/placeholders/category.svg"}
                alt={category.label ?? ""}
                fill
                className="object-cover opacity-75 transition group-hover:scale-105 group-hover:opacity-85"
                sizes="(max-width: 768px) 100vw, 1024px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/45 to-primary/15" />
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
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-card/95 text-primary">
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
