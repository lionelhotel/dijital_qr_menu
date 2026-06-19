import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export default async function AuditLogsPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: true } });

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">İşlem Kayıtları</h1>
      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr><th className="p-3">Tarih</th><th className="p-3">Kullanıcı</th><th className="p-3">İşlem</th><th className="p-3">Kaynak</th></tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-border">
                <td className="p-3">{log.createdAt.toLocaleString("tr-TR")}</td>
                <td className="p-3">{log.user?.name ?? "Sistem"}</td>
                <td className="p-3">{log.action}</td>
                <td className="p-3 text-muted-foreground">{log.resourceType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
