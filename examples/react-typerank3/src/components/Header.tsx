import { memo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { ThemeSelector } from './ThemeSelector';

interface HeaderProps {
  onRestart: () => void;
}

export const Header = memo(({ onRestart }: HeaderProps) => {
  const { getText } = useLanguage();

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="title">TypeRank3 React</h1>
      </div>
      <div className="header-right">
        <LanguageSelector />
        <ThemeSelector />
        <button className="restart-button" onClick={onRestart} title={getText('ui.restart')}>
          <i className="fas fa-redo-alt"></i>
        </button>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
