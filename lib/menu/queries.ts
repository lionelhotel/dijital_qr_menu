import "server-only";

import type { Locale } from "@/lib/i18n/config";
import { prisma } from "@/lib/database/prisma";

export async function getMenuData(locale: Locale) {
  const [business, theme, categories] = await Promise.all([
    prisma.businessSetting.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
    prisma.themeSetting.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        translations: true,
        products: {
          where: { isActive: true, deletedAt: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            translations: true,
            allergens: {
              include: { allergen: { include: { translations: true } } }
            },
            dietaryTags: {
              include: { dietary: { include: { translations: true } } }
            }
          }
        }
      }
    })
  ]);

  return {
    business,
    theme,
    categories: categories.map((category) => ({
      ...category,
      label: pick(category.translations, locale, "name"),
      description: pick(category.translations, locale, "description"),
      products: category.products.map((product) => ({
        ...product,
        name: pick(product.translations, locale, "name"),
        shortDescription: pick(product.translations, locale, "shortDescription"),
        detailedDescription: pick(product.translations, locale, "detailedDescription"),
        ingredients: pick(product.translations, locale, "ingredients"),
        allergens: product.allergens.map(({ allergen }) => ({
          key: allergen.key,
          icon: allergen.icon,
          name: pick(allergen.translations, locale, "name")
        })),
        dietaryTags: product.dietaryTags.map(({ dietary }) => ({
          key: dietary.key,
          icon: dietary.icon,
          name: pick(dietary.translations, locale, "name")
        }))
      }))
    }))
  };
}

export async function getCategoryMenuData(locale: Locale, slug: string) {
  const data = await getMenuData(locale);
  const category =
    data.categories.find((item) => item.slug === slug) ??
    data.categories.find((item) => item.translations.some((translation) => translation.locale === locale && translation.slug === slug)) ??
    data.categories.find((item) => item.translations.some((translation) => translation.slug === slug));

  if (!category) return null;

  const categoryIds = collectCategoryIds(data.categories, category.id);
  const categories = data.categories.filter((item) => categoryIds.includes(item.id));

  return {
    business: data.business,
    theme: data.theme,
    category,
    categories
  };
}

export async function trackMenuView(locale: Locale, location?: string | null, userAgent?: string | null) {
  await prisma.menuView.create({
    data: { locale, location: location ?? undefined, userAgent: userAgent ?? undefined }
  });
}

export async function getDashboardStats() {
  const [
    totalCategories,
    totalProducts,
    activeProducts,
    inactiveProducts,
    missingImages,
    menuViews,
    latestProducts,
    latestAudits
  ] = await Promise.all([
    prisma.category.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { isActive: true, deletedAt: null } }),
    prisma.product.count({ where: { isActive: false, deletedAt: null } }),
    prisma.product.count({ where: { mainImageUrl: null, deletedAt: null } }),
    prisma.menuView.count(),
    prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { translations: true }
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: true }
    })
  ]);

  const missingTranslations = await prisma.product.count({
    where: {
      deletedAt: null,
      OR: [
        { translations: { none: { locale: "tr" } } },
        { translations: { none: { locale: "en" } } },
        { translations: { none: { locale: "es" } } }
      ]
    }
  });

  return {
    totalCategories,
    totalProducts,
    activeProducts,
    inactiveProducts,
    missingTranslations,
    missingImages,
    menuViews,
    latestProducts,
    latestAudits
  };
}

function pick<T extends { locale: string }>(
  translations: T[],
  locale: Locale,
  key: keyof Omit<T, "locale">
) {
  const selected =
    translations.find((item) => item.locale === locale) ??
    translations.find((item) => item.locale === "en") ??
    translations.find((item) => item.locale === "tr") ??
    translations[0];
  return selected?.[key] as string | null | undefined;
}

function collectCategoryIds(categories: { id: string; parentId: string | null }[], rootId: string) {
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

  return ids;
}
