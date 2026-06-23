import { createDietaryTagAction, deleteDietaryTagAction, updateDietaryTagAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { KeyIconFields } from "@/components/admin/key-icon-fields";
import { LabeledField } from "@/components/forms/labeled-field";
import { TranslatedInputField } from "@/components/forms/translated-input-field";
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
      <div className="mt-6 space-y-6">
        <Card className="p-4">
          <h2 className="font-semibold">Diyet etiketi oluştur</h2>
          <TagForm action={createDietaryTagAction} variant="create" />
        </Card>

        <div className="space-y-3">
          {tags.map((item) => {
            const name = item.translations.find((translation) => translation.locale === "tr")?.name ?? item.key;

            return (
              <details key={item.id} className="group rounded-lg border border-border bg-card shadow-soft">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 marker:hidden">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xl">
                    {item.icon}
                  </span>
                  <h2 className="min-w-0 truncate font-semibold">{name}</h2>
                </summary>
                <div className="border-t border-border p-4">
                  <TagForm action={updateDietaryTagAction} item={item} />
                  <form action={deleteDietaryTagAction} className="mt-3">
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit" variant="outline">Sil</Button>
                  </form>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}

function TagForm({
  action,
  item,
  variant = "edit"
}: {
  action: (formData: FormData) => Promise<void>;
  item?: { id: string; key: string; icon: string; isActive: boolean; translations: { locale: string; name: string; description: string | null }[] };
  variant?: "create" | "edit";
}) {
  const tr = item?.translations.find((translation) => translation.locale === "tr");
  const en = item?.translations.find((translation) => translation.locale === "en");
  const es = item?.translations.find((translation) => translation.locale === "es");
  const isCreate = variant === "create";
  const formClassName = isCreate ? "mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4" : "space-y-3";
  const wideFieldClassName = isCreate ? "md:col-span-2" : undefined;
  const fullFieldClassName = isCreate ? "md:col-span-2 xl:col-span-4" : undefined;

  return (
    <form action={action} className={formClassName}>
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className={wideFieldClassName}>
        <KeyIconFields sourceName="name_tr" defaultKey={item?.key} defaultIcon={item?.icon} type="diet" />
      </div>
      <LabeledField label="Diyet Etiketi">
        <Input name="name_tr" defaultValue={tr?.name} required />
      </LabeledField>
      <TranslatedInputField label="İngilizce ad" name="name_en" sourceName="name_tr" targetLocale="en" defaultValue={en?.name} required />
      <TranslatedInputField label="İspanyolca ad" name="name_es" sourceName="name_tr" targetLocale="es" defaultValue={es?.name} required />
      <LabeledField label="Türkçe açıklama" className={wideFieldClassName}>
        <Input name="description_tr" defaultValue={tr?.description ?? ""} />
      </LabeledField>
      <TranslatedInputField label="İngilizce açıklama" name="description_en" sourceName="description_tr" targetLocale="en" defaultValue={en?.description ?? ""} fieldClassName={wideFieldClassName} />
      <TranslatedInputField label="İspanyolca açıklama" name="description_es" sourceName="description_tr" targetLocale="es" defaultValue={es?.description ?? ""} fieldClassName={wideFieldClassName} />
      <label className={`flex items-center gap-2 text-sm ${fullFieldClassName ?? ""}`}>
        <input name="isActive" type="checkbox" defaultChecked={item?.isActive ?? true} />
        Aktif
      </label>
      <Button type="submit" className={isCreate ? "w-fit" : undefined}>Kaydet</Button>
    </form>
  );
}
