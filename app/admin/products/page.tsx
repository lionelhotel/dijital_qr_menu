import Image from "next/image";
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
import { NutritionEnergyField } from "@/components/admin/nutrition-energy-field";
import { QuickPriceForm } from "@/components/admin/quick-price-form";
import { SortableList } from "@/components/admin/sortable-list";
import { LabeledField } from "@/components/forms/labeled-field";
import { TranslatedInputField } from "@/components/forms/translated-input-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function ProductsPage() {
  await requireAdmin();
  const [categories, products, menus, allergens] = await Promise.all([
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" }, include: { translations: true } }),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        translations: true,
        category: { include: { translations: true } },
        menus: true,
        allergens: true
      }
    }),
    prisma.menu.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" }, include: { translations: true } }),
    prisma.allergen.findMany({ where: { deletedAt: null }, orderBy: { key: "asc" }, include: { translations: true } })
  ]);

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Ürünler</h1>
      <div className="mt-6 grid gap-6 xl:grid-cols-[440px_1fr]">
        <Card className="p-4">
          <h2 className="font-semibold">Ürün oluştur</h2>
          <ProductForm action={createProductAction} categories={categories} menus={menus} allergens={allergens} />
        </Card>
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 font-semibold">Sürükle bırak sıralama</h2>
            <SortableList
              type="product"
              items={products.map((product) => ({
                id: product.id,
                label: product.translations.find((item) => item.locale === "tr")?.name ?? product.id
              }))}
            />
          </Card>
          {products.map((product) => (
            <details key={product.id} className="group rounded-lg border border-border bg-card shadow-soft">
              <summary className="flex cursor-pointer list-none items-center gap-4 p-3 marker:hidden">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image src={product.mainImageUrl ?? "/placeholders/food.svg"} alt={product.id} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold">{product.translations.find((item) => item.locale === "tr")?.name}</h2>
                </div>
                <QuickPriceForm
                  productId={product.id}
                  price={product.price.toString()}
                  action={updateProductPriceAction}
                />
              </summary>
              <div className="border-t border-border p-4">
                <div className="mb-4 flex flex-wrap gap-2">
                  <form action={deleteProductAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <Button type="submit" variant="outline">Sil</Button>
                  </form>
                  <form action={calculateProductNutritionAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <Button type="submit" variant="outline">AI ile kalori hesapla</Button>
                  </form>
                </div>
                <ProductForm
                  action={updateProductAction}
                  product={product}
                  categories={categories}
                  menus={menus}
                  allergens={allergens}
                />
              </div>
            </details>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

type Translation = { locale: string; name: string; shortDescription?: string | null; ingredients?: string | null };

function ProductForm({
  action,
  product,
  categories,
  menus,
  allergens
}: {
  action: (formData: FormData) => Promise<void>;
  product?: {
    id: string;
    categoryId: string;
    price: unknown;
    calories: number | null;
    currency: string;
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
}) {
  const tr = product?.translations.find((item) => item.locale === "tr");
  const en = product?.translations.find((item) => item.locale === "en");
  const es = product?.translations.find((item) => item.locale === "es");
  const selectedMenus = new Set(product?.menus.map((item) => item.menuId));
  const selectedAllergens = new Set(product?.allergens.map((item) => item.allergenId));

  return (
    <form action={action} className="mt-4 space-y-3">
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
      <LabeledField label="Türkçe kısa açıklama"><Input name="short_tr" defaultValue={tr?.shortDescription ?? ""} required /></LabeledField>
      <TranslatedInputField label="İngilizce kısa açıklama" name="short_en" sourceName="short_tr" targetLocale="en" defaultValue={en?.shortDescription ?? ""} required />
      <TranslatedInputField label="İspanyolca kısa açıklama" name="short_es" sourceName="short_tr" targetLocale="es" defaultValue={es?.shortDescription ?? ""} required />
      <LabeledField label="Türkçe içerik"><Input name="ingredients_tr" defaultValue={tr?.ingredients ?? ""} /></LabeledField>
      <TranslatedInputField label="İngilizce içerik" name="ingredients_en" sourceName="ingredients_tr" targetLocale="en" defaultValue={en?.ingredients ?? ""} />
      <TranslatedInputField label="İspanyolca içerik" name="ingredients_es" sourceName="ingredients_tr" targetLocale="es" defaultValue={es?.ingredients ?? ""} />
      <LabeledField label="Fiyat"><Input name="price" type="number" step="0.01" defaultValue={product?.price?.toString()} required /></LabeledField>
      <LabeledField label="1 porsiyon kalori (kcal) ve enerji">
        <NutritionEnergyField defaultCalories={product?.calories} />
      </LabeledField>
      <LabeledField label="Para birimi"><Input name="currency" defaultValue={product?.currency ?? "TRY"} /></LabeledField>
      <LabeledField label="Acılık seviyesi"><Input name="spicyLevel" type="number" min={0} max={5} defaultValue={product?.spicyLevel ?? 0} /></LabeledField>
      <LabeledField label="Mevcut görsel URL"><Input name="imageUrl" defaultValue={product?.mainImageUrl ?? ""} /></LabeledField>
      <LabeledField label="Yerel ürün görseli" hint="Önerilen: 1200x900 px veya daha büyük, en fazla 4 MB.">
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="w-full text-sm" />
      </LabeledField>
      <fieldset className="rounded-md border border-border p-3">
        <legend className="px-1 text-sm font-medium">Bu ürün hangi menülerde görünsün?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {menus.map((menu) => (
            <label key={menu.id} className="flex items-center gap-2 text-sm">
              <input name="menuIds" value={menu.id} type="checkbox" defaultChecked={selectedMenus.has(menu.id)} />
              {menu.translations.find((item) => item.locale === "tr")?.name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="rounded-md border border-border p-3">
        <legend className="px-1 text-sm font-medium">Manuel alerjenler</legend>
        <p className="text-xs text-muted-foreground">İçerik metninden otomatik alerjen algılanır; burada ek manuel seçim de yapabilirsiniz.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {allergens.map((allergen) => (
            <label key={allergen.id} className="flex items-center gap-2 text-sm">
              <input name="allergenIds" value={allergen.id} type="checkbox" defaultChecked={selectedAllergens.has(allergen.id)} />
              {allergen.translations.find((item) => item.locale === "tr")?.name ?? allergen.key}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked={product?.isActive ?? true} /> Aktif</label>
        <label className="flex items-center gap-2"><input name="isAvailable" type="checkbox" defaultChecked={product?.isAvailable ?? true} /> Mevcut</label>
        <label className="flex items-center gap-2"><input name="isFeatured" type="checkbox" defaultChecked={product?.isFeatured ?? false} /> Öne çıkan</label>
        <label className="flex items-center gap-2"><input name="isNew" type="checkbox" defaultChecked={product?.isNew ?? false} /> Yeni</label>
      </div>
      <Button type="submit">Kaydet</Button>
    </form>
  );
}
