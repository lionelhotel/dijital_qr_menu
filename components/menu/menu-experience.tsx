"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ChevronLeft, Clock, Flame, Leaf, Search, Star, WheatOff, X } from "lucide-react";
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
    <main className="min-h-screen overflow-x-hidden bg-[#131313] pb-28 text-[#e4e2e1]">
      <header className="fixed left-0 top-0 z-50 w-full border-b border-[#d4af37]/30 bg-[#131313]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <Link href={`/${locale}/menu`} className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-[#d4af37]/30 bg-[#1f2020] text-lg font-semibold text-[#f2ca50]">
              {business.logoUrl ? (
                <Image src={business.logoUrl} alt={business.businessName} width={36} height={36} className="h-9 w-9 object-contain" />
              ) : (
                "LH"
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-serif text-xl font-semibold leading-tight text-[#f2ca50]">{business.businessName}</span>
              <span className="block truncate text-xs text-[#d0c5af]/72">{business.venueName}</span>
            </span>
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </header>

      <section className="relative h-[397px] w-full overflow-hidden pt-20">
        <div className="absolute inset-0 top-20">
          <Image
            src={
              menuImageUrl ??
              business.coverImageUrl ??
              "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80"
            }
            alt={menuTitle ?? business.venueName}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,#131313_0%,rgba(19,19,19,0.62)_42%,rgba(19,19,19,0.08)_100%)]" />
          <div className="absolute bottom-8 left-0 w-full px-6 pb-8">
            <Link
              href={backHref ?? `/${locale}/menu`}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/35 bg-[#1f2020]/85 px-4 py-2 text-sm font-medium text-[#f2ca50] shadow-xl backdrop-blur transition hover:bg-[#d4af37] hover:text-[#241a00]"
            >
              <ChevronLeft className="h-4 w-4" />
              Menü
            </Link>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f2ca50]">{menuTitle ?? business.businessName}</span>
            </div>
            <h1 className="font-serif text-3xl font-semibold leading-tight text-[#ffe088] sm:text-5xl">Gourmet Deneyimi</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#d0c5af]/82 sm:text-base">
              {menuDescription || t(locale, "welcomeSub")}
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-8 px-6 py-3 sm:hidden">
        <div className="space-y-3">
          <SearchField locale={locale} query={query} setQuery={setQuery} />
          <FilterGrid filters={filters} toggleFilter={toggleFilter} />
        </div>
      </section>

      <section className="relative z-20 mx-auto -mt-8 hidden max-w-6xl px-6 py-5 sm:block">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchField locale={locale} query={query} setQuery={setQuery} />
          <div className="flex gap-2 overflow-x-auto">
            {quickFilters.map(({ key, label, icon: Icon }) => (
              <FilterButton key={key} active={filters.includes(key)} onClick={() => toggleFilter(key)}>
                <Icon className="h-4 w-4" />
                {label}
              </FilterButton>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => setSelected(product)}
            className="group flex flex-col overflow-hidden rounded-xl border border-[#d4af37]/15 bg-[#1f2020] text-left transition duration-300 hover:-translate-y-0.5 hover:border-[#d4af37]/40"
          >
            <div className="relative h-64 w-full overflow-hidden bg-[#353535]">
              <Image
                src={product.mainImageUrl ?? "/placeholders/food.svg"}
                alt={product.name}
                fill
                loading="lazy"
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                {product.isFeatured ? <Badge>{t(locale, "featured")}</Badge> : null}
                {product.isNew ? <Badge>{t(locale, "new")}</Badge> : null}
                {!product.isAvailable ? <Badge>{t(locale, "unavailable")}</Badge> : null}
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="line-clamp-2 font-serif text-2xl font-medium leading-tight text-[#d4af37]">{product.name}</h2>
                <p className="shrink-0 font-serif text-2xl font-semibold leading-tight text-[#f2ca50]">
                  {formatPrice(product.price, product.currency, locale === "tr" ? "tr-TR" : locale)}
                </p>
              </div>
              <p className="line-clamp-2 text-sm leading-6 text-[#d0c5af]/70">{product.shortDescription}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {product.spicyLevel > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded border border-[#99907c]/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#d0c5af]">
                    <Flame className="h-3 w-3 text-destructive" />
                    {spicyText(locale)}
                  </span>
                ) : null}
                {visibleDietaryTags(product).slice(0, 3).map((tag) => (
                  <span key={tag.key} className="rounded border border-[#99907c]/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#d0c5af]">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </section>

      {filteredProducts.length === 0 ? (
        <p className="mx-auto mt-12 max-w-6xl px-6 text-center text-[#d0c5af]/70">{t(locale, "noResults")}</p>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="safe-bottom mx-auto flex max-h-[94vh] max-w-2xl flex-col overflow-hidden rounded-xl border border-[#d4af37]/20 bg-[#1f2020] shadow-2xl">
            <div className="relative aspect-[16/10] bg-[#353535]">
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
                className="absolute right-3 top-3 bg-[#1f2020] text-[#f2ca50]"
                onClick={() => setSelected(null)}
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto p-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-serif text-3xl text-[#d4af37]">{selected.name}</h2>
                <p className="text-2xl font-bold text-[#f2ca50] sm:text-3xl">
                  {formatPrice(selected.price, selected.currency, locale === "tr" ? "tr-TR" : locale)}
                </p>
              </div>
              <p className="mt-3 leading-7 text-[#d0c5af]/75">
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
              <TagList title={t(locale, "dietary")} values={visibleDietaryTags(selected).map((item) => item.name ?? item.key)} />
              <p className="mt-5 rounded-md border border-[#99907c]/20 bg-[#353535]/60 p-3 text-sm text-[#d0c5af]/75">
                {t(locale, "notice")}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function SearchField({
  locale,
  query,
  setQuery
}: {
  locale: Locale;
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <label className="relative block flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#99907c]" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t(locale, "search")}
        className="h-12 rounded-full border-[#d4af37]/10 bg-[#1f2020] pl-12 text-[#e4e2e1] shadow-xl placeholder:text-[#d0c5af]/40 focus-visible:ring-[#d4af37]"
      />
    </label>
  );
}

function FilterGrid({ filters, toggleFilter }: { filters: string[]; toggleFilter: (key: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {quickFilters.map(({ key, label, icon: Icon }) => (
        <FilterButton key={key} active={filters.includes(key)} onClick={() => toggleFilter(key)}>
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </FilterButton>
      ))}
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition ${
        active
          ? "border-[#f2ca50] bg-[#f2ca50]/10 text-[#f2ca50]"
          : "border-[#99907c]/30 bg-transparent text-[#d0c5af] hover:border-[#d4af37]/50 hover:text-[#f2ca50]"
      }`}
    >
      {children}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-[#d4af37]/30 bg-[#d4af37]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#f2ca50]">
      {children}
    </span>
  );
}

function visibleDietaryTags(product: Product) {
  if (!product.isFeatured) return product.dietaryTags;
  return product.dietaryTags.filter((tag) => tag.key !== "chef");
}

function Detail({ title, value, icon }: { title: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#e4e2e1]">{icon}{title}</h3>
      <p className="mt-1 text-sm leading-6 text-[#d0c5af]/75">{value}</p>
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
      <h3 className="text-sm font-semibold text-[#e4e2e1]">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className="rounded border border-[#99907c]/30 px-2 py-1 text-xs text-[#d0c5af]">
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}
