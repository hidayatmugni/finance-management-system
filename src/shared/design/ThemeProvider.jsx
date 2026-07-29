import { ConfigProvider } from "antd";
import idID from "antd/locale/id_ID";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { buildAntdTheme } from "../../app/theme";
import { useConfigSection } from "../config/useAppConfig";
import { DEFAULT_THEME_ID, THEMES, THEME_OPTIONS, applyTheme, resolveThemeId } from "./themes";

const ThemeContext = createContext(null);
const STORAGE_KEY = "fm:theme";

function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    // `resolveThemeId` maps retired ids onto their replacement. An unknown id
    // must stay null so the CMS default wins instead of a bogus preference.
    const resolved = resolveThemeId(stored);
    return THEMES[stored] || resolved !== DEFAULT_THEME_ID ? resolved : null;
  } catch {
    return null;
  }
}

/**
 * Owns the active theme and keeps three things in sync:
 *   1. CSS variables on :root  (Tailwind + our own components)
 *   2. Ant Design's token set  (all antd components, including portals)
 *   3. The user's stored preference / the CMS default
 *
 * Because every consumer reads semantic tokens, switching here is the only
 * place a theme change has to happen.
 */
export function ThemeProvider({ children }) {
  const themeConfig = useConfigSection("theme");

  const [userTheme, setUserTheme] = useState(() =>
    typeof window === "undefined" ? null : readStoredTheme(),
  );

  // The CMS sets the default; a user preference wins only when allowed.
  const activeThemeId =
    (themeConfig.allowUserOverride && userTheme) ||
    themeConfig.activeTheme ||
    DEFAULT_THEME_ID;

  const overrides = useMemo(
    () => ({
      primaryColor: themeConfig.primaryColor || undefined,
      radiusScale: themeConfig.radiusScale ?? 1,
      fontScale: themeConfig.fontScale ?? 1,
      compact: Boolean(themeConfig.compact)
    }),
    [themeConfig.primaryColor, themeConfig.radiusScale, themeConfig.fontScale, themeConfig.compact],
  );

  const [resolvedTheme, setResolvedTheme] = useState(() => THEMES[activeThemeId] || THEMES[DEFAULT_THEME_ID]);

  useEffect(() => {
    setResolvedTheme(applyTheme(activeThemeId, overrides));
  }, [activeThemeId, overrides]);

  const setTheme = useCallback((themeId) => {
    if (!THEMES[themeId]) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, themeId);
    } catch {
      /* preference is best effort */
    }
    setUserTheme(themeId);
  }, []);

  const clearUserTheme = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setUserTheme(null);
  }, []);

  const antdTheme = useMemo(
    () => buildAntdTheme(activeThemeId, overrides),
    [activeThemeId, overrides],
  );

  const value = useMemo(
    () => ({
      themeId: activeThemeId,
      theme: resolvedTheme,
      colors: resolvedTheme.colors,
      chart: resolvedTheme.chart,
      isDark: resolvedTheme.mode === "dark",
      options: THEME_OPTIONS,
      canSwitch: Boolean(themeConfig.allowUserOverride),
      setTheme,
      clearUserTheme
    }),
    [activeThemeId, resolvedTheme, themeConfig.allowUserOverride, setTheme, clearUserTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={antdTheme} locale={idID} componentSize="middle">
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme harus dipakai di dalam ThemeProvider.");
  return context;
}

/**
 * Chart colours as concrete hex strings for the active theme — Recharts cannot
 * read `var(--chart-1)`.
 */
export function useChartColors() {
  return useTheme().chart;
}
