"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, X, Flame, Leaf, WheatOff, Star, BadgeCheck, ChevronLeft, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/dictionaries";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "./language-switcher";

type Product = {
  id: string;
  name: string;
  shortDescription?: string | null;
  detailedDescription?: string | null;
  ingredients?: string | null;
  price: string;
  currency: string;
  portion?: string | null;
  calories?: number | null;
  prepMinutes?: number | null;
  spicyLevel: number;
  mainImageUrl?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  isNew: boolean;
  allergens: { key: string; icon: string; name?: string | null }[];
  dietaryTags: { key: string; icon: string; name?: string | null }[];
};

type Category = {
  id: string;
  slug: string;
  label?: string | null;
  description?: string | null;
  products: Product[];
};

type MenuExperienceProps = {
  locale: Locale;
  business: {
    businessName: string;
    venueName: string;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
  };
  categories: Category[];
  menuTitle?: string | null;
  menuDescription?: string | null;
  menuImageUrl?: string | null;
  backHref?: string;
};

const quickFilters = [
  { key: "vegan", label: "Vegan", icon: Leaf },
  { key: "gluten-free", label: "Glutensiz", icon: WheatOff },
  { key: "chef", label: "Şef", icon: Star },
  { key: "available", label: "Mevcut", icon: BadgeCheck }
];

