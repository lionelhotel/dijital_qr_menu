import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export default async function UsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } });
  return (
    <AdminShell>
      <h1 className="font-serif text-3xl">Kullanıcılar</h1>
      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr><th className="p-3">Ad soyad</th><th className="p-3">E-posta</th><th className="p-3">Rol</th><th className="p-3">Durum</th></tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="p-3">{user.name}</td>
                <td className="p-3 text-muted-foreground">{user.email}</td>
                <td className="p-3">{user.role}</td>
                <td className="p-3">{user.isActive ? "Aktif" : "Pasif"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
