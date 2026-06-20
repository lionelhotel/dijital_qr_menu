"use server";

import { revalidatePath } from "next/cache";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit/audit";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { storeImage } from "@/lib/uploads/images";
import { slugify } from "@/lib/utils";
import { categorySchema, menuSchema, productSchema } from "@/lib/validation/menu";

const locales = ["tr", "en", "es"] as const;

const allergenKeywords: Record<string, string[]> = {
  gluten: ["gluten", "buğday", "bugday", "un", "ekmek", "kruton", "pasta", "makarna", "wheat", "flour", "bread"],
  milk: ["süt", "sut", "peynir", "tereyağı", "tereyagi", "krema", "yoğurt", "yogurt", "milk", "cheese", "butter", "cream"],
  egg: ["yumurta", "egg", "mayonez", "mayonnaise"],
  peanut: ["yer fıstığı", "yer fistigi", "peanut"],
  nuts: ["fındık", "findik", "badem", "ceviz", "antep fıstığı", "almond", "walnut", "hazelnut", "pistachio"],
  soy: ["soya", "soy"],
  fish: ["balık", "balik", "somon", "fish", "salmon"],
  shellfish: ["karides", "midye", "istiridye", "shellfish", "shrimp", "mussel"],
  sesame: ["susam", "sesame"],
  mustard: ["hardal", "mustard"],
  celery: ["kereviz", "celery"],
  sulfite: ["sülfit", "sulfit", "sulfite", "şarap", "sarap", "wine"]
};

export async function createMenuAction(formData: FormData) {
  const user = await requireAdmin();
  const parsed = menuSchema.parse(readMenuForm(formData));
  const imageUrl = (await uploadedImageUrl(formData, "image")) || parsed.imageUrl || undefined;

  const menu = await prisma.menu.create({
    data: {
      slug: parsed.slug,
      imageUrl,
      sortOrder: parsed.sortOrder,
      isActive: parsed.isActive,
      createdBy: user.id,
      translations: {
        create: locales.map((locale) => ({
          locale,
          name: parsed.name[locale],
          description: parsed.description[locale],
          slug: slugify(parsed.name[locale])
        }))
      }
    }
  });

  await logAndRevalidate(user.id, AuditAction.CREATE, "Menu", menu.id, parsed);
}

export async function updateMenuAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  const parsed = menuSchema.parse(readMenuForm(formData));
  const imageUrl = (await uploadedImageUrl(formData, "image")) || parsed.imageUrl || undefined;

  await prisma.menu.update({
    where: { id },
    data: {
      slug: parsed.slug,
      imageUrl,
      sortOrder: parsed.sortOrder,
      isActive: parsed.isActive,
      updatedBy: user.id,
      translations: {
        upsert: locales.map((locale) => ({
          where: { menuId_locale: { menuId: id, locale } },
          update: {
            name: parsed.name[locale],
            description: parsed.description[locale],
            slug: slugify(parsed.name[locale])
          },
          create: {
            locale,
            name: parsed.name[locale],
            description: parsed.description[locale],
            slug: slugify(parsed.name[locale])
          }
        }))
      }
    }
  });

  await logAndRevalidate(user.id, AuditAction.UPDATE, "Menu", id, parsed);
}

export async function deleteMenuAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  await prisma.menu.update({ where: { id }, data: { deletedAt: new Date(), isActive: false, updatedBy: user.id } });
  await logAndRevalidate(user.id, AuditAction.DELETE, "Menu", id);
}

export async function createCategoryAction(formData: FormData) {
  const user = await requireAdmin();
  const parsed = categorySchema.parse(readCategoryForm(formData));
  const imageUrl = (await uploadedImageUrl(formData, "image")) || parsed.imageUrl || undefined;

  const category = await prisma.category.create({
    data: {
      parentId: parsed.parentId || undefined,
      slug: parsed.slug,
      imageUrl,
      sortOrder: parsed.sortOrder,
      isActive: parsed.isActive,
      createdBy: user.id,
      translations: { create: categoryTranslations(parsed) }
    }
  });

  await logAndRevalidate(user.id, AuditAction.CREATE, "Category", category.id, parsed);
}

