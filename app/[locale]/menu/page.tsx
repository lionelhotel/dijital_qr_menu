import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getMenuData, trackMenuView } from "@/lib/menu/queries";
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
  const data = await getMenuData(locale);
  await trackMenuView(locale, query.location, headerStore.get("user-agent"));

  const topCategories = data.categories.filter((category) => !category.parentId);

  return (
    <MenuHome
      locale={locale}
      business={{
        businessName: data.business?.businessName ?? "Lionel Hotel Istanbul",
        venueName: data.business?.venueName ?? "Restaurant & Bar",
        logoUrl: data.business?.logoUrl,
        coverImageUrl: data.business?.coverImageUrl
      }}
      categories={topCategories.map((category) => ({
        id: category.id,
        slug: category.translations.find((translation) => translation.locale === locale)?.slug ?? category.slug,
        label: category.label,
        description: category.description,
        imageUrl: category.imageUrl,
        productCount: countProducts(data.categories, category.id)
      }))}
    />
  );
}

function countProducts(categories: { id: string; parentId: string | null; products: unknown[] }[], rootId: string) {
  const ids = [rootId];
  let changed = true;

  while (changed) {
    changed = false;
    for (const category of categories) {
      if (category.parentId && ids.includes(category.parentId) && !ids.includes(category.id)) {
        ids.push(category.id);
        changed = true;
      }
    }
  }

  return categories
    .filter((category) => ids.includes(category.id))
    .reduce((total, category) => total + category.products.length, 0);
}
