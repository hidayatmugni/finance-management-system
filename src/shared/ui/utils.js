/** Joins class names, dropping falsy values. */
export function cn(...values) {
  return values.filter(Boolean).join(" ");
}