export async function updateCategoryAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  const parsed = categorySchema.parse(readCategoryForm(formData));
  const imageUrl = (await uploadedImageUrl(formData, "image")) || parsed.imageUrl || undefined;

  await prisma.category.update({
    where: { id },
    data: {
      parentId: parsed.parentId || null,
      slug: parsed.slug,
      imageUrl,
      sortOrder: parsed.sortOrder,
      isActive: parsed.isActive,
      updatedBy: user.id,
      translations: { upsert: categoryTranslationUpserts(id, parsed) }
    }
  });

  await logAndRevalidate(user.id, AuditAction.UPDATE, "Category", id, parsed);
}

export async function deleteCategoryAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  await prisma.category.update({ where: { id }, data: { deletedAt: new Date(), isActive: false, updatedBy: user.id } });
  await logAndRevalidate(user.id, AuditAction.DELETE, "Category", id);
}

export async function createProductAction(formData: FormData) {
  const user = await requireAdmin();
  const parsed = productSchema.parse(readProductForm(formData));
  const imageUrl = (await uploadedImageUrl(formData, "image")) || parsed.imageUrl || undefined;
  const menuIds = readMany(formData, "menuIds");
  const allergenIds = await resolveAllergenIds(formData, parsed);

  const product = await prisma.product.create({
    data: {
      categoryId: parsed.categoryId,
      price: parsed.price,
      currency: parsed.currency,
      spicyLevel: parsed.spicyLevel,
      mainImageUrl: imageUrl,
      isActive: parsed.isActive,
      isAvailable: parsed.isAvailable,
      isFeatured: parsed.isFeatured,
      isNew: parsed.isNew,
      createdBy: user.id,
      translations: { create: productTranslations(parsed) },
      allergens: { create: allergenIds.map((allergenId) => ({ allergenId })) },
      menus: { create: menuIds.map((menuId) => ({ menuId })) }
    }
  });

  await logAndRevalidate(user.id, AuditAction.CREATE, "Product", product.id, parsed);
}

export async function updateProductAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  const parsed = productSchema.parse(readProductForm(formData));
  const imageUrl = (await uploadedImageUrl(formData, "image")) || parsed.imageUrl || undefined;
  const menuIds = readMany(formData, "menuIds");
  const allergenIds = await resolveAllergenIds(formData, parsed);

  await prisma.$transaction([
    prisma.productAllergen.deleteMany({ where: { productId: id } }),
    prisma.productMenu.deleteMany({ where: { productId: id } }),
    prisma.product.update({
      where: { id },
      data: {
        categoryId: parsed.categoryId,
        price: parsed.price,
        currency: parsed.currency,
        spicyLevel: parsed.spicyLevel,
        mainImageUrl: imageUrl,
        isActive: parsed.isActive,
        isAvailable: parsed.isAvailable,
        isFeatured: parsed.isFeatured,
        isNew: parsed.isNew,
        updatedBy: user.id,
        translations: { upsert: productTranslationUpserts(id, parsed) },
        allergens: { create: allergenIds.map((allergenId) => ({ allergenId })) },
        menus: { create: menuIds.map((menuId) => ({ menuId })) }
      }
    })
  ]);

  await logAndRevalidate(user.id, AuditAction.UPDATE, "Product", id, parsed);
}

export async function deleteProductAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  await prisma.product.update({ where: { id }, data: { deletedAt: new Date(), isActive: false, updatedBy: user.id } });
  await logAndRevalidate(user.id, AuditAction.DELETE, "Product", id);
}

export async function createAllergenAction(formData: FormData) {
  const user = await requireAdmin();
  const key = slugify(String(formData.get("key") || formData.get("name_en") || formData.get("name_tr")));
  const allergen = await prisma.allergen.create({
    data: {
      key,
      icon: String(formData.get("icon") || "•"),
      isActive: formData.get("isActive") === "on",
      translations: { create: localizedTranslations(formData) }
    }
  });
  await logAndRevalidate(user.id, AuditAction.CREATE, "Allergen", allergen.id);
}

