import { useMemo } from "react";
import { create } from "zustand";
import { appConfigDefaults, mergeConfig, resolveNavigation } from "./appConfigDefaults";

const LOCAL_KEY = "fm:appConfig";

function readLocalOverrides() {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalOverrides(overrides) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(overrides));
  } catch {
    /* best effort — Firestore remains the source of truth */
  }
}

function resolve(overrides) {
  return Object.keys(appConfigDefaults).reduce((accumulator, section) => {
    const merged = mergeConfig(appConfigDefaults[section], overrides?.[section]);
    accumulator[section] = section === "navigation" ? resolveNavigation(merged) : merged;
    return accumulator;
  }, {});
}

/**
 * Holds the merged application configuration.
 *
 * Overrides are cached in localStorage so the very first paint after a reload
 * already uses the family's menu and accent colour instead of flashing the
 * defaults while Firestore connects.
 */
export const useAppConfigStore = create((set, get) => {
  const initialOverrides = typeof window === "undefined" ? {} : readLocalOverrides();

  return {
    overrides: initialOverrides,
    config: resolve(initialOverrides),
    status: "idle",

    /** Called by the Firestore subscription. */
    setOverrides: (overrides) => {
      writeLocalOverrides(overrides);
      set({ overrides, config: resolve(overrides), status: "ready" });
    },

    /** Optimistic local update — the caller persists to Firestore separately. */
    patchSection: (section, values) => {
      const overrides = { ...get().overrides, [section]: values };
      writeLocalOverrides(overrides);
      set({ overrides, config: resolve(overrides) });
      return overrides[section];
    },

    resetSection: (section) => {
      const overrides = { ...get().overrides };
      delete overrides[section];
      writeLocalOverrides(overrides);
      set({ overrides, config: resolve(overrides) });
    },

    setStatus: (status) => set({ status })
  };
});

/** Full merged config. */
export function useAppConfig() {
  return useAppConfigStore((state) => state.config);
}

/** A single section, e.g. `useConfigSection("navigation")`. */
export function useConfigSection(section) {
  return useAppConfigStore((state) => state.config[section]);
}

/**
 * Permission check for the signed-in member.
 *
 * @param {string} roleId Role stored on the member document.
 * @returns {{ can: (permission: string) => boolean, role: object }}
 */
export function usePermissions(roleId) {
  const access = useConfigSection("access");

  return useMemo(() => {
    const role =
      access.roles.find((item) => item.id === roleId) ||
      access.roles.find((item) => item.id === access.defaultRole) ||
      access.roles[0];

    const granted = new Set(role?.permissions || []);
    const isSuperUser = granted.has("*");

    return {
      role,
      isSuperUser,
      can: (permission) => (permission ? isSuperUser || granted.has(permission) : true)
    };
  }, [access, roleId]);
}

/** Formatting helpers derived from the `general` section. */
export function useFormatters() {
  const general = useConfigSection("general");

  return useMemo(() => {
    const { locale, currency, decimalPlaces } = general;

    const currencyFormatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: decimalPlaces,
      minimumFractionDigits: decimalPlaces
    });

    const compactFormatter = new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1
    });

    return {
      currency: (value) => currencyFormatter.format(Number(value) || 0),
      compact: (value) => `${general.currencySymbol}${compactFormatter.format(Number(value) || 0)}`,
      number: (value) => new Intl.NumberFormat(locale).format(Number(value) || 0),
      percent: (value) => `${(Number(value) || 0).toFixed(1)}%`
    };
  }, [general]);
}
