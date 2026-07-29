/**
 * Theme registry.
 *
 * Every theme exposes the *same* set of semantic tokens. Components only ever
 * reference the semantic name (`surface`, `textSecondary`, `dangerInk`,
 * `chart3`…), never a raw colour — so switching themes re-paints the entire app
 * without a single component or stylesheet change.
 *
 * Each semantic role has two colours:
 *   `x`     — the *fill*: progress bars, chart marks, solid buttons.
 *   `xInk`  — the *text* version, guaranteed readable on `xSoft` and on the
 *             page background.
 * They are usually identical. They diverge for pastel palettes, where a colour
 * that looks right as a 6 px bar is far too light for 12 px type. Keeping both
 * lets a theme be soft without becoming unreadable.
 *
 * Adding a fourth theme means adding one object to `THEMES`; nothing else.
 */

/* -------------------------------------------------------------------------- */
/*  1. Midnight — dark. Green primary, purple/red/blue/yellow accents.          */
/* -------------------------------------------------------------------------- */
const midnight = {
  id: "midnight",
  label: "Midnight",
  description: "Gelap, kontras tinggi, aksen hijau neon.",
  mode: "dark",
  preview: ["#0A0A0B", "#00D68F", "#7C5CFF", "#FF5C5C", "#FFC531"],

  fonts: {
    display: '"Space Grotesk", "Telegraf", "Segoe UI", sans-serif',
    body: '"Inter", -apple-system, "SF Pro Text", "Segoe UI", sans-serif'
  },

  colors: {
    bg: "#0A0A0B",
    bgSubtle: "#121214",
    surface: "#17181A",
    surfaceRaised: "#1E1F22",
    surfaceHover: "#232427",
    surfaceSunken: "#0E0E10",

    border: "#2A2C30",
    borderStrong: "#3C4045",

    text: "#F4F5F6",
    textSecondary: "#A2A7AD",
    textTertiary: "#6C7178",
    textInverse: "#0A0A0B",

    primary: "#00D68F",
    primaryHover: "#19E3A0",
    primaryActive: "#00B679",
    primarySoft: "#0D2B22",
    primaryBorder: "#1F5442",
    primaryInk: "#00D68F",
    onPrimary: "#04150F",

    secondary: "#7C5CFF",
    secondarySoft: "#1E1938",
    secondaryInk: "#9E86FF",
    tertiary: "#FF5C5C",
    tertiarySoft: "#331A1D",
    tertiaryInk: "#FF8080",

    success: "#00D68F",
    successSoft: "#0D2B22",
    successInk: "#2FE0A6",
    warning: "#FFC531",
    warningSoft: "#332A12",
    warningInk: "#FFD25F",
    danger: "#FF5C5C",
    dangerSoft: "#331A1D",
    dangerInk: "#FF8080",
    info: "#4B8BFF",
    infoSoft: "#12203A",
    infoInk: "#79A8FF",

    income: "#00D68F",
    incomeInk: "#2FE0A6",
    expense: "#FF5C5C",
    expenseInk: "#FF8080"
  },

  chart: ["#00D68F", "#7C5CFF", "#4B8BFF", "#FFC531", "#FF5C5C", "#2DD4BF", "#F472B6", "#FB923C"],

  shadows: {
    xs: "0 1px 2px rgba(0, 0, 0, 0.40)",
    sm: "0 2px 6px rgba(0, 0, 0, 0.45)",
    md: "0 8px 20px rgba(0, 0, 0, 0.50)",
    lg: "0 18px 44px rgba(0, 0, 0, 0.58)"
  }
};

