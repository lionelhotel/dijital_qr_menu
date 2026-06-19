import { NextRequest, NextResponse } from "next/server";
import { detectLocale, isLocale } from "@/lib/i18n/config";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/menu") {
    const locale = detectLocale(
      request.headers.get("accept-language"),
      request.cookies.get("menu_locale")?.value
    );
    return NextResponse.redirect(new URL(`/${locale}/menu`, request.url));
  }

  const first = pathname.split("/")[1];
  if (["tr", "en", "es"].includes(first) && !isLocale(first)) {
    return NextResponse.redirect(new URL("/en/menu", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/menu", "/tr/:path*", "/en/:path*", "/es/:path*"]
};
