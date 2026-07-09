export const locales = ["vi", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "vi";

export function isSupportedLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}
