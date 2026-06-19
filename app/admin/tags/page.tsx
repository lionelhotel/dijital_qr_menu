import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export default async function DietaryTagsPage() {
  await requireAdmin();
  const tags = await prisma.dietaryTag.findMany({ include: { translations: true }, orderBy: { key: "asc" } });
  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Diyet Etiketleri</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tags.map((item) => (
          <Card key={item.id} className="p-4">
            <p className="text-2xl">{item.icon}</p>
            <h2 className="mt-2 font-semibold">{item.translations.find((translation) => translation.locale === "tr")?.name}</h2>
            <p className="text-sm text-muted-foreground">{item.key}</p>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
