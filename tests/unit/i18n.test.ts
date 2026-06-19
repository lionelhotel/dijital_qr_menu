import { describe, expect, it } from "vitest";
import { detectLocale } from "../../lib/i18n/config";

describe("detectLocale", () => {
  it("uses saved locale first", () => {
    expect(detectLocale("de-DE", "tr")).toBe("tr");
  });

  it("matches browser language families", () => {
    expect(detectLocale("es-MX,es;q=0.9")).toBe("es");
    expect(detectLocale("tr-TR,tr;q=0.9")).toBe("tr");
    expect(detectLocale("en-GB,en;q=0.9")).toBe("en");
  });

  it("falls back to English", () => {
    expect(detectLocale("de-DE,fr;q=0.9")).toBe("en");
  });
});
