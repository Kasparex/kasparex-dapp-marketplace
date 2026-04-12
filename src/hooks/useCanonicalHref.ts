'use client';

import { useRequestHost } from '@/components/CanonicalNavContext';
import { canonicalAppHref } from '@/lib/config/sectionHosts';

export function useCanonicalHref(path: string): string {
  const host = useRequestHost();
  return canonicalAppHref(path, host ?? undefined);
}
