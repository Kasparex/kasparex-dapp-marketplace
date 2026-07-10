'use client';

import { GameCurrencyMenu } from '@/components/games/shop/GameCurrencyMenu';

export type HubPaymentCurrencyMenuOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

/** Standard Hub payment currency picker (dropdown button, not inline toggles). */
export function HubPaymentCurrencyDropdown({
  value,
  onChange,
  options,
  ariaLabel = 'Payment currency',
  className,
  align,
}: {
  value: string;
  onChange: (next: string) => void;
  options: HubPaymentCurrencyMenuOption[];
  ariaLabel?: string;
  className?: string;
  align?: 'left' | 'right';
}) {
  if (options.length <= 1) return null;

  return (
    <GameCurrencyMenu
      value={value}
      onChange={onChange}
      options={options}
      ariaLabel={ariaLabel}
      className={className ?? 'w-full min-w-0'}
      align={align}
    />
  );
}
