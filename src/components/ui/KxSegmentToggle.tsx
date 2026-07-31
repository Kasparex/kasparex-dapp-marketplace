'use client';

import { KxTabStrip, type KxTabStripOption } from '@/components/ui/KxTabStrip';

export type KxSegmentToggleOption<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
  title?: string;
};

export function KxSegmentToggle<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className = '',
}: {
  value: T;
  onChange: (next: T) => void;
  options: KxSegmentToggleOption<T>[];
  ariaLabel?: string;
  className?: string;
}) {
  const tabOptions: KxTabStripOption<T>[] = options.map((option) => ({
    value: option.value,
    label: option.label,
    disabled: option.disabled,
    title: option.title,
  }));

  return (
    <KxTabStrip
      value={value}
      onChange={onChange}
      options={tabOptions}
      ariaLabel={ariaLabel}
      className={className}
      fullWidth
    />
  );
}
