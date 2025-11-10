export interface Locale {
  code: string;
  strings: Record<string, string>;
  fallbackCode?: string;
}

const localeRegistry = new Map<string, Locale>();

export function registerLocale(locale: Locale): void {
  localeRegistry.set(locale.code, locale);
}

export function getLocale(code: string): Locale | undefined {
  return localeRegistry.get(code);
}

export function getLocaleString(code: string, key: string): string | undefined {
  const visited = new Set<string>();
  let currentCode: string | undefined = code;

  while (currentCode) {
    if (visited.has(currentCode)) break;
    visited.add(currentCode);

    const locale = localeRegistry.get(currentCode);
    if (!locale) break;

    if (locale.strings[key] !== undefined) {
      return locale.strings[key];
    }

    currentCode = locale.fallbackCode;
  }

  return undefined;
}

export function clearLocales(): void {
  localeRegistry.clear();
}
