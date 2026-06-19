import { z } from "zod";

export const localizedTextSchema = z.object({
  tr: z.string().trim().min(1),
  en: z.string().trim().min(1),
  es: z.string().trim().min(1)
});

export const categorySchema = z.object({
  name: localizedTextSchema,
  description: z.object({
    tr: z.string().trim().optional(),
    en: z.string().trim().optional(),
    es: z.string().trim().optional()
  }),
  parentId: z.string().optional().nullable(),
  slug: z.string().trim().min(2),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true)
});

export const productSchema = z.object({
  categoryId: z.string().min(1),
  name: localizedTextSchema,
  shortDescription: localizedTextSchema,
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