/* -------------------------------------------------------------------------- */
/*  2. Daylight — light. Neutral greys with an orchid-blue accent.              */
/* -------------------------------------------------------------------------- */
const daylight = {
  id: "daylight",
  label: "Daylight",
  description: "Terang, netral, aksen biru orchid. Cocok untuk kerja seharian.",
  mode: "light",
  preview: ["#FFFFFF", "#2D68C4", "#0E7C7B", "#D92D6B", "#FFC93C"],

  fonts: {
    display: '"Inter", -apple-system, "Segoe UI", sans-serif',
    body: '"Inter", -apple-system, "Segoe UI", sans-serif'
  },

  colors: {
    bg: "#F5F5F5",
    bgSubtle: "#EBEBEB",
    surface: "#FFFFFF",
    surfaceRaised: "#FFFFFF",
    surfaceHover: "#F5F5F5",
    surfaceSunken: "#EBEBEB",

    border: "#D6D6D6",
    borderStrong: "#ADADAD",

    text: "#000000",
    textSecondary: "#5C5C5C",
    textTertiary: "#8F8F8F",
    textInverse: "#FFFFFF",

    primary: "#2D68C4",
    primaryHover: "#245AAE",
    primaryActive: "#1B4D89",
    primarySoft: "#EDF3FC",
    primaryBorder: "#A3C4EC",
    primaryInk: "#2D68C4",
    onPrimary: "#FFFFFF",

    secondary: "#0E7C7B",
    secondarySoft: "#E6F4F4",
    secondaryInk: "#0B6968",
    tertiary: "#D92D6B",
    tertiarySoft: "#FCE9F1",
    tertiaryInk: "#C02259",

    success: "#0E7C7B",
    successSoft: "#E6F4F4",
    successInk: "#0B6968",
    warning: "#D9A32B",
    warningSoft: "#FDF6E3",
    warningInk: "#7E5D11",
    danger: "#D92D6B",
    dangerSoft: "#FCE9F1",
    dangerInk: "#C02259",
    info: "#2D68C4",
    infoSoft: "#EDF3FC",
    infoInk: "#2D68C4",

    income: "#0E7C7B",
    incomeInk: "#0B6968",
    expense: "#D92D6B",
    expenseInk: "#C02259"
  },

  chart: ["#2D68C4", "#0E7C7B", "#D92D6B", "#D9A32B", "#FF8C5A", "#6699DB", "#2FA8A5", "#B02F62"],

  shadows: {
    xs: "0 1px 2px rgba(0, 0, 0, 0.04)",
    sm: "0 1px 3px rgba(0, 0, 0, 0.07), 0 1px 2px rgba(0, 0, 0, 0.04)",
    md: "0 4px 14px rgba(0, 0, 0, 0.08)",
    lg: "0 14px 34px rgba(0, 0, 0, 0.12)"
  }
};

