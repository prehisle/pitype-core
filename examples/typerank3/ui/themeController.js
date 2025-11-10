// 控制主题选择器的状态同步与样式切换
const THEME_STORAGE_KEY = 'theme';
const DEFAULT_THEME = 'dracula';
const KNOWN_THEMES = ['dracula', 'serika', 'botanical', 'aether', 'nord'];

export function getStoredTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
}

export function applyTheme(theme) {
  const normalized = KNOWN_THEMES.includes(theme) ? theme : DEFAULT_THEME;
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

export function initThemeSelector() {
  const themeOptions = document.querySelectorAll('.theme-option');
  if (!themeOptions.length) return;

  let currentTheme = getStoredTheme();
  applyTheme(currentTheme);
  syncActiveClass(themeOptions, currentTheme);

  themeOptions.forEach((option) => {
    option.addEventListener('click', () => {
      const theme = option.getAttribute('data-theme');
      if (!theme || theme === currentTheme) return;
      currentTheme = theme;
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
      applyTheme(currentTheme);
      syncActiveClass(themeOptions, currentTheme);
    });
  });
}

function syncActiveClass(options, activeTheme) {
  options.forEach((option) => {
    const theme = option.getAttribute('data-theme');
    if (theme === activeTheme) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}
