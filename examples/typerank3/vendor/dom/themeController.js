const DEFAULT_THEMES = ['dracula', 'serika', 'botanical', 'aether', 'nord'];
export function createDomThemeController(options = {}) {
    const documentRef = options.documentRef ?? (typeof document !== 'undefined' ? document : undefined);
    const storage = options.storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    const selector = options.selector ?? '.theme-option';
    const target = options.target ?? (typeof document !== 'undefined' ? document.body : undefined);
    const themes = normalizeThemes(options.themes);
    const defaultTheme = normalizeDefaultTheme(options.defaultTheme, themes);
    const storageKey = options.storageKey ?? 'theme';
    let mountedElements = [];
    let activeTheme = getStoredTheme();
    function getStoredTheme() {
        const stored = storage?.getItem(storageKey);
        return isValidTheme(stored, themes) ? stored : defaultTheme;
    }
    function persistTheme(theme) {
        storage?.setItem(storageKey, theme);
    }
    function getThemeElements() {
        if (!documentRef || typeof documentRef.querySelectorAll !== 'function') {
            return [];
        }
        const nodes = documentRef.querySelectorAll(selector);
        return Array.from(nodes);
    }
    function applyThemeInternal(theme) {
        const normalized = isValidTheme(theme, themes) ? theme : defaultTheme;
        if (target?.classList) {
            themes.forEach((name) => target.classList.remove(`theme-${name}`));
            if (normalized !== defaultTheme) {
                target.classList.add(`theme-${normalized}`);
            }
        }
        options.onThemeChange?.(normalized);
        return normalized;
    }
    function syncActiveClass(elements, theme) {
        elements.forEach((element) => {
            const itemTheme = element.getAttribute?.('data-theme');
            if (!itemTheme || !element.classList)
                return;
            if (itemTheme === theme) {
                element.classList.add('active');
            }
            else {
                element.classList.remove('active');
            }
        });
    }
    function applyThemePublic(theme) {
        activeTheme = applyThemeInternal(theme);
        persistTheme(activeTheme);
        if (mountedElements.length === 0) {
            mountedElements = getThemeElements();
        }
        syncActiveClass(mountedElements, activeTheme);
        return activeTheme;
    }
    function init() {
        mountedElements = getThemeElements();
        activeTheme = applyThemeInternal(getStoredTheme());
        syncActiveClass(mountedElements, activeTheme);
        const listeners = mountedElements.map((element) => {
            const handler = () => {
                const theme = element.getAttribute?.('data-theme') ?? undefined;
                if (!theme || theme === activeTheme)
                    return;
                activeTheme = applyThemeInternal(theme);
                persistTheme(activeTheme);
                syncActiveClass(mountedElements, activeTheme);
            };
            element.addEventListener?.('click', handler);
            return () => element.removeEventListener?.('click', handler);
        });
        return () => {
            listeners.forEach((unsubscribe) => unsubscribe());
            mountedElements = [];
        };
    }
    return {
        getActiveTheme: () => activeTheme,
        applyTheme: applyThemePublic,
        init
    };
}
function normalizeThemes(themes) {
    if (themes && themes.length > 0) {
        return Array.from(new Set(themes));
    }
    return [...DEFAULT_THEMES];
}
function normalizeDefaultTheme(defaultTheme, themes) {
    if (defaultTheme && isValidTheme(defaultTheme, themes)) {
        return defaultTheme;
    }
    return themes[0];
}
function isValidTheme(theme, themes) {
    if (!theme)
        return false;
    return themes.includes(theme);
}
