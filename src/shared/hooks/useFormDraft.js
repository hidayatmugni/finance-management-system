import { useCallback, useEffect, useRef, useState } from "react";

const DRAFT_PREFIX = "fm:draft:";
const DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 3; // drafts older than 3 days are noise

function readDraft(key) {
  try {
    const raw = window.localStorage.getItem(DRAFT_PREFIX + key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(DRAFT_PREFIX + key);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Auto-saves form values to localStorage so a half-finished entry survives a
 * refresh, a lost connection, or an accidental navigation.
 *
 * @param {string} key      Unique per form.
 * @param {object} values   Current values (usually from `watch()`).
 * @param {{ enabled?: boolean, debounceMs?: number, isEmpty?: (values) => boolean }} options
 */
export function useFormDraft(key, values, options = {}) {
  const { enabled = true, debounceMs = 600, isEmpty } = options;
  const [restorable, setRestorable] = useState(() => (enabled ? readDraft(key) : null));
  const skipNextSave = useRef(true);

  useEffect(() => {
    if (!enabled) return undefined;

    // The first run fires with the form's default values; persisting those
    // would create a "draft" the user never typed.
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return undefined;
    }

    if (isEmpty?.(values)) {
      window.localStorage.removeItem(DRAFT_PREFIX + key);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          DRAFT_PREFIX + key,
          JSON.stringify({ savedAt: Date.now(), values }),
        );
      } catch {
        /* ignore quota errors — drafts are best effort */
      }
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [key, values, enabled, debounceMs, isEmpty]);

  const clearDraft = useCallback(() => {
    window.localStorage.removeItem(DRAFT_PREFIX + key);
    setRestorable(null);
  }, [key]);

  const dismissRestore = useCallback(() => setRestorable(null), []);

  return {
    /** `{ savedAt, values }` when a previous draft is available, else null. */
    draft: restorable,
    clearDraft,
    dismissRestore
  };
}
