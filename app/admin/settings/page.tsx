import { updateSettingsAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { LabeledField } from "@/components/forms/labeled-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function SettingsPage() {
  await requireAdmin();
  const [business, theme] = await Promise.all([
    prisma.businessSetting.findFirst(),
    prisma.themeSetting.findFirst()
  ]);

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">İşletme ve Tema Ayarları</h1>
      <form action={updateSettingsAction} className="mt-6 grid gap-6 lg:grid-cols-2">
        <input type="hidden" name="businessId" value={business?.id ?? "default-business"} />
        <input type="hidden" name="themeId" value={theme?.id ?? "default-theme"} />
        <Card className="p-4">
          <h2 className="font-semibold">İşletme</h2>
          <div className="mt-4 space-y-3">
            <LabeledField label="İşletme adı">
              <Input name="businessName" defaultValue={business?.businessName} required />
            </LabeledField>
            <LabeledField label="Alt başlık">
              <Input name="venueName" defaultValue={business?.venueName} required />
            </LabeledField>
            <LabeledField label="Web sitesi">
              <Input name="website" defaultValue={business?.website ?? ""} />
            </LabeledField>
            <LabeledField label="Telefon">
              <Input name="phone" defaultValue={business?.phone ?? ""} />
            </LabeledField>
            <LabeledField label="E-posta">
              <Input name="email" defaultValue={business?.email ?? ""} />
            </LabeledField>
            <LabeledField label="Para birimi">
              <Input name="defaultCurrency" defaultValue={business?.defaultCurrency ?? "TRY"} />
            </LabeledField>
            <LabeledField label="Logo URL">
              <Input name="logoUrl" defaultValue={business?.logoUrl ?? ""} />
            </LabeledField>
            <LabeledField label="Yerel logo yükle" hint="Önerilen: 512x512 px, en fazla 4 MB.">
              <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="w-full text-sm" />
            </LabeledField>
            <LabeledField label="Kapak görseli URL">
              <Input name="coverImageUrl" defaultValue={business?.coverImageUrl ?? ""} />
            </LabeledField>
            <LabeledField label="Yerel kapak görseli yükle" hint="Önerilen: 1600x900 px veya daha büyük, en fazla 4 MB.">
              <input name="coverImage" type="file" accept="image/jpeg,image/png,image/webp" className="w-full text-sm" />
            </LabeledField>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Tema</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <LabeledField label="Ana renk">
              <Input name="primaryColor" type="color" defaultValue={theme?.primaryColor ?? "#2B2926"} />
            </LabeledField>
            <LabeledField label="Vurgu rengi">
              <Input name="accentColor" type="color" defaultValue={theme?.accentColor ?? "#A8844F"} />
            </LabeledField>
            <LabeledField label="Arka plan rengi">
              <Input name="backgroundColor" type="color" defaultValue={theme?.backgroundColor ?? "#F7F4EE"} />
            </LabeledField>
            <LabeledField label="Kart rengi">
              <Input name="cardColor" type="color" defaultValue={theme?.cardColor ?? "#FFFFFF"} />
            </LabeledField>
            <LabeledField label="Yazı rengi">
              <Input name="textColor" type="color" defaultValue={theme?.textColor ?? "#2B2926"} />
            </LabeledField>
            <LabeledField label="Köşe yarıçapı">
              <Input name="radius" type="number" min={0} max={24} defaultValue={theme?.radius ?? 8} />
            </LabeledField>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input name="darkModeEnabled" type="checkbox" defaultChecked={theme?.darkModeEnabled ?? false} />
            Koyu mod aktif
          </label>
          <Button type="submit" className="mt-5">Ayarları kaydet</Button>
        </Card>
      </form>
    </AdminShell>
  );
}
