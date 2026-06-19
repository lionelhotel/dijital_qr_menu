import { describe, expect, it } from "vitest";
import { formatPrice, slugify } from "../../lib/utils";

describe("utils", () => {
  it("creates Turkish-safe slugs", () => {
    expect(slugify("Sıcak İçecekler")).toBe("sicak-icecekler");
  });

  it("formats TRY prices", () => {
    expect(formatPrice(190, "TRY", "tr-TR")).toContain("190");
  });
});
