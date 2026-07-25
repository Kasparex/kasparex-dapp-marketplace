'use client';

import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleSwitchProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          focus:outline-none focus:ring-2 focus:ring-[color:var(--hub-accent)] focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-[color:var(--hub-accent)]' : 'bg-zinc-300 dark:bg-zinc-700'}
          ${disabled ? '' : 'cursor-pointer'}
        `}
        aria-label={label || 'Toggle'}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              className={`
                block text-sm font-medium
                ${disabled ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-700 dark:text-zinc-300'}
                cursor-pointer
              `}
              onClick={() => !disabled && onChange(!checked)}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

