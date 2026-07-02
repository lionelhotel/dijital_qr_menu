import { Download, RefreshCw, Search, Upload } from "lucide-react";
import { createProductAction, importProductsExcelAction, syncProductLabelsFromContentAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductCategoryTable, type ProductCategoryGroup, type ProductTableRow } from "@/components/admin/product-category-table";
import { ProductForm } from "@/components/admin/product-form";
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

  const [categories, products, menus, allergens, dietaryTags, media, mediaCategories] = await Promise.all([
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" }, include: { translations: true } }),
    prisma.product.findMany({
      where: productWhere,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        translations: true,
        category: { include: { translations: true } },
        menus: true,
        allergens: true,
        dietaryTags: true
      }
    }),
    prisma.menu.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" }, include: { translations: true } }),
    prisma.allergen.findMany({ where: { deletedAt: null }, orderBy: { key: "asc" }, include: { translations: true } }),
    prisma.dietaryTag.findMany({ where: { deletedAt: null }, orderBy: { key: "asc" }, include: { translations: true } }),
    prisma.media.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { createdAt: "desc" }, include: { category: true }, take: 200 }),
    prisma.mediaCategory.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);

  const rows: ProductTableRow[] = products.map((product) => ({
    id: product.id,
    categoryId: product.categoryId,
    categoryName: product.category.translations.find((item) => item.locale === "tr")?.name ?? product.categoryId,
    price: product.price.toString(),
    calories: product.calories,
    currency: product.currency,
    prepMinutes: product.prepMinutes,
    spicyLevel: product.spicyLevel,
    mainImageUrl: product.mainImageUrl,
    isActive: product.isActive,
    isAvailable: product.isAvailable,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    translations: product.translations,
    menus: product.menus.map((item) => ({ menuId: item.menuId })),
    allergens: product.allergens.map((item) => ({ allergenId: item.allergenId })),
    dietaryTags: product.dietaryTags.map((item) => ({ dietaryId: item.dietaryId }))
  }));

  const groups: ProductCategoryGroup[] = categories
    .map((category) => ({
      id: category.id,
      name: category.translations.find((item) => item.locale === "tr")?.name ?? category.id,
      products: rows.filter((product) => product.categoryId === category.id)
    }))
    .filter((group) => group.products.length > 0 || group.id === categoryId);

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Ürünler</h1>
      <div className="mt-6 space-y-6">
        <Card className="p-4">
          <h2 className="text-xl font-semibold">Ürün oluştur</h2>
          <p className="mt-1 text-sm text-muted-foreground">Temel bilgiler yatay alanda, menü ve alerjen seçimleri formun sonunda yer alır.</p>
          <ProductForm
            action={createProductAction}
            categories={categories}
            menus={menus}
            allergens={allergens}
            dietaryTags={dietaryTags}
            media={media}
            mediaCategories={mediaCategories}
            variant="create"
          />
        </Card>

        <Card className="p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="text-xl font-semibold">Excel import / export</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Mevcut ürünleri aynı formatta dışarı aktarın veya düzenlediğiniz Excel dosyasını içeri alın.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-[auto_auto_1fr]">
              <form action="/api/admin/products/export" method="get">
                <Button type="submit" variant="outline" className="w-full">
                  <Download className="h-4 w-4" />
                  Excel export
                </Button>
              </form>
              <form action={syncProductLabelsFromContentAction}>
                <Button type="submit" variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4" />
                  Alerjen/etiket düzelt
                </Button>
              </form>
              <form action={importProductsExcelAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="block">
                  <span className="sr-only">Excel dosyası seç</span>
                  <Input name="file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required />
                </label>
                <Button type="submit">
                  <Upload className="h-4 w-4" />
                  Excel import
                </Button>
              </form>
            </div>
          </div>
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

        {groups.length > 0 ? (
          <ProductCategoryTable
            groups={groups}
            categories={categories}
            menus={menus}
            allergens={allergens}
            dietaryTags={dietaryTags}
            media={media}
            mediaCategories={mediaCategories}
          />
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">Bu arama ve kategori filtresine uygun ürün bulunamadı.</Card>
        )}
      </div>
    </AdminShell>
  );
}
