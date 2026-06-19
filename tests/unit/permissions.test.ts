import { describe, expect, it } from "vitest";
import { can } from "../../lib/permissions/permissions";

describe("permissions", () => {
  it("lets super admins manage users", () => {
    expect(can("SUPER_ADMIN", "users:write")).toBe(true);
  });

  it("prevents editors from changing settings", () => {
    expect(can("EDITOR", "settings:write")).toBe(false);
  });
});
