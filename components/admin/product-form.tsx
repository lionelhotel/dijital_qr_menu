import type { ReactNode } from "react";
import { MediaPickerField } from "@/components/admin/media-picker-field";
import { NutritionEnergyField } from "@/components/admin/nutrition-energy-field";
import { ProductPriceField } from "@/components/admin/product-price-field";
import { LabeledField } from "@/components/forms/labeled-field";
import { TranslatedInputField } from "@/components/forms/translated-input-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ProductTranslation = {
  locale: string;
  name: string;
  shortDescription?: string | null;
  ingredients?: string | null;
};

export type ProductFormProduct = {
  id: string;
  categoryId: string;
  price: string;
  calories: number | null;
  currency: string;
  prepMinutes: number | null;
  spicyLevel: number;
  mainImageUrl: string | null;
  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isNew: boolean;
  translations: ProductTranslation[];
  menus: { menuId: string }[];
  allergens: { allergenId: string }[];
};

type MediaItem = { id: string; url: string; originalName: string; category: { name: string } | null };
type MediaCategory = { id: string; name: string };

export function ProductForm({
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
  product?: ProductFormProduct;
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
  const sectionSpacing = isCreate ? "mt-4 space-y-1" : "mt-4 space-y-3";

  return (
    <form action={action} className={sectionSpacing}>
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <ProductFormSection number={1} title="Temel bilgiler">
        <div className="mb-3 max-w-sm">
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
        </div>
        <div className="grid gap-3 xl:grid-cols-3">
          <FieldGroup title="Ürün adı">
            <LabeledField label="Türkçe ürün adı"><Input name="name_tr" defaultValue={tr?.name} required /></LabeledField>
            <TranslatedInputField label="İngilizce ürün adı" name="name_en" sourceName="name_tr" targetLocale="en" defaultValue={en?.name} required />
            <TranslatedInputField label="İspanyolca ürün adı" name="name_es" sourceName="name_tr" targetLocale="es" defaultValue={es?.name} required />
          </FieldGroup>
          <FieldGroup title="Kısa açıklama">
            <LabeledField label="Türkçe kısa açıklama"><Input name="short_tr" defaultValue={tr?.shortDescription ?? ""} required /></LabeledField>
            <TranslatedInputField label="İngilizce kısa açıklama" name="short_en" sourceName="short_tr" targetLocale="en" defaultValue={en?.shortDescription ?? ""} required />
            <TranslatedInputField label="İspanyolca kısa açıklama" name="short_es" sourceName="short_tr" targetLocale="es" defaultValue={es?.shortDescription ?? ""} required />
          </FieldGroup>
          <FieldGroup title="İçerik">
            <LabeledField label="Türkçe içerik"><Input name="ingredients_tr" defaultValue={tr?.ingredients ?? ""} /></LabeledField>
            <TranslatedInputField label="İngilizce içerik" name="ingredients_en" sourceName="ingredients_tr" targetLocale="en" defaultValue={en?.ingredients ?? ""} />
            <TranslatedInputField label="İspanyolca içerik" name="ingredients_es" sourceName="ingredients_tr" targetLocale="es" defaultValue={es?.ingredients ?? ""} />
          </FieldGroup>
        </div>
      </ProductFormSection>

      <ProductFormSection number={2} title="Fiyatlandırma ve ürün detayları">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_96px_250px_130px_120px]">
          <LabeledField label="Fiyat"><ProductPriceField productId={product?.id} defaultPrice={product?.price} /></LabeledField>
          <LabeledField label="Para birimi"><Input name="currency" defaultValue={product?.currency ?? "TRY"} /></LabeledField>
          <LabeledField label="kcal/enerji">
            <NutritionEnergyField productId={product?.id} defaultCalories={product?.calories} compact />
          </LabeledField>
          <LabeledField label="Süre (dk)"><Input name="prepMinutes" type="number" min={0} defaultValue={product?.prepMinutes ?? ""} /></LabeledField>
          <LabeledField label="Acılı">
            <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm">
              <input name="spicyLevel" type="checkbox" value="1" defaultChecked={(product?.spicyLevel ?? 0) > 0} />
              Acılı
            </label>
          </LabeledField>
        </div>
      </ProductFormSection>

      <ProductFormSection number={3} title="Ürün görseli">
        <MediaPickerField
          name="imageUrl"
          defaultValue={product?.mainImageUrl ?? ""}
          media={media}
          categories={mediaCategories}
          label="Ürün görseli seç"
          targetWidth={1200}
          targetHeight={900}
        />
      </ProductFormSection>

      <ProductFormSection number={4} title="Menü görünürlüğü">
        <fieldset>
          <legend className="text-sm font-medium">Bu ürün hangi menülerde görünsün?</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {menus.map((menu) => (
              <label key={menu.id} className="flex items-center gap-2 text-sm">
                <input name="menuIds" value={menu.id} type="checkbox" defaultChecked={selectedMenus.has(menu.id)} />
                {menu.translations.find((item) => item.locale === "tr")?.name}
              </label>
            ))}
          </div>
        </fieldset>
      </ProductFormSection>

      <ProductFormSection number={5} title="Manuel alerjenler">
        <fieldset>
          <legend className="text-xs text-muted-foreground">İçerik metninden otomatik alerjen algılanır; burada ek manuel seçim de yapabilirsiniz.</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {allergens.map((allergen) => (
              <label key={allergen.id} className="flex items-center gap-2 text-sm">
                <input name="allergenIds" value={allergen.id} type="checkbox" defaultChecked={selectedAllergens.has(allergen.id)} />
                {allergen.translations.find((item) => item.locale === "tr")?.name ?? allergen.key}
              </label>
            ))}
          </div>
        </fieldset>
      </ProductFormSection>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
        <div className="grid flex-1 grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked={product?.isActive ?? true} /> Aktif</label>
          <label className="flex items-center gap-2"><input name="isAvailable" type="checkbox" defaultChecked={product?.isAvailable ?? true} /> Mevcut</label>
          <label className="flex items-center gap-2"><input name="isFeatured" type="checkbox" defaultChecked={product?.isFeatured ?? false} /> Öne çıkan</label>
          <label className="flex items-center gap-2"><input name="isNew" type="checkbox" defaultChecked={product?.isNew ?? false} /> Yeni</label>
        </div>
        <Button type="submit" className="min-w-28">Kaydet</Button>
      </div>
    </form>
  );
}

function ProductFormSection({
  number,
  title,
  children
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border p-3">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold">
          {number}
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <h4 className="font-semibold">{title}</h4>
      {children}
    </div>
  );
}
