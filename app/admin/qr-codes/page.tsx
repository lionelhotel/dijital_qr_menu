import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { QrTool } from "./qr-tool";

export default async function QrCodesPage() {
  await requireAdmin();
  const codes = await prisma.qrCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">QR Kodlar</h1>
      <Card className="mt-6 p-4">
        <QrTool />
      </Card>
      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr><th className="p-3">Ad</th><th className="p-3">Hedef</th><th className="p-3">Tarama</th></tr>
          </thead>
          <tbody>
            {codes.map((code) => (
              <tr key={code.id} className="border-t border-border">
                <td className="p-3">{code.name}</td>
                <td className="p-3 text-muted-foreground">{code.targetUrl}</td>
                <td className="p-3">{code.scanCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
