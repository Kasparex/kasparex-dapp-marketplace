'use client';

import {
  HubPaymentCurrencyDropdown,
  type HubPaymentCurrencyMenuOption,
} from '@/components/payments/HubPaymentCurrencyDropdown';

const STORE_FORM_BUTTON_CLASS =
  'k-input flex min-h-0 w-full items-center justify-between gap-2 !py-3 text-left font-medium';

/** Store-scoped payment currency picker: Kasparex Store accent + form control height. */
export function StorePaymentCurrencyDropdown<T extends string = string>({
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
  return (
    <HubPaymentCurrencyDropdown
      value={value}
      onChange={onChange}
      options={options}
      ariaLabel={ariaLabel}
      className={className ?? 'w-full min-w-0'}
      align={align}
      accent="store"
      buttonClassName={STORE_FORM_BUTTON_CLASS}
    />
  );
}
