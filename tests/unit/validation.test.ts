import { describe, expect, it } from "vitest";
import { productSchema } from "../../lib/validation/menu";

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
});
