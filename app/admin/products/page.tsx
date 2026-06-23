import Image from "next/image";
import { Search } from "lucide-react";
import {
  calculateProductNutritionAction,
  createProductAction,
  deleteProductAction,
  updateProductAction,
  updateProductPriceAction
} from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { CalculateNutritionForm } from "@/components/admin/calculate-nutrition-form";
import { MediaPickerField } from "@/components/admin/media-picker-field";
import { NutritionEnergyField } from "@/components/admin/nutrition-energy-field";
import { ProductPriceField } from "@/components/admin/product-price-field";
import { QuickPriceForm } from "@/components/admin/quick-price-form";
import { SortableList } from "@/components/admin/sortable-list";
import { LabeledField } from "@/components/forms/labeled-field";
import { TranslatedInputField } from "@/components/forms/translated-input-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function ProductsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; categoryId?: string }>;
}) {
  await requireAdmin();
  const filters = await searchParams;
  const query = filters?.q?.trim() ?? "";
  const categoryId = filters?.categoryId ?? "";
  const productWhere = {
    deletedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...(query
      ? {
          OR: [
            { translations: { some: { name: { contains: query, mode: "insensitive" as const } } } },
            { translations: { some: { shortDescription: { contains: query, mode: "insensitive" as const } } } },
            { category: { translations: { some: { name: { contains: query, mode: "insensitive" as const } } } } }
          ]
        }
      : {})
  };

  const [categories, products, productsForSorting, menus, allergens, media, mediaCategories] = await Promise.all([
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" }, include: { translations: true } }),
    prisma.product.findMany({
      where: productWhere,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        translations: true,
        category: { include: { translations: true } },
        menus: true,
        allergens: true
      }
    }),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { translations: true }
    }),
    prisma.menu.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" }, include: { translations: true } }),
    prisma.allergen.findMany({ where: { deletedAt: null }, orderBy: { key: "asc" }, include: { translations: true } }),
    prisma.media.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { createdAt: "desc" }, include: { category: true }, take: 200 }),
    prisma.mediaCategory.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Ürünler</h1>
      <div className="mt-6 space-y-6">
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Ürün oluştur</h2>
              <p className="mt-1 text-sm text-muted-foreground">Temel bilgiler yatay alanda, menü ve alerjen seçimleri formun sonunda yer alır.</p>
            </div>
          </div>
          <ProductForm
            action={createProductAction}
            categories={categories}
            menus={menus}
            allergens={allergens}
            media={media}
            mediaCategories={mediaCategories}
            variant="create"
          />
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 font-semibold">Sürükle bırak sıralama</h2>
          <SortableList
            type="product"
            layout="horizontal"
            items={productsForSorting.map((product) => ({
              id: product.id,
              label: product.translations.find((item) => item.locale === "tr")?.name ?? product.id
            }))}
          />
        </Card>

        <Card className="p-4">
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={query} className="pl-10" placeholder="Ürün ara" />
            </label>
            <select
              name="categoryId"
              defaultValue={categoryId}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">Tüm kategoriler</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.translations.find((item) => item.locale === "tr")?.name}
                </option>
              ))}
            </select>
            <Button type="submit">Ara</Button>
          </form>
        </Card>

        {products.length > 0 ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {products.map((product) => {
              const productName = product.translations.find((item) => item.locale === "tr")?.name ?? product.id;
              const categoryName = product.category.translations.find((item) => item.locale === "tr")?.name;

              return (
                <details key={product.id} className="group rounded-lg border border-border bg-card shadow-soft">
                  <summary className="flex cursor-pointer list-none items-center gap-4 p-3 marker:hidden">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image src={product.mainImageUrl ?? "/placeholders/food.svg"} alt={productName} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold">{productName}</h2>
                      {categoryName ? <p className="mt-1 truncate text-xs text-muted-foreground">{categoryName}</p> : null}
                    </div>
                    <QuickPriceForm productId={product.id} price={product.price.toString()} action={updateProductPriceAction} />
                  </summary>
                  <div className="border-t border-border p-4">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <Button type="submit" variant="outline">Sil</Button>
                      </form>
                      <CalculateNutritionForm productId={product.id} action={calculateProductNutritionAction} />
                    </div>
                    <ProductForm
                      action={updateProductAction}
                      product={product}
                      categories={categories}
                      menus={menus}
                      allergens={allergens}
                      media={media}
                      mediaCategories={mediaCategories}
                    />
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">Bu arama ve kategori filtresine uygun ürün bulunamadı.</Card>
        )}
      </div>
    </AdminShell>
  );
}

type Translation = { locale: string; name: string; shortDescription?: string | null; ingredients?: string | null };
type MediaItem = { id: string; url: string; originalName: string; category: { name: string } | null };
type MediaCategory = { id: string; name: string };

function ProductForm({
  action,
  product,
  categories,
  menus,
  allergens,
  media,
  mediaCategories,
  variant = "edit"
}: {
  action: (formData: FormData) => Promise<void>;
  product?: {
    id: string;
    categoryId: string;
    price: unknown;
    calories: number | null;
    currency: string;
    prepMinutes: number | null;
    spicyLevel: number;
    mainImageUrl: string | null;
    isActive: boolean;
    isAvailable: boolean;
    isFeatured: boolean;
    isNew: boolean;
    translations: Translation[];
    menus: { menuId: string }[];
    allergens: { allergenId: string }[];
  };
  categories: { id: string; translations: { locale: string; name: string }[] }[];
  menus: { id: string; translations: { locale: string; name: string }[] }[];
  allergens: { id: string; key: string; translations: { locale: string; name: string }[] }[];
  media: MediaItem[];
  mediaCategories: MediaCategory[];
  variant?: "create" | "edit";
}) {
  const tr = product?.translations.find((item) => item.locale === "tr");
  const en = product?.translations.find((item) => item.locale === "en");
  const es = product?.translations.find((item) => item.locale === "es");
  const selectedMenus = new Set(product?.menus.map((item) => item.menuId));
  const selectedAllergens = new Set(product?.allergens.map((item) => item.allergenId));
  const isCreate = variant === "create";
  const formClassName = isCreate ? "mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4" : "mt-4 space-y-3";
  const wideFieldClassName = isCreate ? "md:col-span-2" : undefined;
  const fullFieldClassName = isCreate ? "md:col-span-2 xl:col-span-4" : undefined;

  return (
    <form action={action} className={formClassName}>
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <LabeledField label="Kategori">
        <select name="categoryId" defaultValue={product?.categoryId ?? ""} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" required>
          <option value="">Kategori seç</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.translations.find((item) => item.locale === "tr")?.name}
            </option>
          ))}
        </select>
      </LabeledField>
      <LabeledField label="Türkçe ürün adı"><Input name="name_tr" defaultValue={tr?.name} required /></LabeledField>
      <TranslatedInputField label="İngilizce ürün adı" name="name_en" sourceName="name_tr" targetLocale="en" defaultValue={en?.name} required />
      <TranslatedInputField label="İspanyolca ürün adı" name="name_es" sourceName="name_tr" targetLocale="es" defaultValue={es?.name} required />
      <LabeledField label="Türkçe kısa açıklama" className={wideFieldClassName}><Input name="short_tr" defaultValue={tr?.shortDescription ?? ""} required /></LabeledField>
      <TranslatedInputField label="İngilizce kısa açıklama" name="short_en" sourceName="short_tr" targetLocale="en" defaultValue={en?.shortDescription ?? ""} required fieldClassName={wideFieldClassName} />
      <TranslatedInputField label="İspanyolca kısa açıklama" name="short_es" sourceName="short_tr" targetLocale="es" defaultValue={es?.shortDescription ?? ""} required fieldClassName={wideFieldClassName} />
      <LabeledField label="Türkçe içerik" className={wideFieldClassName}><Input name="ingredients_tr" defaultValue={tr?.ingredients ?? ""} /></LabeledField>
      <TranslatedInputField label="İngilizce içerik" name="ingredients_en" sourceName="ingredients_tr" targetLocale="en" defaultValue={en?.ingredients ?? ""} fieldClassName={wideFieldClassName} />
      <TranslatedInputField label="İspanyolca içerik" name="ingredients_es" sourceName="ingredients_tr" targetLocale="es" defaultValue={es?.ingredients ?? ""} fieldClassName={wideFieldClassName} />
      <LabeledField label="Fiyat"><ProductPriceField productId={product?.id} defaultPrice={product?.price?.toString()} /></LabeledField>
      <LabeledField label="1 porsiyon kalori (kcal) ve enerji">
        <NutritionEnergyField productId={product?.id} defaultCalories={product?.calories} />
      </LabeledField>
      <LabeledField label="Para birimi"><Input name="currency" defaultValue={product?.currency ?? "TRY"} /></LabeledField>
      <LabeledField label="Hazırlanma süresi (dk)"><Input name="prepMinutes" type="number" min={0} defaultValue={product?.prepMinutes ?? ""} /></LabeledField>
      <LabeledField label="Acılık seviyesi"><Input name="spicyLevel" type="number" min={0} max={5} defaultValue={product?.spicyLevel ?? 0} /></LabeledField>
      <LabeledField label="Ürün görseli" className={wideFieldClassName}>
        <MediaPickerField
          name="imageUrl"
          defaultValue={product?.mainImageUrl ?? ""}
          media={media}
          categories={mediaCategories}
          label="Ürün görseli seç"
          targetWidth={1200}
          targetHeight={900}
        />
      </LabeledField>
      <fieldset className={`rounded-md border border-border p-3 ${fullFieldClassName ?? ""}`}>
        <legend className="px-1 text-sm font-medium">Bu ürün hangi menülerde görünsün?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {menus.map((menu) => (
            <label key={menu.id} className="flex items-center gap-2 text-sm">
              <input name="menuIds" value={menu.id} type="checkbox" defaultChecked={selectedMenus.has(menu.id)} />
              {menu.translations.find((item) => item.locale === "tr")?.name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className={`rounded-md border border-border p-3 ${fullFieldClassName ?? ""}`}>
        <legend className="px-1 text-sm font-medium">Manuel alerjenler</legend>
        <p className="text-xs text-muted-foreground">İçerik metninden otomatik alerjen algılanır; burada ek manuel seçim de yapabilirsiniz.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {allergens.map((allergen) => (
            <label key={allergen.id} className="flex items-center gap-2 text-sm">
              <input name="allergenIds" value={allergen.id} type="checkbox" defaultChecked={selectedAllergens.has(allergen.id)} />
              {allergen.translations.find((item) => item.locale === "tr")?.name ?? allergen.key}
            </label>
          ))}
        </div>
      </fieldset>
      <div className={`grid grid-cols-2 gap-2 text-sm md:grid-cols-4 ${fullFieldClassName ?? ""}`}>
        <label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked={product?.isActive ?? true} /> Aktif</label>
        <label className="flex items-center gap-2"><input name="isAvailable" type="checkbox" defaultChecked={product?.isAvailable ?? true} /> Mevcut</label>
        <label className="flex items-center gap-2"><input name="isFeatured" type="checkbox" defaultChecked={product?.isFeatured ?? false} /> Öne çıkan</label>
        <label className="flex items-center gap-2"><input name="isNew" type="checkbox" defaultChecked={product?.isNew ?? false} /> Yeni</label>
      </div>
      <Button type="submit" className={isCreate ? "w-fit" : undefined}>Kaydet</Button>
    </form>
  );
}
