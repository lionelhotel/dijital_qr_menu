import Image from "next/image";
import {
  createMediaCategoryAction,
  deleteMediaCategoryAction,
  moveMediaAction,
  updateMediaCategoryAction,
  uploadMediaAction
} from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { syncStorageMedia } from "@/lib/uploads/sync-media";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { LabeledField } from "@/components/forms/labeled-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function MediaPage() {
  await requireAdmin();
  await syncStorageMedia();
  const [media, categories] = await Promise.all([
    prisma.media.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { category: true },
      take: 200
    }),
    prisma.mediaCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    })
  ]);

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Medya Kütüphanesi</h1>
      <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Card className="p-4">
            <h2 className="font-semibold">Toplu görsel yükle</h2>
            <div className="mt-4">
              <MediaUploadForm categories={categories} action={uploadMediaAction} />
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold">Medya kategorisi oluştur</h2>
            <MediaCategoryForm action={createMediaCategoryAction} />
          </Card>

          <div className="space-y-3">
            {categories.map((category) => (
              <Card key={category.id} className="p-4">
                <MediaCategoryForm action={updateMediaCategoryAction} category={category} />
                <form action={deleteMediaCategoryAction} className="mt-3">
                  <input type="hidden" name="id" value={category.id} />
                  <ConfirmSubmitButton
                    variant="outline"
                    message="Bu medya kategorisi silinecek. Bu kategoriye bağlı görseller arşivden kaldırılabilir. Devam etmek istiyor musunuz?"
                  >
                    Kategoriyi sil
                  </ConfirmSubmitButton>
                </form>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card className="p-4">
            <h2 className="font-semibold">Görselleri kategoriye taşı</h2>
            <form action={moveMediaAction} className="mt-3">
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <LabeledField label="Hedef kategori" className="min-w-60">
                  <select name="categoryId" className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
                    <option value="">Kategorisiz</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </LabeledField>
                <Button type="submit">Seçilenleri taşı</Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {media.map((item) => (
                  <label key={item.id} className="group overflow-hidden rounded-lg border border-border bg-card shadow-soft">
                    <div className="relative">
                      <Image
                        src={item.url}
                        alt={item.originalName}
                        width={420}
                        height={260}
                        className="aspect-video w-full object-cover transition group-hover:opacity-80"
                      />
                      <input name="mediaIds" value={item.id} type="checkbox" className="absolute left-3 top-3 h-5 w-5" />
                    </div>
                    <div className="p-3 text-sm">
                      <p className="truncate font-medium">{item.originalName}</p>
                      <p className="text-muted-foreground">
                        {item.category?.name ?? "Kategorisiz"} · {item.width ?? "-"}x{item.height ?? "-"} · {Math.round(item.size / 1024)} KB
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{item.url}</p>
                    </div>
                  </label>
                ))}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

function MediaCategoryForm({
  action,
  category
}: {
  action: (formData: FormData) => Promise<void>;
  category?: { id: string; name: string; slug: string; description: string | null; sortOrder: number };
}) {
  return (
    <form action={action} className="mt-4 space-y-3">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <LabeledField label="Kategori adı">
        <Input name="name" defaultValue={category?.name} required />
      </LabeledField>
      <LabeledField label="Slug">
        <Input name="slug" defaultValue={category?.slug} />
      </LabeledField>
      <LabeledField label="Açıklama">
        <Input name="description" defaultValue={category?.description ?? ""} />
      </LabeledField>
      <LabeledField label="Sıra">
        <Input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} />
      </LabeledField>
      <Button type="submit">Kaydet</Button>
    </form>
  );
}
