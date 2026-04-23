export const themePalette = {
  fontFamily: "\"IBM Plex Sans\", \"Segoe UI\", sans-serif",
  colors: {
    canvas: "#0f0f10",
    canvasSoft: "#101011",
    canvasStrong: "#131314",
    ink: "#f1f5f9",
    inkSoft: "#edf2f7",
    inkMuted: "#cfd6de",
    muted: "#8e949e",
    mutedSoft: "#72767d",
    line: "#2a2a2c",
    lineSoft: "#232325",
    lineHover: "#3a3a3d",
    panel: "#171717",
    panelSoft: "#1a1a1b",
    panelStrong: "#151516",
    panelAlt: "#18181a",
    panelHeader: "#1b1b1d",
    panelHover: "#1a1a1c",
    progressRail: "#242426",
    primary: "#16b364",
    savings: "#c6d820",
    margin: "#2283dd",
    primaryStrong: "#12804e",
    primaryBorder: "#128652",
    primarySoft: "#163326",
    success: "#19c06c",
    expense: "#d43644",
    warning: "#f5b546",
    info: "#1f8a56",
    white: "#ffffff"
  },
  shadows: {
    card: "0 8px 20px rgba(0, 0, 0, 0.22)",
    cardStrong: "0 12px 28px rgba(0, 0, 0, 0.34)"
  }
};

export const themeColorRgb = {
  canvas: "15 15 16",
  ink: "241 245 249",
  muted: "142 148 158",
  line: "42 42 44",
  panel: "23 23 23",
  primary: "22 179 100",
  margin: "22 103 179",
  income: "25 192 108",
  expense: "212 54 68",
  warning: "245 181 70"
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
