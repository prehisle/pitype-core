// 负责语言选项的 UI 状态，并委托 language.js 暴露的全局方法
const LANGUAGE_STORAGE_KEY = 'language';
const DEFAULT_LANGUAGE = 'zh-CN';

export function getActiveLanguage() {
  return localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE;
}

export function initLanguageSelector({
  applyLanguage = typeof window !== 'undefined' ? window.applyLanguage : undefined,
  updatePageText = typeof window !== 'undefined' ? window.updatePageText : undefined
} = {}) {
  const options = document.querySelectorAll('.language-option');
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

function syncActiveClass(options, activeLanguage) {
  options.forEach((option) => {
    const lang = option.getAttribute('data-lang');
    if (lang === activeLanguage) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}
