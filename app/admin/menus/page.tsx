import { Search } from "lucide-react";
import { createMenuAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { MenuForm } from "@/components/admin/menu-form";
import { MenuTable, type MenuTableRow } from "@/components/admin/menu-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function MenusPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const filters = await searchParams;
  const query = filters?.q?.trim() ?? "";
  const status = filters?.status ?? "";

  const where = {
    deletedAt: null,
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "passive" ? { isActive: false } : {}),
    ...(query
      ? {
          OR: [
            { slug: { contains: query, mode: "insensitive" as const } },
            { translations: { some: { name: { contains: query, mode: "insensitive" as const } } } },
            { translations: { some: { description: { contains: query, mode: "insensitive" as const } } } }
          ]
        }
      : {})
  };

  const [menus, media, mediaCategories] = await Promise.all([
    prisma.menu.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        translations: true,
        _count: { select: { products: true } }
      }
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

  const rows: MenuTableRow[] = menus.map((menu) => ({
    id: menu.id,
    slug: menu.slug,
    imageUrl: menu.imageUrl,
    sortOrder: menu.sortOrder,
    isActive: menu.isActive,
    productCount: menu._count.products,
    translations: menu.translations.map((translation) => ({
      locale: translation.locale,
      name: translation.name,
      description: translation.description,
      heroTitle: translation.heroTitle
    }))
  }));

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Menüler</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ana sayfada ilk görünen Restaurant Menu, Room Service Menu, Lobby Bar Menu gibi seçenekleri yönetin.
      </p>

      <div className="mt-6 space-y-6">
        <Card className="p-4">
          <h2 className="text-xl font-semibold">Menü oluştur</h2>
          <p className="mt-1 text-sm text-muted-foreground">Menü adları, açıklamalar ve ana görsel yatay alanda düzenlenir.</p>
          <MenuForm action={createMenuAction} media={media} mediaCategories={mediaCategories} variant="create" />
        </Card>

        <Card className="p-4">
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={query} className="pl-10" placeholder="Menü ara" />
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
            <Button type="submit">Ara</Button>
          </form>
        </Card>

        {rows.length > 0 ? (
          <MenuTable menus={rows} media={media} mediaCategories={mediaCategories} />
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">Bu arama ve filtreye uygun menü bulunamadı.</Card>
        )}
      </div>
    </AdminShell>
  );
}