/* -------------------------------------------------------------------------- */
/*  3. Pastel — light. Rose page washed with Pêche, Menthe and Lagune.          */
/*                                                                             */
/*  No pure white anywhere: the page is Nectarine lightened, cards are a paler  */
/*  tint of the same hue, and a fixed gradient blends all four palette colours  */
/*  behind the content.                                                        */
/*                                                                             */
/*  The four source pastels stay exactly as given for every fill, chart mark    */
/*  and soft badge. Their `Ink` counterparts are deepened versions of the same  */
/*  hue, used only where the colour carries small text — a 3:1 pastel reads     */
/*  beautifully as a bar and terribly as a 12 px label.                         */
/* -------------------------------------------------------------------------- */
const pastel = {
  id: "pastel",
  label: "Pastel",
  description: "Hangat dan lembut — latar rose dengan pêche, menthe, lagune.",
  mode: "light",
  preview: ["#F3D8D2", "#D7897F", "#F9B95C", "#96C7B3", "#6398A9"],

  fonts: {
    display: '"Plus Jakarta Sans", "Inter", "Segoe UI", sans-serif',
    body: '"Plus Jakarta Sans", "Inter", "Segoe UI", sans-serif'
  },

  colors: {
    // Rose paper. Nothing in this theme is pure white — the page is Nectarine
    // blended toward light, and cards are a lighter tint of the same hue, so
    // they separate by depth rather than by a hard white/colour edge.
    bg: "#F3D8D2",
    bgSubtle: "#EDC8C0",
    surface: "#FDF5F3",
    surfaceRaised: "#FFFBFA",
    surfaceHover: "#F8E7E3",
    surfaceSunken: "#F4DCD6",

    border: "#E6C3BB",
    borderStrong: "#CE9C91",

    // Warm near-black rather than pure black, so type sits with the rose.
    text: "#3B2E2B",
    textSecondary: "#725D57",
    textTertiary: "#9C8781",
    textInverse: "#FFFFFF",

    // Lagune deepened for solid buttons (white label needs 4.5:1); the true
    // #6398A9 lives on as `info`, as chart-1, and in every soft fill.
    primary: "#35707F",
    primaryHover: "#2C606D",
    primaryActive: "#23505B",
    primarySoft: "#EAF3F6",
    primaryBorder: "#B7D6DF",
    primaryInk: "#2B6675",
    onPrimary: "#FFFFFF",

    secondary: "#96C7B3",
    secondarySoft: "#EBF5F0",
    secondaryInk: "#256C54",
    tertiary: "#D7897F",
    tertiarySoft: "#FBECEA",
    tertiaryInk: "#A1433A",

    success: "#6FB396",
    successSoft: "#E9F5F0",
    successInk: "#256C54",
    warning: "#F9B95C",
    warningSoft: "#FEF3E2",
    warningInk: "#85570A",
    danger: "#D7897F",
    dangerSoft: "#FBECEA",
    dangerInk: "#A1433A",
    info: "#6398A9",
    infoSoft: "#EAF3F6",
    infoInk: "#2B6675",

    income: "#6FB396",
    incomeInk: "#256C54",
    expense: "#D7897F",
    expenseInk: "#A1433A"
  },

  chart: ["#6398A9", "#96C7B3", "#D7897F", "#F9B95C", "#4E8A9C", "#B8DCC9", "#E8A99F", "#C98F3C"],

  /**
   * All four palette colours blended over the page, pink dominant — Pêche
   * warming the top-left, Nectarine the top-right, Menthe and Lagune cooling
   * the lower edge. Painted on a fixed layer behind the content so it stays put
   * while the page scrolls and never tints the cards sitting on top of it.
   */
  backdrop:
    "radial-gradient(1100px 620px at 6% -12%, rgba(249, 185, 92, 0.34), transparent 62%), " +
    "radial-gradient(900px 540px at 98% -6%, rgba(215, 137, 127, 0.52), transparent 58%), " +
    "radial-gradient(820px 560px at 12% 108%, rgba(150, 199, 179, 0.30), transparent 60%), " +
    "radial-gradient(760px 520px at 92% 104%, rgba(99, 152, 169, 0.24), transparent 58%)",

  shadows: {
    xs: "0 1px 2px rgba(90, 62, 54, 0.05)",
    sm: "0 1px 3px rgba(90, 62, 54, 0.08), 0 1px 2px rgba(90, 62, 54, 0.05)",
    md: "0 4px 16px rgba(90, 62, 54, 0.10)",
    lg: "0 16px 38px rgba(90, 62, 54, 0.14)"
  }
};

export const THEMES = { midnight, daylight, pastel };

export const THEME_OPTIONS = Object.values(THEMES).map((theme) => ({
  value: theme.id,
  label: theme.label,
  description: theme.description,
  mode: theme.mode,
  preview: theme.preview
}));

export const DEFAULT_THEME_ID = "daylight";

/**
 * Retired theme ids, so anyone already using one lands on its successor rather
 * than being silently reset to the default.
 */
const THEME_ALIASES = { verdant: "pastel" };

export function resolveThemeId(themeId) {
  const resolved = THEME_ALIASES[themeId] || themeId;
  return THEMES[resolved] ? resolved : DEFAULT_THEME_ID;
}

export function getTheme(themeId) {
  return THEMES[resolveThemeId(themeId)];
}

/* ------------------------------------------------------------------ helpers */

function toKebabCase(value) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

export function hexToRgbChannels(hex) {
  const normalized = String(hex).replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int)) return "0 0 0";
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
}

