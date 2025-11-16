import { memo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const themes = [
  { name: 'dracula', label: 'Dracula' },
  { name: 'serika', label: 'Serika' },
  { name: 'botanical', label: 'Botanical' },
  { name: 'aether', label: 'Aether' },
  { name: 'nord', label: 'Nord' }
] as const;

export const ThemeSelector = memo(() => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-selector">
      {themes.map((t) => (
        <div
          key={t.name}
          className={`theme-option theme-${t.name} ${theme === t.name ? 'active' : ''}`}
          data-theme={t.name}
          title={t.label}
          onClick={() => setTheme(t.name)}
        />
      ))}
    </div>
  );
});

ThemeSelector.displayName = 'ThemeSelector';
