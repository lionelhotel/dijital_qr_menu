import type { Metadata, Viewport } from "next";
import { prisma } from "@/lib/database/prisma";
import { createThemeStyle, themeClassName } from "@/lib/theme/app-theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lionel Hotel Istanbul | Dijital Menü",
  description: "Çok dilli QR menü ve yönetim paneli.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F4EE"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = process.env.DATABASE_URL
    ? await prisma.themeSetting.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } }).catch(() => null)
    : null;

  return (
    <html lang="tr" className={themeClassName(theme)}>
      <body style={createThemeStyle(theme)}>{children}</body>
    </html>
  );
}
