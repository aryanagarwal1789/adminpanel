/**
 * i18n-images.ts — per-locale image override sidecars.
 *
 * DEPENDENCY-FREE (no React, no imports) so it can be copied verbatim into the
 * admin panel repo, same policy as rich-text.tsx.
 *
 * Storage: a locale variant for image field `foo` lives on the SIBLING key
 * `fooI18n`, next to the base value — never inside the translation bundle.
 * `en` is the base key itself and is NEVER a valid map key (English is not an
 * "override"). An absent locale key means "no override, fall back to base".
 *
 *   { "logoImage": "https://cdn/logo-en.png", "logoImageI18n": { "id": "https://cdn/logo-id.png" } }
 */

export const I18N_SUFFIX = "I18n";

export const DEFAULT_LOCALE = "en";

/** Overlay locales — same list as the translations pill (TranslationsPage.tsx
 *  LOCALES), i.e. every supported locale except the English base. */
export const OVERLAY_LOCALES: { code: string; label: string }[] = [
  { code: "id", label: "Bahasa (id)" },
  { code: "pt", label: "Português (pt)" },
  { code: "es", label: "Español (es)" },
];

/** Locale-keyed overrides for a sibling image field. `en` is never a key. */
export type ImageI18n = Partial<Record<string, string>>;

export const i18nKeyFor = (base: string): string => `${base}${I18N_SUFFIX}`;

/** `"logoImageI18n"` -> `"logoImage"`; null when `k` doesn't carry the suffix. */
export function baseKeyFor(k: string): string | null {
  return k.endsWith(I18N_SUFFIX) && k.length > I18N_SUFFIX.length
    ? k.slice(0, -I18N_SUFFIX.length)
    : null;
}

/** Absent, undefined, null, "" and whitespace-only are all "no override" —
 *  never render a blank/absent value as an image src. */
export function isUsableVariant(v: unknown): v is string {
  return typeof v === "string" && v.trim() !== "";
}

/**
 * Shape guard for a value found under a `*I18n`-suffixed key: a flat, non-array
 * object whose every key is a known non-English locale and every value is a
 * string. Both conditions are required so real content shaped like
 * `{ id: "x" }` is never mistaken for an override map.
 */
export function isImageI18nMap(
  v: unknown,
  locales: readonly string[],
  defaultLocale: string,
): v is Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const keys = Object.keys(v as Record<string, unknown>);
  if (keys.length === 0) return false;
  return keys.every(
    (k) =>
      k !== defaultLocale &&
      locales.includes(k) &&
      typeof (v as Record<string, unknown>)[k] === "string",
  );
}
