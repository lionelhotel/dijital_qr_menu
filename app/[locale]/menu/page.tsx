import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getPublicMenus, trackMenuView } from "@/lib/menu/queries";
import { MenuHome } from "@/components/menu/menu-home";

export const dynamic = "force-dynamic";

export default async function LocalizedMenuPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ location?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) notFound();

  const headerStore = await headers();
  const data = await getPublicMenus(locale);
  await trackMenuView(locale, query.location, headerStore.get("user-agent"));

  return (
    <MenuHome
      locale={locale}
      business={{
        businessName: data.business?.businessName ?? "Lionel Hotel Istanbul",
        venueName: data.business?.venueName ?? "Restaurant & Bar",
        logoUrl: data.business?.logoUrl,
        coverImageUrl: data.business?.coverImageUrl,
        welcomeText: data.business?.welcomeText
      }}
      categories={data.menus.map((menu) => ({
        id: menu.id,
        slug: menu.localizedSlug,
        label: menu.label,
        description: menu.description,
        imageUrl: menu.imageUrl,
        productCount: menu.products.length
      }))}
    />
  );
}
