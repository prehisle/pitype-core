const THEME_STORAGE_KEY = 'theme';
const DEFAULT_THEME = 'dracula';
const KNOWN_THEMES = ['dracula', 'serika', 'botanical', 'aether', 'nord'] as const;

type Theme = typeof KNOWN_THEMES[number];

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return (KNOWN_THEMES.includes(stored as Theme) ? stored : DEFAULT_THEME) as Theme;
}

export function applyTheme(theme: string): void {
  const normalized: Theme = KNOWN_THEMES.includes(theme as Theme)
    ? (theme as Theme)
    : DEFAULT_THEME;

  document.body.classList.remove(
    'theme-dracula',
    'theme-serika',
    'theme-botanical',
    'theme-aether',
    'theme-nord'
  );

  if (normalized !== DEFAULT_THEME) {
    document.body.classList.add(`theme-${normalized}`);
  }
}

export function initThemeSelector(): void {
  const themeOptions = document.querySelectorAll('.theme-option');
  if (!themeOptions.length) return;

  let currentTheme = getStoredTheme();
  applyTheme(currentTheme);
  syncActiveClass(themeOptions, currentTheme);

  themeOptions.forEach((option) => {
    option.addEventListener('click', () => {
      const theme = option.getAttribute('data-theme');
      if (!theme || theme === currentTheme) return;

      currentTheme = theme as Theme;
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
      applyTheme(currentTheme);
      syncActiveClass(themeOptions, currentTheme);
    });
  });
}

function syncActiveClass(options: NodeListOf<Element>, activeTheme: string): void {
  options.forEach((option) => {
    const theme = option.getAttribute('data-theme');
    if (theme === activeTheme) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}
