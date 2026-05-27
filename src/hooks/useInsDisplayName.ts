'use client';

import { useMemo } from 'react';
import { useInsOwnedNames } from '@/hooks/useInsOwnedNames';
import { useInsPrimaryName } from '@/hooks/useInsPrimaryName';

/** Best display label: reverse primary, else first owned .igra name. */
export function useInsDisplayName(
  evmAddress: string | null | undefined,
  opts?: { enabled?: boolean },
) {
  const { primaryName, isLoading: isPrimaryLoading } = useInsPrimaryName(evmAddress, opts);
  const { names, primaryName: ownedPrimary, isLoading: isOwnedLoading } = useInsOwnedNames(evmAddress, opts);

  const displayName = useMemo(() => {
    return (
      primaryName ||
      ownedPrimary ||
      (names[0]?.name ? String(names[0].name).toLowerCase() : null)
    );
  }, [primaryName, ownedPrimary, names]);

  return {
    displayName,
    primaryName: displayName,
    names,
    isLoading: isPrimaryLoading || isOwnedLoading,
    hasIns: Boolean(displayName || names.length > 0),
  };
}
