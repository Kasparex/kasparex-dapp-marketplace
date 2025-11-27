'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Theme } from '@/lib/theme';
import { getStoredTheme, setStoredTheme, applyTheme } from '@/lib/theme';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Initialize theme from localStorage on mount
    const storedTheme = getStoredTheme();
    setTheme(storedTheme);
    applyTheme(storedTheme);
  }, []);

  const toggleTheme = () => {
    // Cycle through: dark → light (Kaspa theme disabled)
    let newTheme: Theme;
    if (theme === 'dark') {
      newTheme = 'light';
    } else {
      newTheme = 'dark';
    }
    setTheme(newTheme);
    setStoredTheme(newTheme);
    applyTheme(newTheme);
  };

  // Always provide the context to prevent errors
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

