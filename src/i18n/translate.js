import { languages, messages } from "./messages";

export const DEFAULT_LOCALE = "en";
export const locales = Object.keys(languages);

/** First supported language in the browser's preferences, or English. */
export const detectLocale = (preferred = []) =>
  preferred.map((tag) => tag.toLowerCase().split("-")[0]).find((code) => locales.includes(code)) ??
  DEFAULT_LOCALE;

/**
 * Returns t(key, vars): looks the key up in the locale (falling back to
 * English, then to the key itself), picks the plural form from vars.count and
 * fills {placeholders}. Numbers are formatted for the locale.
 */
export const createTranslator = (locale) => {
  const dictionary = messages[locale] ?? messages[DEFAULT_LOCALE];
  const pluralRules = new Intl.PluralRules(locale);
  const numberFormat = new Intl.NumberFormat(locale);

  const format = (value) => (typeof value === "number" ? numberFormat.format(value) : String(value));

  return (key, vars = {}) => {
    let message = dictionary[key] ?? messages[DEFAULT_LOCALE][key] ?? key;
    if (typeof message === "object") {
      message = message[pluralRules.select(vars.count ?? 0)] ?? message.other;
    }
    return message.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? format(vars[name]) : match));
  };
};

/** Splits "a <b>b</b> c" into ["a ", { tag: "b", text: "b" }, " c"]. */
export const parseRichText = (text) => {
  const parts = [];
  const pattern = /<(\w+)>(.*?)<\/\1>/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push({ tag: match[1], text: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};
