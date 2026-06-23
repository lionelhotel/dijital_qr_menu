import { createDietaryTagAction, deleteDietaryTagAction, updateDietaryTagAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { TranslateButton } from "@/components/admin/translate-button";
import { AdminShell } from "@/components/admin/admin-shell";
import { LabeledField } from "@/components/forms/labeled-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function DietaryTagsPage() {
  await requireAdmin();
  const tags = await prisma.dietaryTag.findMany({
    where: { deletedAt: null },
    include: { translations: true },
    orderBy: { key: "asc" }
  });

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Diyet Etiketleri</h1>
      <div className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="p-4">
          <h2 className="font-semibold">Etiket ekle</h2>
          <TagForm action={createDietaryTagAction} />
        </Card>
        <div className="grid gap-4 lg:grid-cols-2">
          {tags.map((item) => (
            <Card key={item.id} className="p-4">
              <TagForm action={updateDietaryTagAction} item={item} />
              <form action={deleteDietaryTagAction} className="mt-3">
                <input type="hidden" name="id" value={item.id} />
                <Button type="submit" variant="outline">Sil</Button>
              </form>
            </Card>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

function TagForm({
  action,
  item
}: {
  action: (formData: FormData) => Promise<void>;
  item?: { id: string; key: string; icon: string; isActive: boolean; translations: { locale: string; name: string; description: string | null }[] };
}) {
  const tr = item?.translations.find((translation) => translation.locale === "tr");
  const en = item?.translations.find((translation) => translation.locale === "en");
  const es = item?.translations.find((translation) => translation.locale === "es");

  return (
    <form action={action} className="space-y-3">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <TranslateButton />
      <LabeledField label="Sistem anahtarı">
        <Input name="key" defaultValue={item?.key} />
      </LabeledField>
      <LabeledField label="İkon">
        <Input name="icon" defaultValue={item?.icon ?? "•"} />
      </LabeledField>
      <LabeledField label="Türkçe ad">
        <Input name="name_tr" defaultValue={tr?.name} required />
      </LabeledField>
      <LabeledField label="İngilizce ad">
        <Input name="name_en" defaultValue={en?.name} required />
      </LabeledField>
      <LabeledField label="İspanyolca ad">
        <Input name="name_es" defaultValue={es?.name} required />
      </LabeledField>
      <LabeledField label="Türkçe açıklama">
        <Input name="description_tr" defaultValue={tr?.description ?? ""} />
      </LabeledField>
      <LabeledField label="İngilizce açıklama">
        <Input name="description_en" defaultValue={en?.description ?? ""} />
      </LabeledField>
      <LabeledField label="İspanyolca açıklama">
        <Input name="description_es" defaultValue={es?.description ?? ""} />
      </LabeledField>
      <label className="flex items-center gap-2 text-sm">
        <input name="isActive" type="checkbox" defaultChecked={item?.isActive ?? true} />
        Aktif
      </label>
      <Button type="submit">Kaydet</Button>
    </form>
  );
}
