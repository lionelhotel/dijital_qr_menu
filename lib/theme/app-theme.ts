import type { CSSProperties } from "react";

type ThemeLike = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  radius: number;
  darkModeEnabled: boolean;
} | null;

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

export function createThemeStyle(theme: ThemeLike): ThemeStyle {
  const darkMode = theme?.darkModeEnabled ?? false;
  const backgroundHex = theme?.backgroundColor ?? "#F7F4EE";
  const cardHex = theme?.cardColor ?? "#FFFFFF";
  const textHex = theme?.textColor ?? "#2B2926";
  const primary = hexToHsl(theme?.primaryColor ?? "#2B2926", "30 6% 16%");
  const accent = hexToHsl(theme?.accentColor ?? "#A8844F", "36 36% 48%");
  const background = hexToHsl(backgroundHex, "37 33% 95%");
  const card = hexToHsl(cardHex, "0 0% 100%");
  const foreground = hexToHsl(textHex, "30 6% 16%");
  const radius = Number.isFinite(theme?.radius) ? `${theme?.radius}px` : "8px";
  const customBackground = Boolean(theme?.backgroundColor && theme.backgroundColor !== "#F7F4EE");
  const customCard = Boolean(theme?.cardColor && theme.cardColor !== "#FFFFFF");
  const customText = Boolean(theme?.textColor && theme.textColor !== "#2B2926");

  return {
    "--background": darkMode && !customBackground ? "30 8% 9%" : background,
    "--foreground": darkMode && !customText ? "37 33% 95%" : foreground,
    "--card": darkMode && !customCard ? "30 8% 13%" : card,
    "--card-foreground": darkMode && !customText ? "37 33% 95%" : foreground,
    "--primary": primary,
    "--primary-foreground": "37 33% 95%",
    "--accent": accent,
    "--accent-foreground": "0 0% 100%",
    "--muted": darkMode ? "30 7% 18%" : "33 17% 90%",
    "--muted-foreground": darkMode ? "35 12% 70%" : "30 5% 45%",
    "--border": darkMode ? "30 7% 24%" : "34 26% 87%",
    "--input": darkMode ? "30 7% 24%" : "34 26% 87%",
    "--ring": accent,
    "--destructive": "0 72% 45%",
    "--destructive-foreground": "0 0% 100%",
    "--radius": radius,
    "--font-sans": "\"Inter\"",
    "--font-serif": "\"Georgia\""
  };
}

export function themeClassName(theme: ThemeLike) {
  return theme?.darkModeEnabled ? "dark" : undefined;
}

function hexToHsl(hex: string, fallback: string) {
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return fallback;

  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
