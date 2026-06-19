import Image from "next/image";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export default async function MediaPage() {
  await requireAdmin();
  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 40 });

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Medya Kütüphanesi</h1>
      <Card className="mt-6 p-4">
        <form action="/api/upload" method="post" encType="multipart/form-data" className="flex flex-wrap gap-3">
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Yükle</button>
        </form>
      </Card>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {media.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <Image
              src={item.url}
              alt={item.originalName}
              width={360}
              height={200}
              className="aspect-video w-full object-cover"
            />
            <div className="p-3 text-sm">
              <p className="truncate font-medium">{item.originalName}</p>
              <p className="text-muted-foreground">{Math.round(item.size / 1024)} KB</p>
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
