import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { detectLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function MenuRedirectPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = detectLocale(
    headerStore.get("accept-language"),
    cookieStore.get("menu_locale")?.value
  );
  redirect(`/${locale}/menu`);
}
