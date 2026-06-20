import { z } from "zod";

export const localizedTextSchema = z.object({
  tr: z.string().trim().min(1),
  en: z.string().trim().min(1),
  es: z.string().trim().min(1)
});

export const categorySchema = z.object({
  name: localizedTextSchema,
  description: z.object({
    tr: z.string().trim().default(""),
    en: z.string().trim().default(""),
    es: z.string().trim().default("")
  }),
  parentId: z.string().nullable().default(null),
  slug: z.string().trim().min(2),
  imageUrl: z.string().url().or(z.literal("")).default(""),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true)
});

export const menuSchema = z.object({
  name: localizedTextSchema,
  description: z.object({
    tr: z.string().trim().default(""),
    en: z.string().trim().default(""),
    es: z.string().trim().default("")
  }),
  slug: z.string().trim().min(2),
  imageUrl: z.string().url().or(z.literal("")).default(""),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true)
});

export const productSchema = z.object({
  categoryId: z.string().min(1),
  name: localizedTextSchema,
  shortDescription: localizedTextSchema,
  ingredients: z.object({
    tr: z.string().trim().default(""),
    en: z.string().trim().default(""),
    es: z.string().trim().default("")
  }),
  imageUrl: z.string().url().or(z.literal("")).default(""),
  price: z.coerce.number().positive(),
  currency: z.string().default("TRY"),
  spicyLevel: z.coerce.number().int().min(0).max(5).default(0),
  isActive: z.coerce.boolean().default(true),
  isAvailable: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  isNew: z.coerce.boolean().default(false)
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(8)
});

export function assertNoCategoryCycle(
  categoryId: string,
  nextParentId: string | null | undefined,
  parentMap: Map<string, string | null>
) {
  let cursor = nextParentId ?? null;
  while (cursor) {
    if (cursor === categoryId) return false;
    cursor = parentMap.get(cursor) ?? null;
  }
  return true;
}
