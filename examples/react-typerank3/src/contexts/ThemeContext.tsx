import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ThemeName = 'dracula' | 'serika' | 'botanical' | 'aether' | 'nord';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return (localStorage.getItem('theme') as ThemeName) || 'dracula';
  });

  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // 更新 body class
    document.body.className = '';
    if (newTheme !== 'dracula') {
      document.body.classList.add(`theme-${newTheme}`);
    }
  }, []);

  // 初始化时应用主题
  useEffect(() => {
    document.body.className = '';
    if (theme !== 'dracula') {
      document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