/** Lighten (positive) or darken (negative) a hex colour by a percentage. */
export function shadeColor(hex, percent) {
  const normalized = String(hex).replace("#", "");
  const int = Number.parseInt(normalized, 16);
  if (Number.isNaN(int)) return hex;

  const amount = Math.round(2.55 * percent);
  const clamp = (channel) => Math.max(0, Math.min(255, channel + amount));
  const r = clamp((int >> 16) & 255);
  const g = clamp((int >> 8) & 255);
  const b = clamp(int & 255);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

/** Blend a colour toward another — used to derive "soft" badge fills. */
export function mixColors(hex, targetHex, ratio) {
  const parse = (value) => {
    const int = Number.parseInt(String(value).replace("#", ""), 16);
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  };

  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(targetHex);
  const blend = (a, b) => Math.round(a + (b - a) * ratio);

  const r = blend(r1, r2);
  const g = blend(g1, g2);
  const b = blend(b1, b2);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

/** Relative luminance per WCAG 2.1. */
export function luminance(hex) {
  const normalized = String(hex).replace("#", "");
  const int = Number.parseInt(normalized, 16);
  if (Number.isNaN(int)) return 0;

  const channel = (value) => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * channel((int >> 16) & 255) +
    0.7152 * channel((int >> 8) & 255) +
    0.0722 * channel(int & 255)
  );
}

/** WCAG contrast ratio between two colours (1–21). */
export function contrastRatio(foreground, background) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Picks whichever of black/white reads better on `background`. Used when a CMS
 * admin sets a custom accent and we have to derive its label colour.
 */
export function readableTextOn(background, lightText = "#FFFFFF", darkText = "#1A1A1A") {
  return contrastRatio(lightText, background) >= contrastRatio(darkText, background)
    ? lightText
    : darkText;
}

/** Deterministic swatch so the same label always gets the same colour. */
export function colorForKey(key, colors) {
  if (!key) return colors[0];

  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = key.charCodeAt(index) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Writes a theme to `:root` as CSS variables and returns the resolved theme.
 *
 * @param {string} themeId
 * @param {{ primaryColor?: string, radiusScale?: number, fontScale?: number }} overrides
 *   The CMS can override the accent colour and sizing on top of any theme.
 */
export function applyTheme(themeId, overrides = {}) {
  const theme = getTheme(themeId);
  if (typeof document === "undefined") return theme;

  const root = document.documentElement;
  const colors = { ...theme.colors };

  // A custom accent from the CMS replaces the primary ramp. The hover/active/
  // soft variants and the button label colour are derived so a light accent
  // still ends up with readable text on it.
  if (overrides.primaryColor && overrides.primaryColor !== colors.primary) {
    const isDark = theme.mode === "dark";
    const accent = overrides.primaryColor;

    colors.primary = accent;
    colors.primaryHover = shadeColor(accent, isDark ? 10 : -10);
    colors.primaryActive = shadeColor(accent, isDark ? -10 : -22);
    colors.primarySoft = mixColors(accent, theme.colors.surface, isDark ? 0.86 : 0.92);
    colors.primaryBorder = mixColors(accent, theme.colors.surface, isDark ? 0.65 : 0.7);
    colors.onPrimary = readableTextOn(accent, "#FFFFFF", theme.colors.text);

    // The ink variant must stay legible on the soft fill, so darken the accent
    // until it clears the AA threshold rather than trusting the raw value.
    let ink = accent;
    let attempts = 0;
    while (contrastRatio(ink, colors.primarySoft) < 4.5 && attempts < 12) {
      ink = shadeColor(ink, isDark ? 8 : -8);
      attempts += 1;
    }
    colors.primaryInk = ink;

    colors.info = accent;
    colors.infoSoft = colors.primarySoft;
    colors.infoInk = ink;
  }

  Object.entries(colors).forEach(([key, value]) => {
    const name = toKebabCase(key);
    root.style.setProperty(`--color-${name}`, value);
    root.style.setProperty(`--color-${name}-rgb`, hexToRgbChannels(value));
  });

  theme.chart.forEach((value, index) => {
    root.style.setProperty(`--chart-${index + 1}`, value);
    root.style.setProperty(`--chart-${index + 1}-rgb`, hexToRgbChannels(value));
  });

  Object.entries(theme.shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value);
  });
  root.style.setProperty(
    "--shadow-focus",
    `0 0 0 3px rgb(${hexToRgbChannels(colors.primary)} / 0.28)`,
  );

  const radiusScale = overrides.radiusScale ?? 1;
  const radii = { xs: 6, sm: 8, md: 10, lg: 14, xl: 18, xxl: 24 };
  Object.entries(radii).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, `${Math.round(value * radiusScale)}px`);
  });
  root.style.setProperty("--radius-pill", "999px");

  // Optional decorative wash behind the content. Themes without one clear the
  // variable rather than leaving the previous theme's gradient behind.
  root.style.setProperty("--app-backdrop", theme.backdrop || "none");

  const fontScale = overrides.fontScale ?? 1;
  root.style.setProperty("--font-display", theme.fonts.display);
  root.style.setProperty("--font-body", theme.fonts.body);
  root.style.setProperty("--font-scale", String(fontScale));

  root.dataset.theme = theme.id;
  root.dataset.mode = theme.mode;
  root.style.setProperty("color-scheme", theme.mode);

  return { ...theme, colors };
}
