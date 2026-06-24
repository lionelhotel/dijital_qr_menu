import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { slugify } from "@/lib/utils";
import { createSimpleXlsx, parseFirstSheet, type XlsxCell } from "@/lib/xlsx/simple-xlsx";

const locales = ["tr", "en", "es"] as const;

export const productExcelHeaders = [
  "id",
  "category_slug",
  "category_tr",
  "name_tr",
  "name_en",
  "name_es",
  "short_tr",
  "short_en",
  "short_es",
  "ingredients_tr",
  "ingredients_en",
  "ingredients_es",
  "price",
  "currency",
  "calories",
  "prepMinutes",
  "spicyLevel",
  "imageUrl",
  "isActive",
  "isAvailable",
  "isFeatured",
  "isNew",
  "menu_slugs",
  "allergen_keys",
  "sortOrder"
];

type ProductForExport = Prisma.ProductGetPayload<{
  include: {
    translations: true;
    category: { include: { translations: true } };
    menus: { include: { menu: true } };
    allergens: { include: { allergen: true } };
  };
}>;

export async function exportProductsXlsx() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      translations: true,
      category: { include: { translations: true } },
      menus: { include: { menu: true } },
      allergens: { include: { allergen: true } }
    }
  });

  return createSimpleXlsx(productExcelHeaders, products.map(productToRow), "Products");
}

