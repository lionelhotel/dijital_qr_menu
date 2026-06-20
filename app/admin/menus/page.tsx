import Image from "next/image";
import { createMenuAction, deleteMenuAction, updateMenuAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { SortableList } from "@/components/admin/sortable-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function MenusPage() {
  await requireAdmin();
  const menus = await prisma.menu.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { translations: true, products: true }
  });

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Menüler</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ana sayfada ilk görünen Restaurant Menu, Room Service Menu, Lobby Bar Menu gibi seçenekleri yönetin.
      </p>
      <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="p-4">
          <h2 className="font-semibold">Menü oluştur</h2>
          <MenuForm action={createMenuAction} />
        </Card>
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 font-semibold">Sürükle bırak sıralama</h2>
            <SortableList
              type="menu"
              items={menus.map((menu) => ({
                id: menu.id,
                label: menu.translations.find((item) => item.locale === "tr")?.name ?? menu.slug
              }))}
            />
          </Card>
          {menus.map((menu) => (
            <Card key={menu.id} className="p-4">
              <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                  <Image src={menu.imageUrl ?? "/placeholders/category.svg"} alt={menu.slug} fill className="object-cover" />
                </div>
                <MenuForm action={updateMenuAction} menu={menu} />
                <form action={deleteMenuAction} className="lg:col-start-2">
                  <input type="hidden" name="id" value={menu.id} />
                  <Button type="submit" variant="outline">Sil</Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

function MenuForm({
  action,
  menu
}: {
  action: (formData: FormData) => Promise<void>;
  menu?: {
    id: string;
    slug: string;
    imageUrl: string | null;
    sortOrder: number;
    isActive: boolean;
    translations: { locale: string; name: string; description: string | null }[];
  };
}) {
  const tr = menu?.translations.find((item) => item.locale === "tr");
  const en = menu?.translations.find((item) => item.locale === "en");
  const es = menu?.translations.find((item) => item.locale === "es");

  return (
    <form action={action} className="mt-4 space-y-3">
      {menu ? <input type="hidden" name="id" value={menu.id} /> : null}
      <Input name="name_tr" placeholder="Türkçe menü adı" defaultValue={tr?.name} required />
      <Input name="name_en" placeholder="İngilizce menü adı" defaultValue={en?.name} required />
      <Input name="name_es" placeholder="İspanyolca menü adı" defaultValue={es?.name} required />
      <Input name="description_tr" placeholder="Türkçe açıklama" defaultValue={tr?.description ?? ""} />
      <Input name="description_en" placeholder="İngilizce açıklama" defaultValue={en?.description ?? ""} />
      <Input name="description_es" placeholder="İspanyolca açıklama" defaultValue={es?.description ?? ""} />
      <Input name="slug" placeholder="URL slug" defaultValue={menu?.slug} />
      <Input name="imageUrl" placeholder="Mevcut görsel URL" defaultValue={menu?.imageUrl ?? ""} />
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Yerel görsel yükle</span>
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="w-full text-sm" />
        <span className="mt-1 block text-xs text-muted-foreground">Önerilen: 1400x520 px veya daha büyük, en fazla 4 MB.</span>
      </label>
      <Input name="sortOrder" type="number" defaultValue={menu?.sortOrder ?? 0} />
      <label className="flex items-center gap-2 text-sm">
        <input name="isActive" type="checkbox" defaultChecked={menu?.isActive ?? true} />
        Aktif
      </label>
      <Button type="submit">Kaydet</Button>
    </form>
  );
}
