'use client';

import type { ReactNode } from 'react';

export type KxTabStripOption<T extends string = string> = {
  value: T;
  label?: string;
  icon?: ReactNode;
  title?: string;
  ariaLabel?: string;
};

export function kxTabBtnClass(active: boolean, iconOnly = false) {
  return `k-tab-btn${iconOnly ? ' k-tab-btn-icon' : ''}${active ? ' k-tab-btn-active' : ''}`;
}

export function kxGamesTabBtnClass(active: boolean) {
  return `k-tab-btn${active ? ' k-games-tab-btn-active' : ''}`;
}

export function KxTabStrip<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className = '',
  fullWidth = false,
  iconOnly = false,
  scrollable = false,
}: {
  value: T;
  onChange: (next: T) => void;
  options: KxTabStripOption<T>[];
  ariaLabel?: string;
  className?: string;
  fullWidth?: boolean;
  iconOnly?: boolean;
  scrollable?: boolean;
}) {
  return (
    <div
      className={[
        'k-control-group flex flex-nowrap items-stretch shrink-0',
        fullWidth ? 'w-full min-w-0' : 'w-fit',
        scrollable
          ? 'overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={kxTabBtnClass(active, iconOnly)}
            title={option.title ?? option.label}
            aria-label={option.ariaLabel ?? option.label ?? option.title}
            aria-pressed={active}
          >
            {option.icon ?? option.label}
          </button>
        );
      })}
    </div>
  );
}
