export interface LocaleDefinition {
  code: string;
  fallbackCode?: string;
  strings: Record<string, string>;
}

const localeRegistry = new Map<string, LocaleDefinition>();

export function registerLocale(locale: LocaleDefinition): void {
  localeRegistry.set(locale.code, locale);
}

export function getLocale(code: string): LocaleDefinition | undefined {
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
