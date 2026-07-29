/**
 * Non-colour design tokens. Colours live in `themes.js` because they change per
 * theme; everything here is shared by all three.
 */

export {
  THEMES,
  THEME_OPTIONS,
  DEFAULT_THEME_ID,
  getTheme,
  applyTheme,
  shadeColor,
  mixColors,
  colorForKey,
  hexToRgbChannels
} from "./themes";

/** Type scale, in px. Multiplied at render time by `--font-scale`. */
export const typeScale = {
  caption: 11,
  small: 12,
  body: 14,
  bodyLarge: 15,
  subtitle: 16,
  title: 20,
  headline: 24,
  display: 30
};

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48
};

export const radii = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  pill: 999
};

export const layout = {
  sidebarWidth: 252,
  sidebarCollapsedWidth: 76,
  headerHeight: 62,
  bottomNavHeight: 66,
  contentMaxWidth: 1640
};

export const motion = {
  fast: "120ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "180ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "280ms cubic-bezier(0.4, 0, 0.2, 1)"
};

export const breakpoints = {
  sm: 576,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1600
};

/**
 * Reads a resolved CSS variable. Charting libraries need real colour strings,
 * not `var(--x)`, so this is the bridge between CSS variables and JS.
 */
export function cssVar(name, fallback = "") {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return value.trim() || fallback;
}
