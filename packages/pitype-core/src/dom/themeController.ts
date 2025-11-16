type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const DEFAULT_THEMES = ['dracula', 'serika', 'botanical', 'aether', 'nord'];

export interface DomThemeControllerOptions {
  themes?: string[];
  defaultTheme?: string;
  storageKey?: string;
  storage?: StorageLike;
  documentRef?: Pick<Document, 'querySelectorAll'>;
  target?: Element;
  selector?: string;
  onThemeChange?: (theme: string) => void;
}

export interface DomThemeController {
  getActiveTheme(): string;
  applyTheme(theme: string): string;
  init(): () => void;
}

export function createDomThemeController(
  options: DomThemeControllerOptions = {}
): DomThemeController {
  const documentRef =
    options.documentRef ?? (typeof document !== 'undefined' ? document : undefined);
  const storage: StorageLike | undefined =
    options.storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
  const selector = options.selector ?? '.theme-option';
  const target = options.target ?? (typeof document !== 'undefined' ? document.body : undefined);

  const themes = normalizeThemes(options.themes);
  const defaultTheme = normalizeDefaultTheme(options.defaultTheme, themes);
  const storageKey = options.storageKey ?? 'theme';

  let mountedElements: Element[] = [];
  let activeTheme = getStoredTheme();

  function getStoredTheme(): string {
    const stored = storage?.getItem(storageKey);
    return isValidTheme(stored, themes) ? (stored as string) : defaultTheme;
  }

  function persistTheme(theme: string): void {
    storage?.setItem(storageKey, theme);
  }

  function getThemeElements(): Element[] {
    if (!documentRef || typeof documentRef.querySelectorAll !== 'function') {
      return [];
    }
    const nodes = documentRef.querySelectorAll(selector);
    return Array.from(nodes);
  }

  function applyThemeInternal(theme: string): string {
    const normalized = isValidTheme(theme, themes) ? theme : defaultTheme;

    if (target?.classList) {
      themes.forEach((name) => target.classList!.remove(`theme-${name}`));
      if (normalized !== defaultTheme) {
        target.classList.add(`theme-${normalized}`);
      }
    }

    options.onThemeChange?.(normalized);
    return normalized;
  }

  function syncActiveClass(elements: Element[], theme: string): void {
    elements.forEach((element) => {
      const itemTheme = element.getAttribute?.('data-theme');
      if (!itemTheme || !element.classList) return;
      if (itemTheme === theme) {
        element.classList.add('active');
      } else {
        element.classList.remove('active');
      }
    });
  }

  function applyThemePublic(theme: string): string {
    activeTheme = applyThemeInternal(theme);
    persistTheme(activeTheme);
    if (mountedElements.length === 0) {
      mountedElements = getThemeElements();
    }
    syncActiveClass(mountedElements, activeTheme);
    return activeTheme;
  }

  function init(): () => void {
    mountedElements = getThemeElements();
    activeTheme = applyThemeInternal(getStoredTheme());
    syncActiveClass(mountedElements, activeTheme);

    const listeners = mountedElements.map((element) => {
      const handler = () => {
        const theme = element.getAttribute?.('data-theme') ?? undefined;
        if (!theme || theme === activeTheme) return;
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

function normalizeThemes(themes?: string[]): string[] {
  if (themes && themes.length > 0) {
    return Array.from(new Set(themes));
  }
  return [...DEFAULT_THEMES];
}

function normalizeDefaultTheme(defaultTheme: string | undefined, themes: string[]): string {
  if (defaultTheme && isValidTheme(defaultTheme, themes)) {
    return defaultTheme;
  }
  return themes[0];
}

function isValidTheme(theme: string | null | undefined, themes: string[]): theme is string {
  if (!theme) return false;
  return themes.includes(theme);
}
