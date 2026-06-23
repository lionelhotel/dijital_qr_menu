import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getMenuCategories, trackMenuView } from "@/lib/menu/queries";
import { MenuHome } from "@/components/menu/menu-home";

export const dynamic = "force-dynamic";

export default async function SelectedMenuPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ location?: string }>;
}) {
  const { locale, slug } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) notFound();

  const headerStore = await headers();
  const data = await getMenuCategories(locale, slug);
  if (!data) notFound();

  await trackMenuView(locale, query.location, headerStore.get("user-agent"));

  return (
    <MenuHome
      locale={locale}
      basePath={`/${locale}/menu/${slug}`}
      backHref={`/${locale}/menu`}
      backLabel="Başa dön"
      business={{
        businessName: data.menu.label ?? "Menu",
        venueName: data.business?.venueName ?? "Restaurant & Bar",
        logoUrl: data.business?.logoUrl,
        coverImageUrl: data.menu.imageUrl ?? data.business?.coverImageUrl,
        welcomeText: data.business?.welcomeText
      }}
      categories={data.categories.map((category) => ({
        id: category.id,
        slug: category.translations.find((translation) => translation.locale === locale)?.slug ?? category.slug,
        label: category.label,
        description: category.description,
        imageUrl: category.imageUrl,
        productCount: category.productCount
      }))}
    />
  );
}
