"use server";

import { revalidatePath } from "next/cache";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit/audit";
import { errorMessage } from "@/lib/admin/error-message";
import { importProductsXlsx } from "@/lib/admin/product-excel";
import { contentManagedDietaryKeys, inferAllergenKeys, inferDietaryTagKeys, type ProductLabelInput } from "@/lib/admin/product-labels";
import { setAdminFlash } from "@/lib/admin/flash";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { isOpenAIError } from "@/lib/openai/errors";
import { estimateCaloriesPerPortion } from "@/lib/openai/nutrition";
import { storeImage } from "@/lib/uploads/images";
import { slugify } from "@/lib/utils";
import { categorySchema, menuSchema, productSchema } from "@/lib/validation/menu";

const locales = ["tr", "en", "es"] as const;


export async function createMenuAction(formData: FormData) {
  const user = await requireAdmin();
  const parsed = menuSchema.parse(readMenuForm(formData));
  const imageUrl = (await uploadedImageUrl(formData, "image", user.id, { width: 1400, height: 520 })) || parsed.imageUrl || undefined;
  const uniqueCheck = await ensureMenuUniqueSlugs(parsed);
  if (!uniqueCheck.ok) {
    await setAdminFlash("error", uniqueCheck.message);
    revalidatePath("/admin/menus");
    return { ok: false as const };
  }

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
          heroTitle: parsed.heroTitle[locale],
          slug: slugify(parsed.name[locale])
        }))
      }
    }
  });

  await logAndRevalidate(user.id, AuditAction.CREATE, "Menu", menu.id, parsed);
  return { ok: true as const };
}

export async function updateMenuAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  const parsed = menuSchema.parse(readMenuForm(formData));
  const imageUrl = (await uploadedImageUrl(formData, "image", user.id, { width: 1400, height: 520 })) || parsed.imageUrl || undefined;
  const uniqueCheck = await ensureMenuUniqueSlugs(parsed, id);
  if (!uniqueCheck.ok) {
    await setAdminFlash("error", uniqueCheck.message);
    revalidatePath("/admin/menus");
    return { ok: false as const };
  }

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
            heroTitle: parsed.heroTitle[locale],
            slug: slugify(parsed.name[locale])
          },
          create: {
            locale,
            name: parsed.name[locale],
            description: parsed.description[locale],
            heroTitle: parsed.heroTitle[locale],
            slug: slugify(parsed.name[locale])
          }
        }))
      }
    }
  });

  await logAndRevalidate(user.id, AuditAction.UPDATE, "Menu", id, parsed);
  return { ok: true as const };
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
  const imageUrl = (await uploadedImageUrl(formData, "image", user.id, { width: 1400, height: 520 })) || parsed.imageUrl || undefined;

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
  const imageUrl = (await uploadedImageUrl(formData, "image", user.id, { width: 1400, height: 520 })) || parsed.imageUrl || undefined;

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
  const imageUrl = (await uploadedImageUrl(formData, "image", user.id, { width: 1200, height: 900 })) || parsed.imageUrl || undefined;
  const menuIds = readMany(formData, "menuIds");
  const allergenIds = await resolveAllergenIds(formData, parsed);
  const dietaryTagIds = await resolveDietaryTagIds(formData, parsed, allergenIds);
  const isFeatured = await hasChefDietaryTag(dietaryTagIds);

  const product = await prisma.product.create({
    data: {
      categoryId: parsed.categoryId,
      price: parsed.price,
      calories: parsed.calories ?? undefined,
      currency: parsed.currency,
      prepMinutes: parsed.prepMinutes ?? undefined,
      spicyLevel: parsed.spicyLevel,
      mainImageUrl: imageUrl,
      isActive: parsed.isActive,
      isAvailable: parsed.isAvailable,
      isFeatured,
      isNew: parsed.isNew,
      createdBy: user.id,
      translations: { create: productTranslations(parsed) },
      allergens: { create: allergenIds.map((allergenId) => ({ allergenId })) },
      dietaryTags: { create: dietaryTagIds.map((dietaryId) => ({ dietaryId })) },
      menus: { create: menuIds.map((menuId) => ({ menuId })) }
    }
  });

  await logAndRevalidate(user.id, AuditAction.CREATE, "Product", product.id, parsed);
  if (!parsed.calories) await maybeCalculateAndStoreNutrition(product.id);
}

