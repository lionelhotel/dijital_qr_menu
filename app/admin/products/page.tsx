import { createProductAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatPrice } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function ProductsPage() {
  await requireAdmin();
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { deletedAt: null }, include: { translations: true } }),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: "desc" }],
      include: { translations: true, category: { include: { translations: true } } }
    })
  ]);

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Ürünler</h1>
      <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="p-4">
          <h2 className="font-semibold">Ürün oluştur</h2>
          <form action={createProductAction} className="mt-4 space-y-3">
            <select name="categoryId" className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" required>
              <option value="">Kategori seç</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.translations.find((item) => item.locale === "tr")?.name}
                </option>
              ))}
            </select>
            <Input name="name_tr" placeholder="Türkçe ürün adı" required />
            <Input name="name_en" placeholder="İngilizce ürün adı" required />
            <Input name="name_es" placeholder="İspanyolca ürün adı" required />
            <Input name="short_tr" placeholder="Türkçe kısa açıklama" required />
            <Input name="short_en" placeholder="İngilizce kısa açıklama" required />
            <Input name="short_es" placeholder="İspanyolca kısa açıklama" required />
            <Input name="price" type="number" step="0.01" placeholder="Fiyat" required />
            <Input name="currency" placeholder="Para birimi" defaultValue="TRY" />
            <Input name="spicyLevel" type="number" min={0} max={5} defaultValue={0} />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked /> Aktif</label>
              <label className="flex items-center gap-2"><input name="isAvailable" type="checkbox" defaultChecked /> Mevcut</label>
              <label className="flex items-center gap-2"><input name="isFeatured" type="checkbox" /> Öne çıkan</label>
              <label className="flex items-center gap-2"><input name="isNew" type="checkbox" /> Yeni</label>
            </div>
            <Button type="submit">Kaydet</Button>
          </form>
        </Card>
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-3">Ürün</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Fiyat</th>
                <th className="p-3">Durum</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="p-3">{product.translations.find((item) => item.locale === "tr")?.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {product.category.translations.find((item) => item.locale === "tr")?.name}
                  </td>
                  <td className="p-3">{formatPrice(product.price.toString(), product.currency)}</td>
                  <td className="p-3">{product.isAvailable ? "Mevcut" : "Tükendi"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminShell>
  );
}
