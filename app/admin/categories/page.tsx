import { createCategoryAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }],
    include: { translations: true, parent: { include: { translations: true } } }
  });

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Kategoriler</h1>
      <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="p-4">
          <h2 className="font-semibold">Kategori oluştur</h2>
          <form action={createCategoryAction} className="mt-4 space-y-3">
            <Input name="name_tr" placeholder="Türkçe ad" required />
            <Input name="name_en" placeholder="İngilizce ad" required />
            <Input name="name_es" placeholder="İspanyolca ad" required />
            <Input name="description_tr" placeholder="Türkçe açıklama" />
            <Input name="description_en" placeholder="İngilizce açıklama" />
            <Input name="description_es" placeholder="İspanyolca açıklama" />
            <Input name="imageUrl" placeholder="Ana menü temsili görsel URL" />
            <select name="parentId" className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
              <option value="">Üst kategori yok</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.translations.find((item) => item.locale === "tr")?.name}
                </option>
              ))}
            </select>
            <Input name="slug" placeholder="URL slug (boş bırakılırsa üretilir)" />
            <Input name="sortOrder" type="number" placeholder="Sıra" defaultValue={0} />
            <label className="flex items-center gap-2 text-sm">
              <input name="isActive" type="checkbox" defaultChecked />
              Aktif
            </label>
            <Button type="submit">Kaydet</Button>
          </form>
        </Card>
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-3">Ad</th>
                <th className="p-3">Görsel</th>
                <th className="p-3">Üst kategori</th>
                <th className="p-3">Durum</th>
                <th className="p-3">Sıra</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t border-border">
                  <td className="p-3">{category.translations.find((item) => item.locale === "tr")?.name}</td>
                  <td className="p-3 text-muted-foreground">{category.imageUrl ? "Var" : "Yok"}</td>
                  <td className="p-3 text-muted-foreground">
                    {category.parent?.translations.find((item) => item.locale === "tr")?.name ?? "-"}
                  </td>
                  <td className="p-3">{category.isActive ? "Aktif" : "Pasif"}</td>
                  <td className="p-3">{category.sortOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminShell>
  );
}
