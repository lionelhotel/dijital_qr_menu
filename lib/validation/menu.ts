import { z } from "zod";

export const localizedTextSchema = z.object({
  tr: z.string().trim().min(1),
  en: z.string().trim().min(1),
  es: z.string().trim().min(1)
});

const mediaUrlSchema = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true;
    if (value.startsWith("/")) return true;
    return /^https?:\/\//i.test(value);
  }, "Invalid url")
  .default("");

export const categorySchema = z.object({
  name: localizedTextSchema,
  description: z.object({
    tr: z.string().trim().default(""),
    en: z.string().trim().default(""),
    es: z.string().trim().default("")
  }),
  parentId: z.string().nullable().default(null),
  slug: z.string().trim().min(2),
  imageUrl: mediaUrlSchema,
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
  heroTitle: z.object({
    tr: z.string().trim().default(""),
    en: z.string().trim().default(""),
    es: z.string().trim().default("")
  }),
  slug: z.string().trim().min(2),
  imageUrl: mediaUrlSchema,
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
  imageUrl: mediaUrlSchema,
  price: z.coerce.number().positive(),
  calories: z.coerce.number().int().min(0).optional().nullable(),
  currency: z.string().default("TRY"),
  prepMinutes: z.coerce.number().int().min(0).optional().nullable(),
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
