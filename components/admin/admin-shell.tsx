import { LogOut, Moon, Sun } from "lucide-react";
import { toggleDarkModeAction } from "@/lib/admin/actions";
import { logoutAction } from "@/lib/auth/actions";
import { getAdminPath } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const adminPath = getAdminPath();
  const theme = await prisma.themeSetting.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  const darkModeEnabled = theme?.darkModeEnabled ?? false;

  return (
    <div className="min-h-screen bg-muted">
      <AdminFlash />
      <form action={toggleDarkModeAction} className="fixed right-4 top-4 z-50">
        <input type="hidden" name="darkModeEnabled" value={darkModeEnabled ? "off" : "on"} />
        <Button
          type="submit"
          size="icon"
          variant="outline"
          className="h-10 w-10 rounded-full border-border bg-card shadow-lg"
          title={darkModeEnabled ? "Açık temaya geç" : "Koyu temaya geç"}
          aria-label={darkModeEnabled ? "Açık temaya geç" : "Koyu temaya geç"}
        >
          {darkModeEnabled ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </form>
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-card p-4 lg:block">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Lionel Hotel Istanbul</p>
          <h1 className="font-serif text-2xl">QR Menü Yönetimi</h1>
        </div>
        <AdminNav adminPath={adminPath} />
        <form action={logoutAction} className="absolute bottom-4 left-4 right-4">
          <Button type="submit" variant="outline" className="w-full">
            <LogOut className="h-4 w-4" />
            Çıkış
          </Button>
        </form>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-card px-4 py-3 lg:hidden">
          <p className="font-semibold">QR Menü Yönetimi</p>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
