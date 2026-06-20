"use client";

import { usePathname, useRouter } from "next/navigation";
import { ImageIcon, LayoutDashboard, MenuSquare, QrCode, ScrollText, Settings, Tags, Users, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/menus", label: "Menüler", icon: MenuSquare },
  { href: "/categories", label: "Kategoriler", icon: Tags },
  { href: "/products", label: "Ürünler", icon: Utensils },
  { href: "/allergens", label: "Alerjenler", icon: Tags },
  { href: "/tags", label: "Diyet Etiketleri", icon: Tags },
  { href: "/media", label: "Medya", icon: ImageIcon },
  { href: "/qr-codes", label: "QR Kodlar", icon: QrCode },
  { href: "/users", label: "Kullanıcılar", icon: Users },
  { href: "/settings", label: "Ayarlar", icon: Settings },
  { href: "/audit-logs", label: "İşlem Kayıtları", icon: ScrollText }
];

export function AdminNav({ adminPath }: { adminPath: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {nav.map(({ href, label, icon: Icon }) => {
        const target = `${adminPath}${href}`;
        const active = pathname === target;

        return (
          <button
            key={target}
            type="button"
            onClick={() => router.push(target)}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition hover:bg-muted",
              active && "bg-muted font-medium"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
