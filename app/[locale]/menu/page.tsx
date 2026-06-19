import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getMenuData, trackMenuView } from "@/lib/menu/queries";
import { MenuExperience } from "@/components/menu/menu-experience";

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

  return (
    <MenuExperience
      locale={locale}
      business={{
        businessName: data.business?.businessName ?? "Lionel Hotel Istanbul",
        venueName: data.business?.venueName ?? "Restaurant & Bar",
        logoUrl: data.business?.logoUrl,
        coverImageUrl: data.business?.coverImageUrl
      }}
      categories={data.categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        label: category.label,
        description: category.description,
        products: category.products.map((product) => ({
          id: product.id,
          name: product.name ?? "",
          shortDescription: product.shortDescription,
          detailedDescription: product.detailedDescription,
          ingredients: product.ingredients,
          price: product.price.toString(),
          currency: product.currency,
          portion: product.portion,
          calories: product.calories,
          spicyLevel: product.spicyLevel,
          mainImageUrl: product.mainImageUrl,
          isAvailable: product.isAvailable,
          isFeatured: product.isFeatured,
          isNew: product.isNew,
          allergens: product.allergens,
          dietaryTags: product.dietaryTags
        }))
      }))}
    />
  );
}