export async function updateAllergenAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  await prisma.allergen.update({
    where: { id },
    data: {
      key: slugify(String(formData.get("key") || formData.get("name_en") || formData.get("name_tr"))),
      icon: String(formData.get("icon") || "•"),
      isActive: formData.get("isActive") === "on",
      translations: { upsert: allergenTranslationUpserts(id, formData) }
    }
  });
  await logAndRevalidate(user.id, AuditAction.UPDATE, "Allergen", id);
}

export async function deleteAllergenAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  await prisma.allergen.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  await logAndRevalidate(user.id, AuditAction.DELETE, "Allergen", id);
}

export async function createDietaryTagAction(formData: FormData) {
  const user = await requireAdmin();
  const key = slugify(String(formData.get("key") || formData.get("name_en") || formData.get("name_tr")));
  const tag = await prisma.dietaryTag.create({
    data: {
      key,
      icon: String(formData.get("icon") || "•"),
      isActive: formData.get("isActive") === "on",
      translations: { create: localizedTranslations(formData) }
    }
  });
  await logAndRevalidate(user.id, AuditAction.CREATE, "DietaryTag", tag.id);
}

export async function updateDietaryTagAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  await prisma.dietaryTag.update({
    where: { id },
    data: {
      key: slugify(String(formData.get("key") || formData.get("name_en") || formData.get("name_tr"))),
      icon: String(formData.get("icon") || "•"),
      isActive: formData.get("isActive") === "on",
      translations: { upsert: dietaryTranslationUpserts(id, formData) }
    }
  });
  await logAndRevalidate(user.id, AuditAction.UPDATE, "DietaryTag", id);
}

export async function deleteDietaryTagAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  await prisma.dietaryTag.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  await logAndRevalidate(user.id, AuditAction.DELETE, "DietaryTag", id);
}

export async function updateSettingsAction(formData: FormData) {
  const user = await requireAdmin();
  const businessId = String(formData.get("businessId") || "default-business");
  const themeId = String(formData.get("themeId") || "default-theme");
  const logoUrl = (await uploadedImageUrl(formData, "logo")) || String(formData.get("logoUrl") || "") || undefined;
  const coverImageUrl =
    (await uploadedImageUrl(formData, "coverImage")) || String(formData.get("coverImageUrl") || "") || undefined;

  await prisma.$transaction([
    prisma.businessSetting.upsert({
      where: { id: businessId },
      update: {
        businessName: String(formData.get("businessName") || "Lionel Hotel Istanbul"),
        venueName: String(formData.get("venueName") || "Restaurant & Bar"),
        logoUrl,
        coverImageUrl,
        phone: String(formData.get("phone") || "") || null,
        email: String(formData.get("email") || "") || null,
        website: String(formData.get("website") || "") || null,
        defaultCurrency: String(formData.get("defaultCurrency") || "TRY"),
        updatedBy: user.id
      },
      create: {
        id: businessId,
        businessName: String(formData.get("businessName") || "Lionel Hotel Istanbul"),
        venueName: String(formData.get("venueName") || "Restaurant & Bar"),
        logoUrl,
        coverImageUrl,
        phone: String(formData.get("phone") || "") || null,
        email: String(formData.get("email") || "") || null,
        website: String(formData.get("website") || "") || null,
        defaultCurrency: String(formData.get("defaultCurrency") || "TRY"),
        createdBy: user.id
      }
    }),
    prisma.themeSetting.upsert({
      where: { id: themeId },
      update: {
        primaryColor: String(formData.get("primaryColor") || "#2B2926"),
        accentColor: String(formData.get("accentColor") || "#A8844F"),
        backgroundColor: String(formData.get("backgroundColor") || "#F7F4EE"),
        cardColor: String(formData.get("cardColor") || "#FFFFFF"),
        textColor: String(formData.get("textColor") || "#2B2926"),
        radius: Number(formData.get("radius") || 8),
        darkModeEnabled: formData.get("darkModeEnabled") === "on",
        updatedBy: user.id
      },
      create: {
        id: themeId,
        primaryColor: String(formData.get("primaryColor") || "#2B2926"),
        accentColor: String(formData.get("accentColor") || "#A8844F"),
        backgroundColor: String(formData.get("backgroundColor") || "#F7F4EE"),
        cardColor: String(formData.get("cardColor") || "#FFFFFF"),
        textColor: String(formData.get("textColor") || "#2B2926"),
        radius: Number(formData.get("radius") || 8),
        darkModeEnabled: formData.get("darkModeEnabled") === "on",
        createdBy: user.id
      }
    })
  ]);

  await logAndRevalidate(user.id, AuditAction.SETTINGS_CHANGE, "Settings", businessId);
}

