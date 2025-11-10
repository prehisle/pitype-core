const localeRegistry = new Map();
export function registerLocale(locale) {
    localeRegistry.set(locale.code, locale);
}
export function getLocale(code) {
    return localeRegistry.get(code);
}
export function getLocaleString(code, key) {
    const visited = new Set();
    let currentCode = code;
    while (currentCode) {
        if (visited.has(currentCode))
            break;
        visited.add(currentCode);
        const locale = localeRegistry.get(currentCode);
        if (!locale)
            break;
        if (locale.strings[key] !== undefined) {
            return locale.strings[key];
        }
        currentCode = locale.fallbackCode;
    }
    return undefined;
}
export function clearLocales() {
    localeRegistry.clear();
}
