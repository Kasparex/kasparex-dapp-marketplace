'use client';

import { getHubCharacterCount, hubCharCountClass } from '@/lib/hub/formLimits';

/** Inline `n / max` counter used on Hub dashboard text fields (vBlog pattern). */
export function KxFieldCharCount({
  value,
  max,
  min,
}: {
  value: string;
  max: number;
  /** When set, shows soft hint color until min is reached (optional). */
  min?: number;
}) {
  const count = getHubCharacterCount(value);
  const underMin = min != null && count > 0 && count < min;
  const className = underMin
    ? 'text-xs text-amber-600 dark:text-amber-400'
    : hubCharCountClass(count, max);

  return (
    <span className={className}>
      {count} / {max}
    </span>
  );
}
