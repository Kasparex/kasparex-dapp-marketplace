'use client';

import { useMemo } from 'react';
import {
  KxMultiSelectDropdown,
  type KxMultiSelectOption,
} from '@/components/ui/KxMultiSelectDropdown';

function toOptions(
  values: string[] | KxMultiSelectOption[],
  labelFn?: (value: string) => string,
): KxMultiSelectOption[] {
  if (values.length > 0 && typeof values[0] === 'object') {
    return values as KxMultiSelectOption[];
  }
  return (values as string[]).map((value) => ({ value, label: labelFn ? labelFn(value) : value }));
}

export function HubCategoryMultiFilter({
  values,
  onChange,
  options,
  placeholder = 'Category',
  ariaLabel = 'Filter by category',
  filterPlaceholder = 'Filter categories…',
  triggerClassName = 'k-control-btn min-w-[140px] h-10',
}: {
  values: string[];
  onChange: (next: string[]) => void;
  options: string[] | KxMultiSelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  filterPlaceholder?: string;
  triggerClassName?: string;
}) {
  const selectOptions = useMemo(() => toOptions(options), [options]);

  return (
    <KxMultiSelectDropdown
      values={values}
      onChange={onChange}
      options={selectOptions}
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      filterPlaceholder={filterPlaceholder}
      showFilter
      triggerClassName={triggerClassName}
      menuClassName="w-64"
    />
  );
}

export function HubTagsMultiFilter({
  values,
  onChange,
  options,
  placeholder = 'Tags',
  ariaLabel = 'Filter by tags',
  filterPlaceholder = 'Filter tags…',
  triggerClassName = 'k-control-btn min-w-[140px] h-10',
}: {
  values: string[];
  onChange: (next: string[]) => void;
  options: string[];
  placeholder?: string;
  ariaLabel?: string;
  filterPlaceholder?: string;
  triggerClassName?: string;
}) {
  const selectOptions = useMemo(() => toOptions(options), [options]);

  return (
    <KxMultiSelectDropdown
      values={values}
      onChange={onChange}
      options={selectOptions}
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      filterPlaceholder={filterPlaceholder}
      showFilter
      triggerClassName={triggerClassName}
      menuClassName="w-64"
    />
  );
}

export function HubCryptocurrencyMultiFilter({
  values,
  onChange,
  options,
  placeholder = 'Cryptocurrency',
  ariaLabel = 'Filter by cryptocurrency',
  filterPlaceholder = 'Filter currencies…',
  triggerClassName = 'k-control-btn min-w-[160px] h-10',
}: {
  values: string[];
  onChange: (next: string[]) => void;
  options: string[];
  placeholder?: string;
  ariaLabel?: string;
  filterPlaceholder?: string;
  triggerClassName?: string;
}) {
  const selectOptions = useMemo(() => toOptions(options), [options]);

  return (
    <KxMultiSelectDropdown
      values={values}
      onChange={onChange}
      options={selectOptions}
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      filterPlaceholder={filterPlaceholder}
      showFilter
      triggerClassName={triggerClassName}
      menuClassName="w-64"
    />
  );
}