export async function updateSortOrderAction(formData: FormData) {
  const user = await requireAdmin();
  const type = String(formData.get("type"));
  const ids = String(formData.get("ids") || "").split(",").filter(Boolean);

  await prisma.$transaction(
    ids.map((id, sortOrder) => {
      if (type === "category") return prisma.category.update({ where: { id }, data: { sortOrder, updatedBy: user.id } });
      if (type === "product") return prisma.product.update({ where: { id }, data: { sortOrder, updatedBy: user.id } });
      return prisma.menu.update({ where: { id }, data: { sortOrder, updatedBy: user.id } });
    })
  );

  await logAndRevalidate(user.id, AuditAction.UPDATE, `${type}:sort`);
}

function readMenuForm(formData: FormData) {
  const name = readLocalized(formData, "name");
  return {
    name,
    description: readLocalized(formData, "description"),
    slug: String(formData.get("slug") || slugify(name.en || name.tr)),
    imageUrl: String(formData.get("imageUrl") || ""),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isActive: formData.get("isActive") === "on"
  };
}

function readCategoryForm(formData: FormData) {
  const name = readLocalized(formData, "name");
  return {
    name,
    description: readLocalized(formData, "description"),
    parentId: String(formData.get("parentId") || "") || null,
    slug: String(formData.get("slug") || slugify(name.en || name.tr)),
    imageUrl: String(formData.get("imageUrl") || ""),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isActive: formData.get("isActive") === "on"
  };
}

function readProductForm(formData: FormData) {
  return {
    categoryId: String(formData.get("categoryId") ?? ""),
    name: readLocalized(formData, "name"),
    shortDescription: readLocalized(formData, "short"),
    ingredients: readLocalized(formData, "ingredients"),
    imageUrl: String(formData.get("imageUrl") || ""),
    price: formData.get("price"),
    currency: String(formData.get("currency") || "TRY"),
    spicyLevel: formData.get("spicyLevel") ?? 0,
    isActive: formData.get("isActive") === "on",
    isAvailable: formData.get("isAvailable") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isNew: formData.get("isNew") === "on"
  };
}

function readLocalized(formData: FormData, prefix: string) {
  return {
    tr: String(formData.get(`${prefix}_tr`) ?? ""),
    en: String(formData.get(`${prefix}_en`) ?? ""),
    es: String(formData.get(`${prefix}_es`) ?? "")
  };
}

function readMany(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

function requiredId(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("ID gerekli.");
  return id;
}

async function uploadedImageUrl(formData: FormData, key: string) {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size === 0) return null;
  return (await storeImage(file)).url;
}

function categoryTranslations(parsed: {
  name: Record<(typeof locales)[number], string>;
  description: Record<(typeof locales)[number], string>;
}) {
  return locales.map((locale) => ({
    locale,
    name: parsed.name[locale],
    description: parsed.description[locale],
    slug: slugify(parsed.name[locale])
  }));
}

