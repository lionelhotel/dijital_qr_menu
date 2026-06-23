import { createAllergenAction, deleteAllergenAction, updateAllergenAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { KeyIconFields } from "@/components/admin/key-icon-fields";
import { LabeledField } from "@/components/forms/labeled-field";
import { TranslatedInputField } from "@/components/forms/translated-input-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function AllergensPage() {
  await requireAdmin();
  const allergens = await prisma.allergen.findMany({
    where: { deletedAt: null },
    include: { translations: true },
    orderBy: { key: "asc" }
  });

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Alerjenler</h1>
      <div className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="p-4">
          <h2 className="font-semibold">Alerjen ekle</h2>
          <AllergenForm action={createAllergenAction} />
        </Card>
        <div className="grid gap-4 lg:grid-cols-2">
          {allergens.map((item) => (
            <Card key={item.id} className="p-4">
              <AllergenForm action={updateAllergenAction} item={item} />
              <form action={deleteAllergenAction} className="mt-3">
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

function AllergenForm({
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
      <KeyIconFields sourceName="name_tr" defaultKey={item?.key} defaultIcon={item?.icon} type="allergen" />
      <LabeledField label="Alerjen Ürün">
        <Input name="name_tr" defaultValue={tr?.name} required />
      </LabeledField>
      <TranslatedInputField label="İngilizce ad" name="name_en" sourceName="name_tr" targetLocale="en" defaultValue={en?.name} required />
      <TranslatedInputField label="İspanyolca ad" name="name_es" sourceName="name_tr" targetLocale="es" defaultValue={es?.name} required />
      <LabeledField label="Türkçe açıklama">
        <Input name="description_tr" defaultValue={tr?.description ?? ""} />
      </LabeledField>
      <TranslatedInputField label="İngilizce açıklama" name="description_en" sourceName="description_tr" targetLocale="en" defaultValue={en?.description ?? ""} />
      <TranslatedInputField label="İspanyolca açıklama" name="description_es" sourceName="description_tr" targetLocale="es" defaultValue={es?.description ?? ""} />
      <label className="flex items-center gap-2 text-sm">
        <input name="isActive" type="checkbox" defaultChecked={item?.isActive ?? true} />
        Aktif
      </label>
      <Button type="submit">Kaydet</Button>
    </form>
  );
}
