"use server";

import { revalidatePath } from "next/cache";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit/audit";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { slugify } from "@/lib/utils";
import { categorySchema, productSchema } from "@/lib/validation/menu";

export async function createCategoryAction(formData: FormData) {
  const user = await requireAdmin();
  const name = {
    tr: String(formData.get("name_tr") ?? ""),
    en: String(formData.get("name_en") ?? ""),
    es: String(formData.get("name_es") ?? "")
  };

  const parsed = categorySchema.parse({
    name,
    description: {
      tr: String(formData.get("description_tr") ?? ""),
      en: String(formData.get("description_en") ?? ""),
      es: String(formData.get("description_es") ?? "")
    },
    parentId: String(formData.get("parentId") || "") || null,
    slug: String(formData.get("slug") || slugify(name.en || name.tr)),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isActive: formData.get("isActive") === "on"
  });

  const category = await prisma.category.create({
    data: {
      parentId: parsed.parentId || undefined,
      slug: parsed.slug,
      sortOrder: parsed.sortOrder,
      isActive: parsed.isActive,
      createdBy: user.id,
      translations: {
        create: (["tr", "en", "es"] as const).map((locale) => ({
          locale,
          name: parsed.name[locale],
          description: parsed.description[locale],
          slug: slugify(parsed.name[locale])
        }))
      }
    }
  });

  await audit({
    userId: user.id,
    action: AuditAction.CREATE,
    resourceType: "Category",
    resourceId: category.id,
    newValue: parsed
  });
  revalidatePath("/");
}

export async function createProductAction(formData: FormData) {
  const user = await requireAdmin();
  const parsed = productSchema.parse({
    categoryId: String(formData.get("categoryId") ?? ""),
    name: {
      tr: String(formData.get("name_tr") ?? ""),
      en: String(formData.get("name_en") ?? ""),
      es: String(formData.get("name_es") ?? "")
    },
    shortDescription: {
      tr: String(formData.get("short_tr") ?? ""),
      en: String(formData.get("short_en") ?? ""),
      es: String(formData.get("short_es") ?? "")
    },
    price: formData.get("price"),
    currency: String(formData.get("currency") || "TRY"),
    spicyLevel: formData.get("spicyLevel") ?? 0,
    isActive: formData.get("isActive") === "on",
    isAvailable: formData.get("isAvailable") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isNew: formData.get("isNew") === "on"
  });

  const product = await prisma.product.create({
    data: {
      categoryId: parsed.categoryId,
      price: parsed.price,
      currency: parsed.currency,
      spicyLevel: parsed.spicyLevel,
      isActive: parsed.isActive,
      isAvailable: parsed.isAvailable,
      isFeatured: parsed.isFeatured,
      isNew: parsed.isNew,
      createdBy: user.id,
      translations: {
        create: (["tr", "en", "es"] as const).map((locale) => ({
          locale,
          name: parsed.name[locale],
          shortDescription: parsed.shortDescription[locale],
          slug: slugify(parsed.name[locale])
        }))
      }
    }
  });

  await audit({
    userId: user.id,
    action: AuditAction.CREATE,
    resourceType: "Product",
    resourceId: product.id,
    newValue: parsed
  });
  revalidatePath("/");
}
