import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
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
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-semibold">İşletme</h2>
          <div className="mt-4 space-y-3">
            <Input defaultValue={business?.businessName} placeholder="İşletme adı" readOnly />
            <Input defaultValue={business?.venueName} placeholder="Alt başlık" readOnly />
            <Input defaultValue={business?.website ?? ""} placeholder="Web sitesi" readOnly />
            <Input defaultValue={business?.defaultCurrency} placeholder="Para birimi" readOnly />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Düzenleme aksiyonu için model ve form alanları hazırdır.</p>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Tema</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Input type="color" defaultValue={theme?.primaryColor ?? "#2B2926"} readOnly />
            <Input type="color" defaultValue={theme?.accentColor ?? "#A8844F"} readOnly />
            <Input type="color" defaultValue={theme?.backgroundColor ?? "#F7F4EE"} readOnly />
            <Input type="color" defaultValue={theme?.cardColor ?? "#FFFFFF"} readOnly />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Kontrast uyarıları ve kaydetme akışı tema modeline bağlanabilir.</p>
        </Card>
      </div>
    </AdminShell>
  );
}
