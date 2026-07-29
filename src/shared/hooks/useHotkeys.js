import { useEffect, useRef } from "react";

function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable === true
  );
}

/**
 * Normalises a keyboard event into a comparable string such as `mod+k`,
 * `shift+?` or `escape`. `mod` maps to Cmd on macOS and Ctrl elsewhere.
 */
function eventToCombo(event) {
  const parts = [];
  if (event.ctrlKey || event.metaKey) parts.push("mod");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
  parts.push(key);

  return parts.join("+");
}

/**
 * Global keyboard shortcuts.
 *
 * @param {Record<string, (event: KeyboardEvent) => void>} bindings
 *   Map of combo -> handler, e.g. `{ "mod+k": open, "mod+enter": submit }`.
 * @param {{ enabled?: boolean, allowInInputs?: string[] }} options
 *   `allowInInputs` lists combos that still fire while a field has focus
 *   (submit shortcuts need this).
 */
export function useHotkeys(bindings, options = {}) {
  const { enabled = true, allowInInputs = ["mod+enter", "escape"] } = options;
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  useEffect(() => {
    if (!enabled) return undefined;

    const handleKeyDown = (event) => {
      const combo = eventToCombo(event);
      const handler = bindingsRef.current[combo];
      if (!handler) return;

      if (isTypingTarget(event.target) && !allowInInputs.includes(combo)) return;

      event.preventDefault();
      handler(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, allowInInputs]);
}

/** Human-readable rendering of a combo for tooltips and hint chips. */
export function formatCombo(combo) {
  const isMac =
    typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);

  return combo
    .split("+")
    .map((part) => {
      if (part === "mod") return isMac ? "⌘" : "Ctrl";
      if (part === "shift") return isMac ? "⇧" : "Shift";
      if (part === "alt") return isMac ? "⌥" : "Alt";
      if (part === "enter") return "Enter";
      if (part === "escape") return "Esc";
      return part.toUpperCase();
    })
    .join(isMac ? "" : "+");
}
