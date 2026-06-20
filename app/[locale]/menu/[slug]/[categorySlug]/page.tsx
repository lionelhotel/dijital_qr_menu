import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getCategoryMenuData, trackMenuView } from "@/lib/menu/queries";
import { MenuExperience } from "@/components/menu/menu-experience";

export const dynamic = "force-dynamic";

export default async function CategoryMenuPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; slug: string; categorySlug: string }>;
  searchParams: Promise<{ location?: string }>;
}) {
  const { locale, slug, categorySlug } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) notFound();

  const headerStore = await headers();
  const data = await getCategoryMenuData(locale, categorySlug, slug);
  if (!data) notFound();

  await trackMenuView(locale, query.location, headerStore.get("user-agent"));

  return (
    <MenuExperience
      locale={locale}
      business={{
        businessName: data.menu?.label ?? data.business?.businessName ?? "Lionel Hotel Istanbul",
        venueName: data.business?.venueName ?? "Restaurant & Bar",
        logoUrl: data.business?.logoUrl,
        coverImageUrl: data.business?.coverImageUrl
      }}
      menuTitle={data.category.label}
      menuDescription={data.category.description}
      menuImageUrl={data.category.imageUrl}
      backHref={`/${locale}/menu/${slug}`}
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
