const LANGUAGE_STORAGE_KEY = 'language';
const DEFAULT_LANGUAGE = 'zh-CN';

function readLanguage(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE;
  } catch (error) {
    console.warn('读取语言失败:', error);
    return DEFAULT_LANGUAGE;
  }
}

function writeLanguage(lang: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (error) {
    console.warn('写入语言失败:', error);
  }
}

export function getActiveLanguage(): string {
  return readLanguage();
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
  if (typeof document === 'undefined') {
    return;
  }

  const options = document.querySelectorAll('.language-option');
  if (!options.length) return;

  const safeApplyLanguage = typeof applyLanguage === 'function' ? applyLanguage : () => {};
  const safeUpdatePageText = typeof updatePageText === 'function' ? updatePageText : () => {};

  let currentLanguage = readLanguage();
  syncActiveClass(options, currentLanguage);

  options.forEach((option) => {
    option.addEventListener('click', () => {
      const lang = option.getAttribute('data-lang');
      if (!lang || lang === currentLanguage) return;

      currentLanguage = lang;
      writeLanguage(lang);
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
