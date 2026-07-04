'use client';

import { useMemo, useState } from 'react';
import { KxFormSelect } from '@/components/ui/KxFormSelect';
import { KX_FORM_ADD_BTN_CLASS } from '@/components/ui/KxLinkRowsEditor';
import {
  addAuthorCustomTokenCategory,
  getTokenCategoryOptionsForAuthor,
  normalizeTokenCategoryName,
  validateTokenCategoryName,
} from '@/lib/tokens/categories';

type TokenCategoryFieldProps = {
  authorAddress: string | null;
  value: string;
  onChange: (category: string) => void;
  disabled?: boolean;
};

export function TokenCategoryField({ authorAddress, value, onChange, disabled }: TokenCategoryFieldProps) {
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [optionsTick, setOptionsTick] = useState(0);

  const options = useMemo(
    () => getTokenCategoryOptionsForAuthor(authorAddress),
    [authorAddress, optionsTick],
  );

  const handleAddCustom = () => {
    if (!authorAddress) {
      setCustomError('Connect your wallet to create custom categories');
      return;
    }
    const validation = validateTokenCategoryName(customInput);
    if (!validation.valid) {
      setCustomError(validation.error ?? 'Invalid category');
      return;
    }
    try {
      const saved = addAuthorCustomTokenCategory(authorAddress, customInput);
      onChange(saved);
      setCustomInput('');
      setCustomError(null);
      setOptionsTick((t) => t + 1);
    } catch (e) {
      setCustomError(e instanceof Error ? e.message : 'Could not save category');
    }
  };

  return (
    <div className="space-y-2">
      <KxFormSelect
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        ariaLabel="Token category"
        triggerClassName="!h-[3.375rem] !py-0 flex items-center"
        options={options.map((cat) => ({ value: cat, label: cat }))}
      />
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-stretch">
        <input
          type="text"
          value={customInput}
          onChange={(e) => {
            setCustomInput(e.target.value);
            setCustomError(null);
          }}
          placeholder="Create custom category"
          className="k-input flex-1"
          disabled={disabled}
          maxLength={40}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustom();
            }
          }}
        />
        <button
          type="button"
          onClick={handleAddCustom}
          disabled={disabled || !normalizeTokenCategoryName(customInput)}
          className={`${KX_FORM_ADD_BTN_CLASS} shrink-0 whitespace-nowrap`}
        >
          Add category
        </button>
      </div>
      {customError ? <p className="text-xs text-red-500 dark:text-red-400">{customError}</p> : null}
    </div>
  );
}
