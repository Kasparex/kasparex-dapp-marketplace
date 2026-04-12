'use client';

import { useCallback } from 'react';
import { useRequestHost } from '@/components/CanonicalNavContext';
import { resolveSidebarNavHref } from '@/lib/config/sectionHosts';

export function useResolveSidebarNavHref() {
  const host = useRequestHost();
  return useCallback(
    (path: string) => resolveSidebarNavHref(path, host ?? undefined),
    [host]
  );
}
