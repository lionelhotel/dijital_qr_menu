import Link from "next/link";
import { LogOut, LayoutDashboard, Utensils, Tags, ImageIcon, QrCode, Users, Settings, ScrollText } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { getAdminPath } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Kategoriler", icon: Tags },
  { href: "/admin/products", label: "Ürünler", icon: Utensils },
  { href: "/admin/allergens", label: "Alerjenler", icon: Tags },
  { href: "/admin/tags", label: "Diyet Etiketleri", icon: Tags },
  { href: "/admin/media", label: "Medya", icon: ImageIcon },
  { href: "/admin/qr-codes", label: "QR Kodlar", icon: QrCode },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users },
  { href: "/admin/settings", label: "Ayarlar", icon: Settings },
  { href: "/admin/audit-logs", label: "İşlem Kayıtları", icon: ScrollText }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const adminPath = getAdminPath();

  return (
    <div className="min-h-screen bg-muted">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-card p-4 lg:block">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Lionel Hotel Istanbul</p>
          <h1 className="font-serif text-2xl">QR Menü Yönetimi</h1>
        </div>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={`${adminPath}${href.replace(/^\/admin/, "")}`}
              className="flex h-10 items-center gap-3 rounded-md px-3 text-sm transition hover:bg-muted"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
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
