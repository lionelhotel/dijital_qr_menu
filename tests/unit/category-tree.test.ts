import { describe, expect, it } from "vitest";
import { assertNoCategoryCycle } from "../../lib/validation/menu";

describe("category tree", () => {
  it("rejects cyclic parent relationships", () => {
    const map = new Map([
      ["b", "a"],
      ["c", "b"]
    ]);
    expect(assertNoCategoryCycle("a", "c", map)).toBe(false);
  });
});
