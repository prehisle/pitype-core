import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { languages, type Language } from '../language';

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => void;
  getText: (path: string) => string;
  getLanguage: () => Language;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>(() => {
    return localStorage.getItem('language') || 'zh-CN';
  });

  const setLocale = useCallback((newLocale: string) => {
    setLocaleState(newLocale);
    localStorage.setItem('language', newLocale);
    const lang = languages[newLocale];
    if (lang) {
      document.documentElement.lang = lang.htmlLang;
      document.title = lang.ui.title;
    }
  }, []);

  const getText = useCallback(
    (path: string): string => {
      const keys = path.split('.');
      let result: any = languages[locale];

      for (const key of keys) {
        if (result && typeof result === 'object') {
          result = result[key];
        } else {
          console.warn(`Missing translation key: ${path}`);
          return path;
        }
      }

      return String(result || path);
    },
    [locale]
  );

  const getLanguage = useCallback((): Language => {
    return languages[locale];
  }, [locale]);

  // 初始化时应用语言
  useEffect(() => {
    const lang = languages[locale];
    if (lang) {
      document.documentElement.lang = lang.htmlLang;
      document.title = lang.ui.title;
    }
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, getText, getLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
