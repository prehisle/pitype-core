import { memo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../language';

export const LanguageSelector = memo(() => {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="language-selector">
      {Object.entries(languages).map(([code, lang]) => (
        <div
          key={code}
          className={`language-option ${locale === code ? 'active' : ''}`}
          data-lang={code}
          onClick={() => setLocale(code)}
        >
          {lang.shortCode}
        </div>
      ))}
    </div>
  );
});

LanguageSelector.displayName = 'LanguageSelector';
