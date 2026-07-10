'use client';

import { GameCurrencyMenu } from '@/components/games/shop/GameCurrencyMenu';

export type HubPaymentCurrencyMenuOption<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

/** Standard Hub payment currency picker (dropdown button, not inline toggles). */
export function HubPaymentCurrencyDropdown<T extends string = string>({
  value,
  onChange,
  options,
  ariaLabel = 'Payment currency',
  className,
  align,
}: {
  value: T;
  onChange: (next: T) => void;
  options: HubPaymentCurrencyMenuOption<T>[];
  ariaLabel?: string;
  className?: string;
  align?: 'left' | 'right';
}) {
  if (options.length <= 1) return null;

  return (
    <GameCurrencyMenu
      value={value}
      onChange={(next) => onChange(next as T)}
      options={options}
      ariaLabel={ariaLabel}
      className={className ?? 'w-full min-w-0'}
      align={align}
    />
  );
}