export function MenuExperience({ locale, business, categories, menuTitle, menuDescription, menuImageUrl, backHref }: MenuExperienceProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);

  const products = useMemo(() => {
    return categories.flatMap((category) =>
      category.products.map((product) => ({ ...product, categoryId: category.id }))
    );
  }, [categories]);

  const filteredProducts = products.filter((product) => {
    const text = `${product.name} ${product.shortDescription ?? ""} ${product.ingredients ?? ""}`.toLowerCase();
    const matchesQuery = !query || text.includes(query.toLowerCase());
    const matchesFilters = filters.every((filter) => {
      if (filter === "available") return product.isAvailable;
      if (filter === "chef") return product.isFeatured;
      return product.dietaryTags.some((tag) => tag.key === filter);
    });
    return matchesQuery && matchesFilters;
  });

  function toggleFilter(key: string) {
    setFilters((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href={`/${locale}/menu`} className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-lg font-semibold text-primary-foreground">
              {business.logoUrl ? (
                <Image src={business.logoUrl} alt={business.businessName} width={36} height={36} className="h-9 w-9 object-contain" />
              ) : (
                "LH"
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{business.businessName}</span>
              <span className="block truncate text-xs text-muted-foreground">{business.venueName}</span>
            </span>
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-4 pt-4 sm:pt-6">
        <div className="relative min-h-[190px] overflow-hidden rounded-lg bg-primary text-primary-foreground sm:min-h-[280px]">
          <Image
            src={
              menuImageUrl ??
              business.coverImageUrl ??
              "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80"
            }
            alt={menuTitle ?? business.venueName}
            fill
            priority
            className="object-cover opacity-65"
            sizes="(max-width: 768px) 100vw, 1100px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/45 to-transparent" />
          <div className="absolute bottom-0 max-w-2xl p-4 sm:p-8">
            <Link
              href={backHref ?? `/${locale}/menu`}
              className="mb-3 inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground shadow-lg transition hover:bg-accent/90"
            >
              <ChevronLeft className="h-4 w-4" />
              Menü
            </Link>
            <h1 className="font-serif text-3xl leading-tight sm:text-5xl">{menuTitle ?? business.businessName}</h1>
            <p className="mt-1 text-base text-primary-foreground/90 sm:mt-2 sm:text-lg">{business.venueName}</p>
            <p className="mt-3 max-w-xl text-sm text-primary-foreground/90 sm:mt-5 sm:text-base">
              {menuDescription || t(locale, "welcomeSub")}
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-[69px] z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="space-y-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(locale, "search")}
              className="h-11 pl-10"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            {quickFilters.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                type="button"
                variant={filters.includes(key) ? "accent" : "outline"}
                onClick={() => toggleFilter(key)}
                className="h-9 justify-start px-3"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto hidden max-w-6xl px-4 py-5 sm:block">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(locale, "search")}
              className="pl-10"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto">
            {quickFilters.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                type="button"
                variant={filters.includes(key) ? "accent" : "outline"}
                onClick={() => toggleFilter(key)}
                className="shrink-0"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2 sm:gap-4 sm:py-0 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => setSelected(product)}
            className="group flex overflow-hidden rounded-lg border border-border bg-card text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg sm:block"
          >
            <div className="relative h-28 w-28 shrink-0 bg-muted sm:h-auto sm:w-full sm:aspect-[4/3]">
              <Image
                src={product.mainImageUrl ?? "/placeholders/food.svg"}
                alt={product.name}
                fill
                loading="lazy"
                className="object-cover transition group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute left-2 top-2 hidden flex-wrap gap-2 sm:flex sm:left-3 sm:top-3">
                {product.isFeatured ? <Badge>{t(locale, "featured")}</Badge> : null}
                {product.isNew ? <Badge>{t(locale, "new")}</Badge> : null}
                {!product.isAvailable ? <Badge>{t(locale, "unavailable")}</Badge> : null}
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2 p-3 sm:space-y-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="line-clamp-2 font-serif text-base leading-tight sm:text-xl">{product.name}</h2>
                <p className="shrink-0 text-sm font-semibold text-accent sm:text-base">
                  {formatPrice(product.price, product.currency, locale === "tr" ? "tr-TR" : locale)}
                </p>
              </div>
              <p className="line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">{product.shortDescription}</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {product.isFeatured ? <MobileBadge>{t(locale, "featured")}</MobileBadge> : null}
                {product.isNew ? <MobileBadge>{t(locale, "new")}</MobileBadge> : null}
                {product.spicyLevel > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                    <Flame className="h-3 w-3 text-destructive" />
                    {spicyText(locale)}
                  </span>
                ) : null}
                {product.dietaryTags.slice(0, 3).map((tag) => (
                  <span key={tag.key} className="rounded-md bg-muted px-2 py-1 text-xs">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </section>

      {filteredProducts.length === 0 ? (
        <p className="mx-auto mt-12 max-w-6xl px-4 text-center text-muted-foreground">{t(locale, "noResults")}</p>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 bg-primary/60 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="safe-bottom mx-auto flex max-h-[94vh] max-w-2xl flex-col overflow-hidden rounded-lg bg-card shadow-2xl">
            <div className="relative aspect-[16/10] bg-muted">
              <Image
                src={selected.mainImageUrl ?? "/placeholders/food.svg"}
                alt={selected.name}
                fill
                className="object-cover"
                sizes="700px"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="absolute right-3 top-3 bg-card"
                onClick={() => setSelected(null)}
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto p-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-serif text-3xl">{selected.name}</h2>
                <p className="text-2xl font-bold text-accent sm:text-3xl">
                  {formatPrice(selected.price, selected.currency, locale === "tr" ? "tr-TR" : locale)}
                </p>
              </div>
              <p className="mt-3 leading-7 text-muted-foreground">
                {selected.detailedDescription || selected.shortDescription}
              </p>
              {selected.ingredients ? <Detail title={t(locale, "ingredients")} value={selected.ingredients} /> : null}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {selected.portion ? <Detail title={t(locale, "portion")} value={selected.portion} /> : null}
                {selected.prepMinutes ? (
                  <Detail
                    title={t(locale, "prepTime")}
                    value={`${selected.prepMinutes} ${t(locale, "minutesShort")}`}
                    icon={<Clock className="h-4 w-4" />}
                  />
                ) : null}
                {selected.calories ? (
                  <Detail title={t(locale, "calories")} value={formatNutrition(selected.calories, locale)} />
                ) : null}
                {selected.spicyLevel > 0 ? (
                  <Detail
                    title={spicyText(locale)}
                    value={spicyText(locale)}
                    icon={<Flame className="h-4 w-4 text-destructive" />}
                  />
                ) : null}
              </div>
              <TagList title={t(locale, "allergens")} values={selected.allergens.map((item) => item.name ?? item.key)} />
              <TagList title={t(locale, "dietary")} values={selected.dietaryTags.map((item) => item.name ?? item.key)} />
              <p className="mt-5 rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
                {t(locale, "notice")}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-card/95 px-2 py-1 text-xs font-medium text-primary shadow-sm">{children}</span>;
}

function MobileBadge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent sm:hidden">{children}</span>;
}

function Detail({ title, value, icon }: { title: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}

function formatNutrition(calories: number, locale: Locale) {
  const kilojoules = Math.round(calories * 4.184);
  return `${calories} kcal / ${kilojoules} kJ. ${t(locale, "nutritionAverageNote")}`;
}

function spicyText(locale: Locale) {
  if (locale === "en") return "Spicy";
  if (locale === "es") return "Picante";
  return "Acılı";
}

function TagList({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className="rounded-md bg-muted px-2 py-1 text-xs">
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}
