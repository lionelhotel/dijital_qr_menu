import { describe, expect, it } from "vitest";
import { categorySchema, menuSchema, productSchema } from "../../lib/validation/menu";

describe("productSchema", () => {
  it("rejects negative prices", () => {
    const result = productSchema.safeParse({
      categoryId: "cat",
      name: { tr: "A", en: "A", es: "A" },
      shortDescription: { tr: "A", en: "A", es: "A" },
      price: -1
    });
    expect(result.success).toBe(false);
  });

  it("accepts local media urls and rejects invalid image text", () => {
    const product = productSchema.safeParse({
      categoryId: "cat",
      name: { tr: "A", en: "A", es: "A" },
      shortDescription: { tr: "A", en: "A", es: "A" },
      ingredients: { tr: "", en: "", es: "" },
      imageUrl: "/api/media/00000000-0000-0000-0000-000000000000.webp",
      price: 10
    });
    const menu = menuSchema.safeParse({
      name: { tr: "A", en: "A", es: "A" },
      description: { tr: "", en: "", es: "" },
      heroTitle: { tr: "", en: "", es: "" },
      slug: "menu",
      imageUrl: "/api/media/00000000-0000-0000-0000-000000000000.webp"
    });
    const category = categorySchema.safeParse({
      name: { tr: "A", en: "A", es: "A" },
      description: { tr: "", en: "", es: "" },
      slug: "category",
      imageUrl: "not-a-url"
    });

    expect(product.success).toBe(true);
    expect(menu.success).toBe(true);
    expect(category.success).toBe(false);
  });
});