export async function updateProductAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  const parsed = productSchema.parse(readProductForm(formData));
  const imageUrl = (await uploadedImageUrl(formData, "image", user.id, { width: 1200, height: 900 })) || parsed.imageUrl || undefined;
  const menuIds = readMany(formData, "menuIds");
  const allergenIds = await resolveAllergenIds(formData, parsed);
  const dietaryTagIds = await resolveDietaryTagIds(formData, parsed, allergenIds);
  const isFeatured = await hasChefDietaryTag(dietaryTagIds);

  await prisma.$transaction([
    prisma.productAllergen.deleteMany({ where: { productId: id } }),
    prisma.productDietaryTag.deleteMany({ where: { productId: id } }),
    prisma.productMenu.deleteMany({ where: { productId: id } }),
    prisma.product.update({
      where: { id },
      data: {
        categoryId: parsed.categoryId,
        price: parsed.price,
        calories: parsed.calories ?? null,
        currency: parsed.currency,
        prepMinutes: parsed.prepMinutes ?? null,
        spicyLevel: parsed.spicyLevel,
        mainImageUrl: imageUrl,
        isActive: parsed.isActive,
        isAvailable: parsed.isAvailable,
        isFeatured,
        isNew: parsed.isNew,
        updatedBy: user.id,
        translations: { upsert: productTranslationUpserts(id, parsed) },
        allergens: { create: allergenIds.map((allergenId) => ({ allergenId })) },
        dietaryTags: { create: dietaryTagIds.map((dietaryId) => ({ dietaryId })) },
        menus: { create: menuIds.map((menuId) => ({ menuId })) }
      }
    })
  ]);

  await logAndRevalidate(user.id, AuditAction.UPDATE, "Product", id, parsed);
  if (!parsed.calories) await maybeCalculateAndStoreNutrition(id);
}

export async function syncProductLabelsFromContentAction() {
  const user = await requireAdmin();
  const [products, allergens, dietaryTags] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        translations: true,
        dietaryTags: { include: { dietary: true } }
      }
    }),
    prisma.allergen.findMany({ where: { deletedAt: null }, select: { id: true, key: true } }),
    prisma.dietaryTag.findMany({ where: { deletedAt: null }, select: { id: true, key: true } })
  ]);

  const allergenByKey = new Map(allergens.map((item) => [item.key, item.id]));
  const dietaryByKey = new Map(dietaryTags.map((item) => [item.key, item.id]));
  const contentManagedDietaryIds = dietaryTags
    .filter((item) => contentManagedDietaryKeys.has(item.key))
    .map((item) => item.id);

  for (const product of products) {
    const input = productLabelInputFromTranslations(product.translations, product.spicyLevel);
    const allergenIds = inferAllergenKeys(input)
      .map((key) => allergenByKey.get(key))
      .filter(Boolean) as string[];
    const allergenKeys = inferAllergenKeys(input);
    const dietaryIds = inferDietaryTagKeys(input, allergenKeys)
      .map((key) => dietaryByKey.get(key))
      .filter(Boolean) as string[];

    await prisma.$transaction([
      prisma.productAllergen.deleteMany({ where: { productId: product.id } }),
      ...(allergenIds.length
        ? [
            prisma.productAllergen.createMany({
              data: allergenIds.map((allergenId) => ({ productId: product.id, allergenId })),
              skipDuplicates: true
            })
          ]
        : []),
      prisma.productDietaryTag.deleteMany({
        where: {
          productId: product.id,
          dietaryId: { in: contentManagedDietaryIds }
        }
      }),
      ...(dietaryIds.length
        ? [
            prisma.productDietaryTag.createMany({
              data: dietaryIds.map((dietaryId) => ({ productId: product.id, dietaryId })),
              skipDuplicates: true
            })
          ]
        : [])
    ]);
  }

  await logAndRevalidate(user.id, AuditAction.UPDATE, "Product:labels", undefined, { productCount: products.length });
}

