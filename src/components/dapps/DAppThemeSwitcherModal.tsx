'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DApp } from '@/lib/dapps';
import { useTheme } from '@/components/ThemeProvider';

interface DAppThemeSwitcherModalProps {
  dapp: DApp;
  isOpen: boolean;
  onClose: () => void;
}

export function DAppThemeSwitcherModal({ 
  dapp, 
  isOpen, 
  onClose
}: DAppThemeSwitcherModalProps) {
  const { theme, toggleTheme } = useTheme();
  // Map kaspa theme to dark for display
  const getDisplayTheme = (t: typeof theme): 'light' | 'dark' => {
    return t === 'kaspa' ? 'dark' : t;
  };
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>(getDisplayTheme(theme));

  // Sync with global theme
  useEffect(() => {
    setSelectedTheme(getDisplayTheme(theme));
  }, [theme]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleThemeSelect = (newTheme: 'light' | 'dark') => {
    setSelectedTheme(newTheme);
    // Use global theme toggle to change entire page theme
    // If current theme is kaspa, we need to toggle appropriately
    const currentDisplayTheme = getDisplayTheme(theme);
    if (newTheme !== currentDisplayTheme) {
      toggleTheme();
    }
  };

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Page Theme
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <p className="kx-body mb-4">
              Choose a theme for the entire page. This will change the appearance of all components.
            </p>

            <div className="space-y-3">
              {/* Light Theme Option */}
              <button
                onClick={() => handleThemeSelect('light')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTheme === 'light'
                    ? 'border-[#02abb8] bg-[#02abb8]/10 dark:bg-[#02abb8]/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white border-2 border-zinc-200 flex items-center justify-center">
                      <svg className="w-6 h-6 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">Light Theme</div>
                      <div className="kx-body">Clean and bright appearance</div>
                    </div>
                  </div>
                  {selectedTheme === 'light' && (
                    <svg className="w-5 h-5 text-[#02abb8]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>

              {/* Dark Theme Option */}
              <button
                onClick={() => handleThemeSelect('dark')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTheme === 'dark'
                    ? 'border-[#02abb8] bg-[#02abb8]/10 dark:bg-[#02abb8]/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center">
                      <svg className="w-6 h-6 text-zinc-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">Dark Theme</div>
                      <div className="kx-body">Easy on the eyes</div>
                    </div>
                  </div>
                  {selectedTheme === 'dark' && (
                    <svg className="w-5 h-5 text-[#02abb8]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium text-base"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}

