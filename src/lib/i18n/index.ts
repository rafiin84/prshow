import { catalogues, en, type MessageKey } from "./messages";

let locale = "en";
export const setLocale = (l: string) => { if (catalogues[l]) locale = l; };
/** Look up a user-facing string; falls back to English when a translation is missing. */
export function t(key: MessageKey): string {
  return catalogues[locale]?.[key] ?? en[key];
}
export type { MessageKey };
