export type Theme = 'light' | 'dark' | 'kaspa';

export const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('theme') as Theme;
  return stored || 'dark';
};

export const setStoredTheme = (theme: Theme): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('theme', theme);
};

export const applyTheme = (theme: Theme): void => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  
  // Remove all theme classes
  root.classList.remove('dark', 'kaspa');
  
  // Add appropriate theme class
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'kaspa') {
    root.classList.add('kaspa');
  }
};

