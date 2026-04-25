export const themePalette = {
  fontFamily: "\"IBM Plex Sans\", \"Segoe UI\", sans-serif",
  colors: {
    canvas: "#101013",
    canvasSoft: "#141418",
    canvasStrong: "#0c0c0f",
    ink: "#f5f3ff",
    inkSoft: "#ece9ff",
    inkMuted: "#d2cedf",
    muted: "#9894a8",
    mutedSoft: "#767184",
    line: "#2d2d34",
    lineSoft: "#232329",
    lineHover: "#3a3a44",
    panel: "#1a1a20",
    panelSoft: "#202028",
    panelStrong: "#17171c",
    panelAlt: "#24242c",
    panelHeader: "#212129",
    panelHover: "#262630",
    progressRail: "#2a2a31",
    primary: "#10c97a",
    savings: "#59d97f",
    margin: "#34cf82",
    primaryStrong: "#0fa968",
    primaryBorder: "#2fe092",
    primarySoft: "#183327",
    success: "#32d67f",
    expense: "#ff6178",
    warning: "#f6b24b",
    info: "#24b36d",
    white: "#ffffff"
  },
  shadows: {
    card: "0 14px 30px rgba(0, 0, 0, 0.34)",
    cardStrong: "0 20px 40px rgba(0, 0, 0, 0.42)"
  }
};

export const themeColorRgb = {
  canvas: "16 16 19",
  ink: "245 243 255",
  muted: "152 148 168",
  line: "45 45 52",
  panel: "26 26 32",
    primary: "16 201 122",
    margin: "52 207 130",
    income: "50 214 127",
  expense: "255 97 120",
  warning: "246 178 75"
};

export function applyThemeCssVariables() {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  Object.entries(themePalette.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${toKebabCase(key)}`, value);
  });

  Object.entries(themeColorRgb).forEach(([key, value]) => {
    root.style.setProperty(`--color-${toKebabCase(key)}-rgb`, value);
  });

  Object.entries(themePalette.shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${toKebabCase(key)}`, value);
  });

  root.style.setProperty("--font-app", themePalette.fontFamily);
}

function toKebabCase(value) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}
