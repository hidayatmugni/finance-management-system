import { useEffect, useState } from "react";
import { breakpoints } from "../design/tokens";

function readWidth() {
  return typeof window === "undefined" ? breakpoints.lg : window.innerWidth;
}

/**
 * Screen-size hook backed by matchMedia listeners rather than a resize handler,
 * so it only re-renders when a breakpoint is actually crossed.
 */
export function useResponsive() {
  const [width, setWidth] = useState(readWidth);

  useEffect(() => {
    const queries = Object.values(breakpoints).map((value) =>
      window.matchMedia(`(min-width: ${value}px)`),
    );
    const handleChange = () => setWidth(window.innerWidth);

    queries.forEach((query) => query.addEventListener("change", handleChange));
    handleChange();

    return () => {
      queries.forEach((query) => query.removeEventListener("change", handleChange));
    };
  }, []);

  return {
    width,
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    isWide: width >= breakpoints.xl
  };
}

/** Persisted state backed by localStorage, safe against quota/parse failures. */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      if (typeof window === "undefined") return initialValue;
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    setStoredValue((current) => {
      const next = value instanceof Function ? value(current) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage full or blocked — keep the in-memory value */
      }
      return next;
    });
  };

  return [storedValue, setValue];
}

/** Returns `value` only after it has stopped changing for `delay` ms. */
export function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debounced;
}