export async function importProductsXlsx(file: File, userId: string) {
  if (!file.size) throw new Error("İçe aktarılacak Excel dosyasını seçin.");
  const rows = parseFirstSheet(Buffer.from(await file.arrayBuffer()));
  const [headers, ...dataRows] = rows;
  if (!headers?.length) throw new Error("Excel dosyasında başlık satırı bulunamadı.");

  const normalizedHeaders = headers.map((header) => header.trim());
  const missingHeaders = productExcelHeaders.filter((header) => !normalizedHeaders.includes(header));
  if (missingHeaders.length) throw new Error(`Excel formatı eksik kolon içeriyor: ${missingHeaders.join(", ")}`);

  const categories = await prisma.category.findMany({ where: { deletedAt: null }, include: { translations: true } });
  const menus = await prisma.menu.findMany({ where: { deletedAt: null }, include: { translations: true } });
  const allergens = await prisma.allergen.findMany({ where: { deletedAt: null }, include: { translations: true } });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [index, row] of dataRows.entries()) {
    const rowNumber = index + 2;
    if (row.every((cell) => !String(cell ?? "").trim())) continue;

    try {
      const record = rowToRecord(normalizedHeaders, row);
      const name = localized(record, "name");
      if (!name.tr) throw new Error("name_tr zorunlu.");
      if (!record.category_slug) throw new Error("category_slug zorunlu.");

      const category = categories.find((item) => item.slug === record.category_slug) ?? categories.find((item) => localizedName(item.translations) === record.category_tr);
      if (!category) throw new Error(`Kategori bulunamadı: ${record.category_slug}`);

      const menuIds = splitList(record.menu_slugs)
        .map((slug) => menus.find((menu) => menu.slug === slug)?.id)
        .filter((id): id is string => Boolean(id));
      const allergenIds = splitList(record.allergen_keys)
        .map((key) => allergens.find((allergen) => allergen.key === key)?.id)
        .filter((id): id is string => Boolean(id));
      const existing = record.id ? await prisma.product.findFirst({ where: { id: record.id, deletedAt: null } }) : null;
      const productData = {
        categoryId: category.id,
        price: decimal(record.price || "0"),
        calories: optionalInt(record.calories),
        currency: record.currency || "TRY",
        prepMinutes: optionalInt(record.prepMinutes),
        spicyLevel: optionalInt(record.spicyLevel) ?? 0,
        mainImageUrl: record.imageUrl || null,
        isActive: bool(record.isActive, true),
        isAvailable: bool(record.isAvailable, true),
        isFeatured: bool(record.isFeatured, false),
        isNew: bool(record.isNew, false),
        sortOrder: optionalInt(record.sortOrder) ?? 0,
        updatedBy: userId
      };

      if (existing) {
        await prisma.$transaction([
          prisma.productAllergen.deleteMany({ where: { productId: existing.id } }),
          prisma.productMenu.deleteMany({ where: { productId: existing.id } }),
          prisma.product.update({
            where: { id: existing.id },
            data: {
              ...productData,
              translations: { upsert: productTranslationUpserts(existing.id, record) },
              menus: { create: menuIds.map((menuId) => ({ menuId })) },
              allergens: { create: allergenIds.map((allergenId) => ({ allergenId })) }
            }
          })
        ]);
        updated += 1;
      } else {
        await prisma.product.create({
          data: {
            ...productData,
            createdBy: userId,
            translations: { create: productTranslations(record) },
            menus: { create: menuIds.map((menuId) => ({ menuId })) },
            allergens: { create: allergenIds.map((allergenId) => ({ allergenId })) }
          }
        });
        created += 1;
      }
    } catch (error) {
      skipped += 1;
      errors.push(`${rowNumber}. satır: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    }
  }

  return { created, updated, skipped, errors };
}

function productToRow(product: ProductForExport): XlsxCell[] {
  const tr = product.translations.find((item) => item.locale === "tr");
  const en = product.translations.find((item) => item.locale === "en");
  const es = product.translations.find((item) => item.locale === "es");

  return [
    product.id,
    product.category.slug,
    product.category.translations.find((item) => item.locale === "tr")?.name ?? "",
    tr?.name ?? "",
    en?.name ?? "",
    es?.name ?? "",
    tr?.shortDescription ?? "",
    en?.shortDescription ?? "",
    es?.shortDescription ?? "",
    tr?.ingredients ?? "",
    en?.ingredients ?? "",
    es?.ingredients ?? "",
    Number(product.price),
    product.currency,
    product.calories,
    product.prepMinutes,
    product.spicyLevel,
    product.mainImageUrl ?? "",
    product.isActive,
    product.isAvailable,
    product.isFeatured,
    product.isNew,
    product.menus.map((item) => item.menu.slug).join(";"),
    product.allergens.map((item) => item.allergen.key).join(";"),
    product.sortOrder
  ];
}

function rowToRecord(headers: string[], row: string[]) {
  return Object.fromEntries(headers.map((header, index) => [header, String(row[index] ?? "").trim()])) as Record<string, string>;
}

function localized(record: Record<string, string>, prefix: string) {
  return {
    tr: record[`${prefix}_tr`] || "",
    en: record[`${prefix}_en`] || record[`${prefix}_tr`] || "",
    es: record[`${prefix}_es`] || record[`${prefix}_tr`] || ""
  };
}

function productTranslations(record: Record<string, string>) {
  const name = localized(record, "name");
  const short = localized(record, "short");
  const ingredients = localized(record, "ingredients");
  return locales.map((locale) => ({
    locale,
    name: name[locale],
    shortDescription: short[locale],
    detailedDescription: short[locale],
    ingredients: ingredients[locale],
    slug: slugify(name[locale])
  }));
}

function productTranslationUpserts(productId: string, record: Record<string, string>) {
  return productTranslations(record).map((translation) => ({
    where: { productId_locale: { productId, locale: translation.locale } },
    update: translation,
    create: translation
  }));
}

function localizedName(translations: { locale: string; name: string }[]) {
  return translations.find((translation) => translation.locale === "tr")?.name ?? "";
}

function splitList(value: string) {
  return value.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
}

function bool(value: string, fallback: boolean) {
  if (!value) return fallback;
  return ["true", "1", "evet", "yes", "aktif"].includes(value.toLowerCase());
}

function optionalInt(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function decimal(value: string) {
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error("Geçerli bir fiyat girin.");
  return parsed;
}