function categoryTranslationUpserts(
  categoryId: string,
  parsed: { name: Record<(typeof locales)[number], string>; description: Record<(typeof locales)[number], string> }
) {
  return locales.map((locale) => ({
    where: { categoryId_locale: { categoryId, locale } },
    update: { name: parsed.name[locale], description: parsed.description[locale], slug: slugify(parsed.name[locale]) },
    create: { locale, name: parsed.name[locale], description: parsed.description[locale], slug: slugify(parsed.name[locale]) }
  }));
}

function productTranslations(parsed: {
  name: Record<(typeof locales)[number], string>;
  shortDescription: Record<(typeof locales)[number], string>;
  ingredients: Record<(typeof locales)[number], string>;
}) {
  return locales.map((locale) => ({
    locale,
    name: parsed.name[locale],
    shortDescription: parsed.shortDescription[locale],
    detailedDescription: parsed.shortDescription[locale],
    ingredients: parsed.ingredients[locale],
    slug: slugify(parsed.name[locale])
  }));
}

function productTranslationUpserts(
  productId: string,
  parsed: {
    name: Record<(typeof locales)[number], string>;
    shortDescription: Record<(typeof locales)[number], string>;
    ingredients: Record<(typeof locales)[number], string>;
  }
) {
  return locales.map((locale) => ({
    where: { productId_locale: { productId, locale } },
    update: {
      name: parsed.name[locale],
      shortDescription: parsed.shortDescription[locale],
      detailedDescription: parsed.shortDescription[locale],
      ingredients: parsed.ingredients[locale],
      slug: slugify(parsed.name[locale])
    },
    create: {
      locale,
      name: parsed.name[locale],
      shortDescription: parsed.shortDescription[locale],
      detailedDescription: parsed.shortDescription[locale],
      ingredients: parsed.ingredients[locale],
      slug: slugify(parsed.name[locale])
    }
  }));
}

function localizedTranslations(formData: FormData) {
  return locales.map((locale) => ({
    locale,
    name: String(formData.get(`name_${locale}`) || ""),
    description: String(formData.get(`description_${locale}`) || "")
  }));
}

function allergenTranslationUpserts(id: string, formData: FormData) {
  return locales.map((locale) => {
    const payload = {
      locale,
      name: String(formData.get(`name_${locale}`) || ""),
      description: String(formData.get(`description_${locale}`) || "")
    };
    return {
      where: { allergenId_locale: { allergenId: id, locale } },
      update: payload,
      create: payload
    };
  });
}

function dietaryTranslationUpserts(id: string, formData: FormData) {
  return locales.map((locale) => {
    const payload = {
      locale,
      name: String(formData.get(`name_${locale}`) || ""),
      description: String(formData.get(`description_${locale}`) || "")
    };
    return {
      where: { dietaryId_locale: { dietaryId: id, locale } },
      update: payload,
      create: payload
    };
  });
}

async function resolveAllergenIds(
  formData: FormData,
  parsed: {
    name: Record<(typeof locales)[number], string>;
    shortDescription: Record<(typeof locales)[number], string>;
    ingredients: Record<(typeof locales)[number], string>;
  }
) {
  const manualIds = readMany(formData, "allergenIds");
  const text = `${parsed.name.tr} ${parsed.name.en} ${parsed.name.es} ${parsed.shortDescription.tr} ${parsed.shortDescription.en} ${parsed.shortDescription.es} ${parsed.ingredients.tr} ${parsed.ingredients.en} ${parsed.ingredients.es}`.toLowerCase();
  const detectedKeys = Object.entries(allergenKeywords)
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword.toLowerCase())))
    .map(([key]) => key);
  const detected = await prisma.allergen.findMany({ where: { key: { in: detectedKeys }, deletedAt: null } });
  return [...new Set([...manualIds, ...detected.map((item) => item.id)])];
}

async function logAndRevalidate(
  userId: string,
  action: AuditAction,
  resourceType: string,
  resourceId?: string,
  newValue?: unknown
) {
  await audit({ userId, action, resourceType, resourceId, newValue });
  revalidatePath("/");
}
