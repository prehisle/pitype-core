const LANGUAGE_STORAGE_KEY = 'language';
const DEFAULT_LANGUAGE = 'zh-CN';

export function getActiveLanguage(): string {
  return localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE;
}

export interface LanguageSelectorOptions {
  applyLanguage?: (lang: string) => void;
  updatePageText?: () => void;
}

interface WindowWithHelpers extends Window {
  applyLanguage?: (lang: string) => void;
  updatePageText?: () => void;
}

export function initLanguageSelector({
  applyLanguage = typeof window !== 'undefined'
    ? (window as WindowWithHelpers).applyLanguage
    : undefined,
  updatePageText = typeof window !== 'undefined'
    ? (window as WindowWithHelpers).updatePageText
    : undefined
}: LanguageSelectorOptions = {}): void {
  const options = document.querySelectorAll('.pitype-language-option');
  if (!options.length) return;

  const safeApplyLanguage = typeof applyLanguage === 'function' ? applyLanguage : () => {};
  const safeUpdatePageText = typeof updatePageText === 'function' ? updatePageText : () => {};

  let currentLanguage = getActiveLanguage();
  syncActiveClass(options, currentLanguage);

  options.forEach((option) => {
    option.addEventListener('click', () => {
      const lang = option.getAttribute('data-lang');
      if (!lang || lang === currentLanguage) return;

      currentLanguage = lang;
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      safeApplyLanguage(lang);
      safeUpdatePageText();
      syncActiveClass(options, currentLanguage);
    });
  });
}

function syncActiveClass(options: NodeListOf<Element>, activeLanguage: string): void {
  options.forEach((option) => {
    const lang = option.getAttribute('data-lang');
    if (lang === activeLanguage) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}
