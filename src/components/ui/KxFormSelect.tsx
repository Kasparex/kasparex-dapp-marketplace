'use client';

import { KxFormDropdown, type KxFormDropdownOption } from '@/components/ui/KxFormDropdown';

type KxFormSelectProps = {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  options: KxFormDropdownOption[];
  disabled?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
};

/** Form select with custom menu styling (accent hover + selection states). */
export function KxFormSelect({
  value,
  onChange,
  options,
  disabled,
  ariaLabel = 'Select option',
  placeholder,
  className,
  triggerClassName,
}: KxFormSelectProps) {
  return (
    <KxFormDropdown
      ariaLabel={ariaLabel}
      value={value}
      onChange={(next) => onChange({ target: { value: next } })}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      triggerClassName={triggerClassName}
    />
  );
}
