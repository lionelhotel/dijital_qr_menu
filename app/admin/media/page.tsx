import {
  createMediaCategoryAction
} from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { syncStorageMedia } from "@/lib/uploads/sync-media";
import { AdminShell } from "@/components/admin/admin-shell";
import { MediaCategoryManager } from "@/components/admin/media-category-manager";
import { MediaLibraryManager } from "@/components/admin/media-library-manager";
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
      <div className="mt-6 space-y-6">
        <Card className="p-4">
          <h2 className="font-semibold">Görsel yükle</h2>
          <div className="mt-4 border-b border-border pb-4">
            <h3 className="text-sm font-semibold">Medya kategorisi oluştur</h3>
            <MediaCategoryForm action={createMediaCategoryAction} variant="create" />
            {categories.length > 0 ? <MediaCategoryManager categories={categories} /> : null}
          </div>
          <div className="pt-4">
            <MediaUploadForm categories={categories} />
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-4 font-semibold">Medya kütüphanesi</h2>
          <MediaLibraryManager
            categories={categories}
            media={media.map((item) => ({
              id: item.id,
              url: item.url,
              originalName: item.originalName,
              fileName: item.fileName,
              categoryId: item.categoryId,
              categoryName: item.category?.name ?? null,
              tags: item.tags,
              width: item.width,
              height: item.height,
              size: item.size,
              storagePath: `storage/uploads/${item.fileName}`
            }))}
          />
        </Card>
      </div>
    </AdminShell>
  );
}

function MediaCategoryForm({
  action,
  category,
  variant = "edit"
}: {
  action: (formData: FormData) => Promise<void>;
  category?: { id: string; name: string; slug: string; description: string | null; sortOrder: number };
  variant?: "create" | "edit";
}) {
  const isCreate = variant === "create";

  return (
    <form action={action} className={isCreate ? "mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_2fr_120px_auto]" : "mt-4 space-y-3"}>
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
      <Button type="submit" className={isCreate ? "self-end" : undefined}>Kaydet</Button>
    </form>
  );
}