export async function calculateProductNutritionAction(formData: FormData) {
  const user = await requireAdmin();
  try {
    const id = requiredId(formData);
    const result = await maybeCalculateAndStoreNutrition(id);
    await audit({ userId: user.id, action: AuditAction.UPDATE, resourceType: "ProductNutrition", resourceId: id, newValue: result });
    if (result.ok) {
      await setAdminFlash("success", `Kalori başarıyla hesaplandı: ${result.calories} kcal.`);
      revalidatePath("/");
      return { ok: true as const, calories: result.calories, note: result.note };
    } else {
      await setAdminFlash("error", `Kalori hesaplanamadı: ${result.reason}`);
      revalidatePath("/");
      return { ok: false as const, reason: result.reason };
    }
  } catch (error) {
    console.error("Nutrition calculation failed", error);
    const reason = errorMessage(error);
    await setAdminFlash("error", `Kalori hesaplanamadı: ${reason}`);
    revalidatePath("/");
    return { ok: false as const, reason };
  }
}

export async function updateProductPriceAction(formData: FormData) {
  const user = await requireAdmin();
  try {
    const id = requiredId(formData);
    const price = Number(formData.get("price"));
    if (!Number.isFinite(price) || price <= 0) throw new Error("Geçerli bir fiyat girin.");

    await prisma.product.update({
      where: { id },
      data: { price, updatedBy: user.id }
    });
    await audit({
      userId: user.id,
      action: AuditAction.UPDATE,
      resourceType: "ProductPrice",
      resourceId: id,
      newValue: { price }
    });
    await setAdminFlash("success", "Ürün fiyatı başarıyla güncellendi.");
    revalidatePath("/");
    return { ok: true as const, price: price.toString() };
  } catch (error) {
    console.error("Product price update failed", error);
    const reason = errorMessage(error);
    await setAdminFlash("error", `Fiyat güncellenemedi: ${reason}`);
    revalidatePath("/");
    return { ok: false as const, reason };
  }
}

export async function deleteProductAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  await prisma.product.update({ where: { id }, data: { deletedAt: new Date(), isActive: false, updatedBy: user.id } });
  await logAndRevalidate(user.id, AuditAction.DELETE, "Product", id);
}

export async function importProductsExcelAction(formData: FormData) {
  const user = await requireAdmin();
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("Excel dosyası seçin.");
    const result = await importProductsXlsx(file, user.id);
    await audit({
      userId: user.id,
      action: AuditAction.CREATE,
      resourceType: "Product:excel-import",
      newValue: result
    });
    const errorText = result.errors.length ? ` Atlanan satırlar: ${result.errors.slice(0, 3).join(" | ")}` : "";
    await setAdminFlash(
      result.skipped ? "info" : "success",
      `Excel import tamamlandı. Yeni: ${result.created}, Güncellenen: ${result.updated}, Atlanan: ${result.skipped}.${errorText}`
    );
    revalidatePath("/");
  } catch (error) {
    console.error("Product Excel import failed", error);
    await setAdminFlash("error", `Excel import başarısız: ${errorMessage(error)}`);
    revalidatePath("/");
  }
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
  await saveSettings(formData);
}

export async function toggleDarkModeAction(formData: FormData) {
  const user = await requireAdmin();
  const enabled = formData.get("darkModeEnabled") === "on";
  const existing = await prisma.themeSetting.findFirst({ orderBy: { createdAt: "asc" } });

  const theme = await prisma.themeSetting.upsert({
    where: { id: existing?.id ?? "default-theme" },
    update: {
      darkModeEnabled: enabled,
      updatedBy: user.id
    },
    create: {
      id: "default-theme",
      primaryColor: "#2B2926",
      accentColor: "#A8844F",
      backgroundColor: "#F7F4EE",
      cardColor: "#FFFFFF",
      textColor: "#2B2926",
      radius: 8,
      darkModeEnabled: enabled,
      createdBy: user.id
    }
  });

  await logAndRevalidate(user.id, AuditAction.SETTINGS_CHANGE, "ThemeSetting", theme.id, { darkModeEnabled: enabled });
  revalidatePath("/", "layout");
}

