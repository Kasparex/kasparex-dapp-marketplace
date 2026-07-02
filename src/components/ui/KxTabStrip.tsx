'use client';

import type { ReactNode } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

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
        const tooltipLabel = option.title ?? option.ariaLabel ?? option.label;
        const button = (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={kxTabBtnClass(active, iconOnly)}
            aria-label={option.ariaLabel ?? option.label ?? option.title}
            aria-pressed={active}
          >
            {option.icon ?? option.label}
          </button>
        );

        // Icon-only tabs have no visible label, so always surface the unified tooltip.
        // Labelled tabs opt in by providing an explicit `title` (short helper text).
        const showTooltip = iconOnly ? Boolean(tooltipLabel) : Boolean(option.title);
        if (showTooltip && tooltipLabel) {
          return (
            <Tooltip key={option.value} content={tooltipLabel}>
              {button}
            </Tooltip>
          );
        }

        return button;
      })}
    </div>
  );
}
