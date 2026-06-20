import { updateSettingsAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
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
            <Input name="businessName" defaultValue={business?.businessName} placeholder="İşletme adı" required />
            <Input name="venueName" defaultValue={business?.venueName} placeholder="Alt başlık" required />
            <Input name="website" defaultValue={business?.website ?? ""} placeholder="Web sitesi" />
            <Input name="phone" defaultValue={business?.phone ?? ""} placeholder="Telefon" />
            <Input name="email" defaultValue={business?.email ?? ""} placeholder="E-posta" />
            <Input name="defaultCurrency" defaultValue={business?.defaultCurrency ?? "TRY"} placeholder="Para birimi" />
            <Input name="logoUrl" defaultValue={business?.logoUrl ?? ""} placeholder="Logo URL" />
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Yerel logo yükle</span>
              <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="w-full text-sm" />
              <span className="mt-1 block text-xs text-muted-foreground">Önerilen: 512x512 px, en fazla 4 MB.</span>
            </label>
            <Input name="coverImageUrl" defaultValue={business?.coverImageUrl ?? ""} placeholder="Kapak görseli URL" />
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Yerel kapak görseli yükle</span>
              <input name="coverImage" type="file" accept="image/jpeg,image/png,image/webp" className="w-full text-sm" />
              <span className="mt-1 block text-xs text-muted-foreground">Önerilen: 1600x900 px veya daha büyük, en fazla 4 MB.</span>
            </label>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Tema</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-sm">Ana renk<Input name="primaryColor" type="color" defaultValue={theme?.primaryColor ?? "#2B2926"} /></label>
            <label className="text-sm">Vurgu<Input name="accentColor" type="color" defaultValue={theme?.accentColor ?? "#A8844F"} /></label>
            <label className="text-sm">Arka plan<Input name="backgroundColor" type="color" defaultValue={theme?.backgroundColor ?? "#F7F4EE"} /></label>
            <label className="text-sm">Kart<Input name="cardColor" type="color" defaultValue={theme?.cardColor ?? "#FFFFFF"} /></label>
            <label className="text-sm">Yazı<Input name="textColor" type="color" defaultValue={theme?.textColor ?? "#2B2926"} /></label>
            <label className="text-sm">Köşe<Input name="radius" type="number" min={0} max={24} defaultValue={theme?.radius ?? 8} /></label>
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