export async function saveSettings(formData: FormData) {
  const user = await requireAdmin();
  const businessId = String(formData.get("businessId") || "default-business");
  const themeId = String(formData.get("themeId") || "default-theme");
  const logoUrl = (await uploadedImageUrl(formData, "logo", user.id, { width: 512, height: 512 })) || String(formData.get("logoUrl") || "") || undefined;
  const coverImageUrl =
    (await uploadedImageUrl(formData, "coverImage", user.id, { width: 1600, height: 900 })) || String(formData.get("coverImageUrl") || "") || undefined;
  const welcomeText = readOptionalLocalized(formData, "welcome");
  const welcomeSubText = readOptionalLocalized(formData, "welcomeSub");
  const serviceText = readOptionalLocalized(formData, "introButton");
  const introMediaUrl = String(formData.get("introMediaUrl") || "") || undefined;
  const introMediaKind = String(formData.get("introMediaKind") || "IMAGE");
  const introZoomEnabled = formData.get("introZoomEnabled") === "on";

  await prisma.$transaction([
    prisma.businessSetting.upsert({
      where: { id: businessId },
      update: {
        businessName: String(formData.get("businessName") || "Lionel Hotel Istanbul"),
        venueName: String(formData.get("venueName") || "Restaurant & Bar"),
        logoUrl,
        coverImageUrl,
        introMediaUrl,
        introMediaKind,
        introZoomEnabled,
        phone: String(formData.get("phone") || "") || null,
        email: String(formData.get("email") || "") || null,
        website: String(formData.get("website") || "") || null,
        defaultCurrency: String(formData.get("defaultCurrency") || "TRY"),
        welcomeText,
        welcomeSubText,
        serviceText,
        updatedBy: user.id
      },
      create: {
        id: businessId,
        businessName: String(formData.get("businessName") || "Lionel Hotel Istanbul"),
        venueName: String(formData.get("venueName") || "Restaurant & Bar"),
        logoUrl,
        coverImageUrl,
        introMediaUrl,
        introMediaKind,
        introZoomEnabled,
        phone: String(formData.get("phone") || "") || null,
        email: String(formData.get("email") || "") || null,
        website: String(formData.get("website") || "") || null,
        defaultCurrency: String(formData.get("defaultCurrency") || "TRY"),
        welcomeText,
        welcomeSubText,
        serviceText,
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

export async function createMediaCategoryAction(formData: FormData) {
  const user = await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Kategori adı gerekli.");
  const category = await prisma.mediaCategory.create({
    data: {
      name,
      slug: slugify(String(formData.get("slug") || name)),
      description: String(formData.get("description") || "") || null,
      sortOrder: Number(formData.get("sortOrder") || 0)
    }
  });
  await logAndRevalidate(user.id, AuditAction.CREATE, "MediaCategory", category.id);
}

export async function updateMediaCategoryAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Kategori adı gerekli.");
  await prisma.mediaCategory.update({
    where: { id },
    data: {
      name,
      slug: slugify(String(formData.get("slug") || name)),
      description: String(formData.get("description") || "") || null,
      sortOrder: Number(formData.get("sortOrder") || 0)
    }
  });
  await logAndRevalidate(user.id, AuditAction.UPDATE, "MediaCategory", id);
}

export async function deleteMediaCategoryAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  await prisma.$transaction([
    prisma.media.updateMany({ where: { categoryId: id }, data: { deletedAt: new Date(), isActive: false, updatedBy: user.id } }),
    prisma.mediaCategory.update({ where: { id }, data: { deletedAt: new Date() } })
  ]);
  await logAndRevalidate(user.id, AuditAction.DELETE, "MediaCategory", id);
}

export async function uploadMediaAction(formData: FormData) {
  const user = await requireAdmin();
  try {
    const files = formData.getAll("files").filter((file): file is File => file instanceof File && file.size > 0);
    if (!files.length) throw new Error("Yüklenecek görsel bulunamadı.");

    const categoryId = String(formData.get("categoryId") || "") || null;
    const width = Number(formData.get("width") || 1600);
    const heightValue = String(formData.get("height") || "");
    const height = heightValue ? Number(heightValue) : undefined;

    const created = [];
    for (const file of files) {
      const stored = await storeImage(file, {
        width: Number.isFinite(width) ? width : 1600,
        height: height && Number.isFinite(height) ? height : undefined
      });
      const media = await prisma.media.create({
        data: {
          kind: "IMAGE",
          categoryId,
          originalName: file.name,
          fileName: stored.fileName,
          mimeType: stored.mimeType,
          size: stored.size,
          width: stored.width,
          height: stored.height,
          url: stored.url,
          createdBy: user.id
        }
      });
      created.push(media.id);
    }

    await audit({
      userId: user.id,
      action: AuditAction.CREATE,
      resourceType: "Media",
      newValue: { count: created.length, mediaIds: created }
    });
    await setAdminFlash("success", `${created.length} görsel başarıyla yüklendi.`);
  } catch (error) {
    console.error("Media upload failed", error);
    await setAdminFlash("error", `Görsel yüklenemedi: ${errorMessage(error)}`);
  }
  revalidatePath("/");
}

export async function moveMediaAction(formData: FormData) {
  const user = await requireAdmin();
  const ids = readMany(formData, "mediaIds");
  const categoryId = String(formData.get("categoryId") || "") || null;
  if (!ids.length) throw new Error("Taşınacak görsel seçin.");
  await prisma.media.updateMany({ where: { id: { in: ids } }, data: { categoryId, updatedBy: user.id } });
  await logAndRevalidate(user.id, AuditAction.UPDATE, "Media:move", ids.join(","));
}

export async function updateMediaTagsAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  const tags = String(formData.get("tags") || "").trim() || null;
  await prisma.media.update({ where: { id }, data: { tags, updatedBy: user.id } });
  await audit({
    userId: user.id,
    action: AuditAction.UPDATE,
    resourceType: "Media:tags",
    resourceId: id,
    newValue: { tags }
  });
}

export async function bulkMediaAction(formData: FormData) {
  const user = await requireAdmin();
  const ids = readMany(formData, "mediaIds");
  const operation = String(formData.get("operation") || "");
  const categoryId = String(formData.get("categoryId") || "") || null;
  if (!ids.length) throw new Error("İşlem yapılacak görsel seçin.");

  if (operation === "delete") {
    await prisma.media.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date(), isActive: false, updatedBy: user.id }
    });
    await logAndRevalidate(user.id, AuditAction.DELETE, "Media:bulk-delete", ids.join(","));
    return;
  }

  if (operation === "move") {
    await prisma.media.updateMany({
      where: { id: { in: ids } },
      data: { categoryId, updatedBy: user.id }
    });
    await logAndRevalidate(user.id, AuditAction.UPDATE, "Media:bulk-move", ids.join(","));
    return;
  }

  if (operation === "copy") {
    const items = await prisma.media.findMany({ where: { id: { in: ids }, deletedAt: null } });
    const copied = await prisma.$transaction(
      items.map((item) =>
        prisma.media.create({
          data: {
            kind: item.kind,
            categoryId,
            originalName: item.originalName,
            fileName: item.fileName,
            mimeType: item.mimeType,
            size: item.size,
            width: item.width,
            height: item.height,
            url: item.url,
            tags: item.tags,
            alt: item.alt ?? undefined,
            createdBy: user.id
          }
        })
      )
    );
    await audit({
      userId: user.id,
      action: AuditAction.CREATE,
      resourceType: "Media:bulk-copy",
      newValue: { sourceIds: ids, copiedIds: copied.map((item) => item.id) }
    });
    await setAdminFlash("success", "Seçilen görseller başarıyla kopyalandı.");
    revalidatePath("/");
    return;
  }

  throw new Error("Geçersiz medya işlemi.");
}

