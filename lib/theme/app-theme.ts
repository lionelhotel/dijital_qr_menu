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
  const primary = parseHexToHsl(theme?.primaryColor ?? "#2B2926", { h: 30, s: 6, l: 16 });
  const accent = parseHexToHsl(theme?.accentColor ?? "#A8844F", { h: 36, s: 36, l: 48 });
  const background = parseHexToHsl(theme?.backgroundColor ?? "#F7F4EE", { h: 37, s: 33, l: 95 });
  const card = parseHexToHsl(theme?.cardColor ?? "#FFFFFF", { h: 0, s: 0, l: 100 });
  const foreground = parseHexToHsl(theme?.textColor ?? "#2B2926", { h: 30, s: 6, l: 16 });
  const radius = Number.isFinite(theme?.radius) ? `${theme?.radius}px` : "8px";
  const darkBackground = darkSurface(background, 9);
  const darkCard = darkSurface(card.s > 0 ? card : background, 13);
  const darkMuted = darkSurface(background, 18);
  const darkBorder = darkSurface(background, 25);
  const darkForeground = lightText(foreground, 95);
  const darkMutedForeground = lightText(foreground, 70);

  return {
    "--background": formatHsl(darkMode ? darkBackground : background),
    "--foreground": formatHsl(darkMode ? darkForeground : foreground),
    "--card": formatHsl(darkMode ? darkCard : card),
    "--card-foreground": formatHsl(darkMode ? darkForeground : foreground),
    "--primary": formatHsl(primary),
    "--primary-foreground": contrastText(primary),
    "--accent": formatHsl(accent),
    "--accent-foreground": contrastText(accent),
    "--muted": formatHsl(darkMode ? darkMuted : { h: 33, s: 17, l: 90 }),
    "--muted-foreground": formatHsl(darkMode ? darkMutedForeground : { h: 30, s: 5, l: 45 }),
    "--border": formatHsl(darkMode ? darkBorder : { h: 34, s: 26, l: 87 }),
    "--input": formatHsl(darkMode ? darkBorder : { h: 34, s: 26, l: 87 }),
    "--ring": formatHsl(accent),
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

type Hsl = {
  h: number;
  s: number;
  l: number;
};

function parseHexToHsl(hex: string, fallback: Hsl): Hsl {
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

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function darkSurface(color: Hsl, lightness: number): Hsl {
  return {
    h: color.h,
    s: Math.min(Math.max(color.s, 6), 24),
    l: lightness
  };
}

function lightText(color: Hsl, lightness: number): Hsl {
  return {
    h: color.h,
    s: Math.min(color.s, 24),
    l: lightness
  };
}

function contrastText(background: Hsl) {
  return background.l >= 58 ? "30 8% 9%" : "37 33% 95%";
}

function formatHsl(color: Hsl) {
  return `${color.h} ${color.s}% ${color.l}%`;
}
