import { createQrCodeAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { QrCodeList } from "./qr-code-list";
import { QrTool } from "./qr-tool";

export default async function QrCodesPage() {
  await requireAdmin();
  const codes = await prisma.qrCode.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">QR Kodlar</h1>
      <Card className="mt-6 p-4">
        <h2 className="mb-4 font-semibold">QR kod oluştur</h2>
        <QrTool action={createQrCodeAction} />
      </Card>
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Kayıtlı QR kodlar</h2>
        </div>
        <QrCodeList codes={codes} />
      </Card>
    </AdminShell>
  );
}
