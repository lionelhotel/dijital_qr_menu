import Image from "next/image";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { SortableList } from "@/components/admin/sortable-list";
import { LabeledField } from "@/components/forms/labeled-field";
import { TranslatedInputField } from "@/components/forms/translated-input-field";
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
          <CategoryForm action={createCategoryAction} categories={categories} />
        </Card>
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 font-semibold">Sürükle bırak sıralama</h2>
            <SortableList
              type="category"
              items={categories.map((category) => ({
                id: category.id,
                label: category.translations.find((item) => item.locale === "tr")?.name ?? category.slug
              }))}
            />
          </Card>
          {categories.map((category) => (
            <Card key={category.id} className="p-4">
              <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                  <Image src={category.imageUrl ?? "/placeholders/category.svg"} alt={category.slug} fill className="object-cover" />
                </div>
                <CategoryForm action={updateCategoryAction} category={category} categories={categories} />
                <form action={deleteCategoryAction} className="lg:col-start-2">
                  <input type="hidden" name="id" value={category.id} />
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

type CategoryForForm = {
  id: string;
  parentId: string | null;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  translations: { locale: string; name: string; description: string | null }[];
};

function CategoryForm({
  action,
  category,
  categories
}: {
  action: (formData: FormData) => Promise<void>;
  category?: CategoryForForm;
  categories: CategoryForForm[];
}) {
  const tr = category?.translations.find((item) => item.locale === "tr");
  const en = category?.translations.find((item) => item.locale === "en");
  const es = category?.translations.find((item) => item.locale === "es");

  return (
    <form action={action} className="mt-4 space-y-3">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <LabeledField label="Türkçe kategori adı"><Input name="name_tr" defaultValue={tr?.name} required /></LabeledField>
      <TranslatedInputField label="İngilizce kategori adı" name="name_en" sourceName="name_tr" targetLocale="en" defaultValue={en?.name} required />
      <TranslatedInputField label="İspanyolca kategori adı" name="name_es" sourceName="name_tr" targetLocale="es" defaultValue={es?.name} required />
      <LabeledField label="Türkçe açıklama"><Input name="description_tr" defaultValue={tr?.description ?? ""} /></LabeledField>
      <TranslatedInputField label="İngilizce açıklama" name="description_en" sourceName="description_tr" targetLocale="en" defaultValue={en?.description ?? ""} />
      <TranslatedInputField label="İspanyolca açıklama" name="description_es" sourceName="description_tr" targetLocale="es" defaultValue={es?.description ?? ""} />
      <LabeledField label="Üst kategori">
        <select name="parentId" defaultValue={category?.parentId ?? ""} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
          <option value="">Üst kategori yok</option>
          {categories
            .filter((item) => item.id !== category?.id)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.translations.find((translation) => translation.locale === "tr")?.name}
              </option>
            ))}
        </select>
      </LabeledField>
      <LabeledField label="URL slug"><Input name="slug" defaultValue={category?.slug} /></LabeledField>
      <LabeledField label="Mevcut görsel URL"><Input name="imageUrl" defaultValue={category?.imageUrl ?? ""} /></LabeledField>
      <LabeledField label="Yerel görsel yükle" hint="Önerilen: 1400x520 px veya daha büyük, en fazla 4 MB.">
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="w-full text-sm" />
      </LabeledField>
      <LabeledField label="Sıra"><Input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} /></LabeledField>
      <label className="flex items-center gap-2 text-sm">
        <input name="isActive" type="checkbox" defaultChecked={category?.isActive ?? true} />
        Aktif
      </label>
      <Button type="submit">Kaydet</Button>
    </form>
  );
}
