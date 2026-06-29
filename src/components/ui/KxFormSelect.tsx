'use client';

import type { SelectHTMLAttributes } from 'react';

type KxFormSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
};

export function KxFormSelect({ options, className, ...props }: KxFormSelectProps) {
  return (
    <select
      {...props}
      className={`k-form-select ${className ?? ''}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
