import { Search } from "lucide-react";
import { createCategoryAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { CategoryForm } from "@/components/admin/category-form";
import { CategoryTable, type CategoryTableRow } from "@/components/admin/category-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function CategoriesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string; parentId?: string }>;
}) {
  await requireAdmin();
  const filters = await searchParams;
  const query = filters?.q?.trim() ?? "";
  const status = filters?.status ?? "";
  const parentId = filters?.parentId ?? "";

  const where = {
    deletedAt: null,
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "passive" ? { isActive: false } : {}),
    ...(parentId === "root" ? { parentId: null } : {}),
    ...(parentId && parentId !== "root" ? { parentId } : {}),
    ...(query
      ? {
          OR: [
            { slug: { contains: query, mode: "insensitive" as const } },
            { translations: { some: { name: { contains: query, mode: "insensitive" as const } } } },
            { translations: { some: { description: { contains: query, mode: "insensitive" as const } } } },
            { parent: { translations: { some: { name: { contains: query, mode: "insensitive" as const } } } } }
          ]
        }
      : {})
  };

  const [categories, allCategories, media, mediaCategories] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        translations: true,
        parent: { include: { translations: true } },
        _count: { select: { products: true, children: true } }
      }
    }),
    prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { translations: true }
    }),
    prisma.media.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { createdAt: "desc" },
      include: { category: true },
      take: 200
    }),
    prisma.mediaCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    })
  ]);

  const categoryOptions = allCategories.map((category) => ({
    id: category.id,
    parentId: category.parentId,
    slug: category.slug,
    imageUrl: category.imageUrl,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    translations: category.translations.map((translation) => ({
      locale: translation.locale,
      name: translation.name,
      description: translation.description
    }))
  }));

  const rows: CategoryTableRow[] = categories.map((category) => ({
    id: category.id,
    parentId: category.parentId,
    parentName: category.parent?.translations.find((item) => item.locale === "tr")?.name ?? null,
    slug: category.slug,
    imageUrl: category.imageUrl,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    productCount: category._count.products,
    childCount: category._count.children,
    translations: category.translations.map((translation) => ({
      locale: translation.locale,
      name: translation.name,
      description: translation.description
    }))
  }));

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Kategoriler</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ana menü kartlarını, alt kategori ilişkilerini ve menüdeki kategori sırasını yönetin.
      </p>

      <div className="mt-6 space-y-6">
        <Card className="p-4">
          <h2 className="text-xl font-semibold">Kategori oluştur</h2>
          <p className="mt-1 text-sm text-muted-foreground">Kategori adları, açıklamalar, üst kategori ve görsel bilgisi yatay alanda düzenlenir.</p>
          <CategoryForm
            action={createCategoryAction}
            categories={categoryOptions}
            media={media}
            mediaCategories={mediaCategories}
            variant="create"
          />
        </Card>

        <Card className="p-4">
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_260px_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={query} className="pl-10" placeholder="Kategori ara" />
            </label>
            <select
              name="status"
              defaultValue={status}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">Tüm durumlar</option>
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>
            <select
              name="parentId"
              defaultValue={parentId}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">Tüm üst kategoriler</option>
              <option value="root">Üst kategori yok</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.translations.find((item) => item.locale === "tr")?.name}
                </option>
              ))}
            </select>
            <Button type="submit">Ara</Button>
          </form>
        </Card>

        {rows.length > 0 ? (
          <CategoryTable categories={rows} categoryOptions={categoryOptions} media={media} mediaCategories={mediaCategories} />
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">Bu arama ve filtreye uygun kategori bulunamadı.</Card>
        )}
      </div>
    </AdminShell>
  );
}
