import { requireAdmin } from "@/lib/auth/session";
import { getDashboardStats } from "@/lib/menu/queries";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  await requireAdmin();
  const stats = await getDashboardStats();
  const cards = [
    ["Kategori", stats.totalCategories],
    ["Toplam ürün", stats.totalProducts],
    ["Aktif ürün", stats.activeProducts],
    ["Pasif ürün", stats.inactiveProducts],
    ["Eksik çeviri", stats.missingTranslations],
    ["Görselsiz ürün", stats.missingImages],
    ["Menü görüntülenme", stats.menuViews]
  ];

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-semibold">Son eklenen ürünler</h2>
          <div className="mt-3 space-y-2">
            {stats.latestProducts.map((product) => (
              <p key={product.id} className="text-sm text-muted-foreground">
                {product.translations.find((item) => item.locale === "tr")?.name ?? product.id}
              </p>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Son işlemler</h2>
          <div className="mt-3 space-y-2">
            {stats.latestAudits.map((log) => (
              <p key={log.id} className="text-sm text-muted-foreground">
                {log.action} · {log.resourceType} · {log.user?.name ?? "Sistem"}
              </p>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
