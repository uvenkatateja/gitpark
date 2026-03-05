/**
 * Theme Context and Hook
 * Manages theme state and persistence
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getTheme, DEFAULT_THEME_ID, type ParkingTheme } from './themes';

interface ThemeContextType {
  currentTheme: ParkingTheme;
  themeId: string;
  setTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'repo-ridez-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Load theme from localStorage or use default
  const [themeId, setThemeId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved || DEFAULT_THEME_ID;
    }
    return DEFAULT_THEME_ID;
  });

  const currentTheme = getTheme(themeId);

  const setTheme = (newThemeId: string) => {
    setThemeId(newThemeId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newThemeId);
    }
  };

  // Update document background color to match theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.style.backgroundColor = currentTheme.fog.color;
    }
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, themeId, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