export async function createQrCodeAction(formData: FormData) {
  const user = await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const targetUrl = String(formData.get("targetUrl") || "").trim();
  const location = String(formData.get("location") || "").trim() || null;

  if (!name) throw new Error("QR kod adı gerekli.");
  if (!targetUrl) throw new Error("Hedef URL gerekli.");

  const qrCode = await prisma.qrCode.create({
    data: {
      name,
      targetUrl,
      location,
      createdBy: user.id
    }
  });

  await logAndRevalidate(user.id, AuditAction.CREATE, "QrCode", qrCode.id);
}

export async function deleteQrCodeAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredId(formData);
  await prisma.qrCode.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedBy: user.id
    }
  });
  await logAndRevalidate(user.id, AuditAction.DELETE, "QrCode", id);
}

function readMenuForm(formData: FormData) {
  const name = readLocalized(formData, "name");
  return {
    name,
    description: readLocalized(formData, "description"),
    heroTitle: readOptionalLocalized(formData, "heroTitle"),
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
    calories: String(formData.get("calories") || "") || null,
    currency: String(formData.get("currency") || "TRY"),
    prepMinutes: String(formData.get("prepMinutes") || "") || null,
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

function readOptionalLocalized(formData: FormData, prefix: string) {
  return {
    tr: String(formData.get(`${prefix}_tr`) || ""),
    en: String(formData.get(`${prefix}_en`) || ""),
    es: String(formData.get(`${prefix}_es`) || "")
  };
}

function readMany(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

async function ensureMenuUniqueSlugs(parsed: { slug: string; name: Record<(typeof locales)[number], string> }, currentId?: string) {
  const existing = await prisma.menu.findUnique({
    where: { slug: parsed.slug },
    select: { id: true, deletedAt: true }
  });

  if (existing && existing.id !== currentId) {
    if (!existing.deletedAt) {
      return { ok: false as const, message: "Bu URL slug aktif başka bir menüde kullanılıyor. Lütfen farklı bir slug girin." };
    }
    await prisma.menu.update({
      where: { id: existing.id },
      data: { slug: archivedSlug(parsed.slug) }
    });
  }

  for (const locale of locales) {
    const translationSlug = slugify(parsed.name[locale]);
    const translation = await prisma.menuTranslation.findFirst({
      where: {
        locale,
        slug: translationSlug,
        ...(currentId ? { menuId: { not: currentId } } : {})
      },
      select: {
        id: true,
        menu: { select: { deletedAt: true } }
      }
    });

    if (!translation) continue;
    if (!translation.menu.deletedAt) {
      return {
        ok: false as const,
        message: "Bu menü adı aktif başka bir menüde kullanılıyor. Lütfen menü adını veya dil alanını değiştirin."
      };
    }
    await prisma.menuTranslation.update({
      where: { id: translation.id },
      data: { slug: archivedSlug(translationSlug) }
    });
  }

  return { ok: true as const };
}

function archivedSlug(slug: string) {
  return `${slug}-arsiv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function hasChefDietaryTag(dietaryTagIds: string[]) {
  if (!dietaryTagIds.length) return false;
  const chefTag = await prisma.dietaryTag.findFirst({
    where: {
      id: { in: dietaryTagIds },
      key: "chef",
      deletedAt: null
    },
    select: { id: true }
  });
  return Boolean(chefTag);
}

function requiredId(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("ID gerekli.");
  return id;
}

async function uploadedImageUrl(
  formData: FormData,
  key: string,
  userId?: string,
  options: { width?: number; height?: number; categoryId?: string | null } = {}
) {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size === 0) return null;
  const stored = await storeImage(file, options);
  await prisma.media.create({
    data: {
      kind: "IMAGE",
      categoryId: options.categoryId || null,
      originalName: file.name,
      fileName: stored.fileName,
      mimeType: stored.mimeType,
      size: stored.size,
      width: stored.width,
      height: stored.height,
      url: stored.url,
      createdBy: userId
    }
  });
  return stored.url;
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
    spicyLevel?: number | null;
  }
) {
  const manualIds = readMany(formData, "allergenIds");
  const detectedKeys = inferAllergenKeys(toProductLabelInput(parsed));
  const detected = await prisma.allergen.findMany({ where: { key: { in: detectedKeys }, deletedAt: null } });
  return [...new Set([...manualIds, ...detected.map((item) => item.id)])];
}

async function resolveDietaryTagIds(
  formData: FormData,
  parsed: {
    name: Record<(typeof locales)[number], string>;
    shortDescription: Record<(typeof locales)[number], string>;
    ingredients: Record<(typeof locales)[number], string>;
    spicyLevel?: number | null;
  },
  allergenIds: string[]
) {
  const manualIds = readMany(formData, "dietaryTagIds");
  const allergens = await prisma.allergen.findMany({ where: { id: { in: allergenIds }, deletedAt: null }, select: { key: true } });
  const detectedKeys = inferDietaryTagKeys(toProductLabelInput(parsed), allergens.map((item) => item.key));
  const detected = await prisma.dietaryTag.findMany({ where: { key: { in: detectedKeys }, deletedAt: null } });
  return [...new Set([...manualIds, ...detected.map((item) => item.id)])];
}

function toProductLabelInput(parsed: {
  name: Record<(typeof locales)[number], string>;
  shortDescription: Record<(typeof locales)[number], string>;
  ingredients: Record<(typeof locales)[number], string>;
  spicyLevel?: number | null;
}): ProductLabelInput {
  return {
    name: parsed.name,
    shortDescription: parsed.shortDescription,
    ingredients: parsed.ingredients,
    spicyLevel: parsed.spicyLevel ?? 0
  };
}

function productLabelInputFromTranslations(
  translations: {
    locale: string;
    name: string;
    shortDescription: string | null;
    ingredients: string | null;
  }[],
  spicyLevel?: number | null
): ProductLabelInput {
  const byLocale = new Map(translations.map((item) => [item.locale, item]));
  return {
    name: {
      tr: byLocale.get("tr")?.name ?? "",
      en: byLocale.get("en")?.name ?? "",
      es: byLocale.get("es")?.name ?? ""
    },
    shortDescription: {
      tr: byLocale.get("tr")?.shortDescription ?? "",
      en: byLocale.get("en")?.shortDescription ?? "",
      es: byLocale.get("es")?.shortDescription ?? ""
    },
    ingredients: {
      tr: byLocale.get("tr")?.ingredients ?? "",
      en: byLocale.get("en")?.ingredients ?? "",
      es: byLocale.get("es")?.ingredients ?? ""
    },
    spicyLevel: spicyLevel ?? 0
  };
}

async function logAndRevalidate(
  userId: string,
  action: AuditAction,
  resourceType: string,
  resourceId?: string,
  newValue?: unknown
) {
  await audit({ userId, action, resourceType, resourceId, newValue });
  await setAdminFlash("success", successMessage(action, resourceType));
  revalidatePath("/");
}

function successMessage(action: AuditAction, resourceType: string) {
  if (resourceType.endsWith(":sort")) return "Sıralama başarıyla kaydedildi.";
  if (action === AuditAction.DELETE) return "Kayıt başarıyla silindi.";
  if (action === AuditAction.SETTINGS_CHANGE) return "Ayarlar başarıyla kaydedildi.";
  if (action === AuditAction.UPDATE) return "Kayıt başarıyla güncellendi.";
  if (action === AuditAction.CREATE) return "Kayıt başarıyla kaydedildi.";
  return "İşlem başarıyla tamamlandı.";
}

async function maybeCalculateAndStoreNutrition(productId: string) {
  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, reason: "OPENAI_API_KEY is not configured" };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { translations: true }
    });
    if (!product) return { ok: false, reason: "Product not found" };

    const tr = product.translations.find((item) => item.locale === "tr");
    const en = product.translations.find((item) => item.locale === "en");
    const estimate = await estimateCaloriesPerPortion({
      name: tr?.name || en?.name || productId,
      description: tr?.shortDescription || en?.shortDescription,
      ingredients: tr?.ingredients || en?.ingredients,
      portion: product.portion
    });

    if (isOpenAIError(estimate)) return { ok: false, reason: estimate.error };
    await prisma.product.update({
      where: { id: productId },
      data: { calories: estimate.calories }
    });
    return { ok: true, calories: estimate.calories, note: estimate.note };
  } catch (error) {
    console.error("Nutrition calculation action failed", error);
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Unknown nutrition calculation error"
    };
  }
}
