import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { appConfigDefaults } from "../../shared/config/appConfigDefaults";
import { useAppConfigStore, useConfigSection } from "../../shared/config/useAppConfig";
import { saveAppConfigSection } from "../../shared/firebase/firestoreAppConfig";
import { describeFirestoreError } from "../../shared/firebase/firestoreHousehold";
import { globalFamilyId } from "../../shared/firebase/config";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { useToast } from "../../shared/ui";

/**
 * Editing state for one CMS section.
 *
 * Changes are held in a local draft so an admin can experiment freely; nothing
 * reaches Firestore (or other family members) until Save. Reverting to the
 * shipped defaults is always one click away, which makes the CMS safe to
 * explore.
 *
 * @param {string} section Key from `appConfigDefaults`.
 */
export function useConfigEditor(section) {
  const toast = useToast();
  const { user } = useAuth();
  const family = useFinanceStore((state) => state.family);
  const familyId = family?.id || globalFamilyId;

  const stored = useConfigSection(section);
  const patchSection = useAppConfigStore((state) => state.patchSection);
  const resetSection = useAppConfigStore((state) => state.resetSection);

  const [draft, setDraft] = useState(stored);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  // Adopt remote changes only while the admin has nothing unsaved, so a
  // teammate's save never wipes work in progress.
  useEffect(() => {
    if (!touched) setDraft(stored);
  }, [stored, touched]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(stored),
    [draft, stored],
  );

  /** Shallow field update, e.g. `set("appName", "Kas Keluarga")`. */
  const set = useCallback((key, value) => {
    setTouched(true);
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  /** Merge several fields at once. */
  const merge = useCallback((patch) => {
    setTouched(true);
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  /** Replace one array field (nav items, widgets, templates…). */
  const setList = useCallback((key, items) => {
    setTouched(true);
    setDraft((current) => ({ ...current, [key]: items }));
  }, []);

  /** Update one entry of an array field by id. */
  const updateItem = useCallback((key, id, patch) => {
    setTouched(true);
    setDraft((current) => ({
      ...current,
      [key]: current[key].map((item) => (item.id === id ? { ...item, ...patch } : item))
    }));
  }, []);

  const addItem = useCallback((key, item) => {
    setTouched(true);
    setDraft((current) => ({ ...current, [key]: [...current[key], item] }));
  }, []);

  const removeItem = useCallback((key, id) => {
    setTouched(true);
    setDraft((current) => ({ ...current, [key]: current[key].filter((item) => item.id !== id) }));
  }, []);

  const discard = useCallback(() => {
    setDraft(stored);
    setTouched(false);
  }, [stored]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      // Apply locally first so the UI reflects the change even if the write is
      // still in flight or the device is offline.
      patchSection(section, draft);
      await saveAppConfigSection(familyId, section, draft, user?.uid);
      setTouched(false);
      toast.success("Konfigurasi tersimpan.");
      return true;
    } catch (error) {
      toast.error(describeFirestoreError(error, "konfigurasi"));
      console.error(`[config:${section}]`, error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [draft, familyId, patchSection, section, toast, user?.uid]);

  const restoreDefaults = useCallback(async () => {
    const defaults = appConfigDefaults[section];
    setDraft(defaults);
    setTouched(true);

    resetSection(section);
    try {
      await saveAppConfigSection(familyId, section, defaults, user?.uid);
      setTouched(false);
      toast.success("Dikembalikan ke pengaturan bawaan.");
    } catch (error) {
      toast.error(describeFirestoreError(error, "konfigurasi"));
    }
  }, [familyId, resetSection, section, toast, user?.uid]);

  return {
    draft,
    isDirty,
    saving,
    set,
    merge,
    setList,
    updateItem,
    addItem,
    removeItem,
    save,
    discard,
    restoreDefaults
  };
}

/** Slug generator for new CMS entries (nav ids, widget ids, role ids…). */
export function slugify(value, fallback = "item") {
  const slug = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `${fallback}-${Math.random().toString(36).slice(2, 7)}`;
}
