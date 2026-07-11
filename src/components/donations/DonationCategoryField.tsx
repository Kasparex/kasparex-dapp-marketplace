'use client';

import { KxFormSelect } from '@/components/ui/KxFormSelect';
import { DONATION_CATEGORIES } from '@/lib/donations/categories';

export function DonationCategoryField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (category: string) => void;
  disabled?: boolean;
}) {
  return (
    <KxFormSelect
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      ariaLabel="Campaign category"
      triggerClassName="!h-[3.375rem] !py-0 flex items-center"
      placeholder="Select category…"
      options={DONATION_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
    />
  );
}
