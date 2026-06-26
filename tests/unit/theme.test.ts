import { describe, expect, it } from "vitest";
import { createThemeStyle, themeClassName } from "../../lib/theme/app-theme";

const theme = {
  primaryColor: "#2B2926",
  accentColor: "#F4C542",
  backgroundColor: "#E8F3FF",
  cardColor: "#FFFFFF",
  textColor: "#1B1B1B",
  radius: 10,
  darkModeEnabled: false
};

describe("theme", () => {
  it("uses configured palette directly in light mode", () => {
    const style = createThemeStyle(theme);

    expect(style["--background"]).toBe("211 100% 95%");
    expect(style["--card"]).toBe("0 0% 100%");
    expect(style["--foreground"]).toBe("0 0% 11%");
    expect(style["--accent"]).toBe("44 89% 61%");
    expect(style["--accent-foreground"]).toBe("30 8% 9%");
  });

  it("derives readable dark surfaces from the configured palette", () => {
    const style = createThemeStyle({ ...theme, darkModeEnabled: true });

    expect(style["--background"]).toBe("211 24% 9%");
    expect(style["--card"]).toBe("211 24% 13%");
    expect(style["--foreground"]).toBe("0 0% 95%");
    expect(style["--muted"]).toBe("211 24% 18%");
    expect(style["--border"]).toBe("211 24% 25%");
    expect(themeClassName({ ...theme, darkModeEnabled: true })).toBe("dark");
  });
});
