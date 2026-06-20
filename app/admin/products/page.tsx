import Image from "next/image";
import { createProductAction, deleteProductAction, updateProductAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatPrice } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { SortableList } from "@/components/admin/sortable-list";
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
            <Card key={product.id} className="p-4">
              <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <Image src={product.mainImageUrl ?? "/placeholders/food.svg"} alt={product.id} fill className="object-cover" />
                </div>
                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{product.translations.find((item) => item.locale === "tr")?.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {product.category.translations.find((item) => item.locale === "tr")?.name} ·{" "}
                        {formatPrice(product.price.toString(), product.currency)}
                      </p>
                    </div>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <Button type="submit" variant="outline">Sil</Button>
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
              </div>
            </Card>
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
      <select name="categoryId" defaultValue={product?.categoryId ?? ""} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" required>
        <option value="">Kategori seç</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.translations.find((item) => item.locale === "tr")?.name}
          </option>
        ))}
      </select>
      <Input name="name_tr" placeholder="Türkçe ürün adı" defaultValue={tr?.name} required />
      <Input name="name_en" placeholder="İngilizce ürün adı" defaultValue={en?.name} required />
      <Input name="name_es" placeholder="İspanyolca ürün adı" defaultValue={es?.name} required />
      <Input name="short_tr" placeholder="Türkçe kısa açıklama" defaultValue={tr?.shortDescription ?? ""} required />
      <Input name="short_en" placeholder="İngilizce kısa açıklama" defaultValue={en?.shortDescription ?? ""} required />
      <Input name="short_es" placeholder="İspanyolca kısa açıklama" defaultValue={es?.shortDescription ?? ""} required />
      <Input name="ingredients_tr" placeholder="Türkçe içerik" defaultValue={tr?.ingredients ?? ""} />
      <Input name="ingredients_en" placeholder="İngilizce içerik" defaultValue={en?.ingredients ?? ""} />
      <Input name="ingredients_es" placeholder="İspanyolca içerik" defaultValue={es?.ingredients ?? ""} />
      <Input name="price" type="number" step="0.01" placeholder="Fiyat" defaultValue={product?.price?.toString()} required />
      <Input name="currency" placeholder="Para birimi" defaultValue={product?.currency ?? "TRY"} />
      <Input name="spicyLevel" type="number" min={0} max={5} defaultValue={product?.spicyLevel ?? 0} />
      <Input name="imageUrl" placeholder="Mevcut görsel URL" defaultValue={product?.mainImageUrl ?? ""} />
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Yerel ürün görseli</span>
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="w-full text-sm" />
        <span className="mt-1 block text-xs text-muted-foreground">Önerilen: 1200x900 px veya daha büyük, en fazla 4 MB.</span>
      </label>
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
