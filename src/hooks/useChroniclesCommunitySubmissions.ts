'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listCommunitySubmissions,
  type ChroniclesCommunitySubmission,
  type ChroniclesContentKind,
} from '@/lib/chronicles/communitySubmissions';

export function useChroniclesCommunitySubmissions(filter?: {
  kind?: ChroniclesContentKind;
  authorAddress?: string;
}) {
  const [items, setItems] = useState<ChroniclesCommunitySubmission[]>([]);

  const refresh = useCallback(() => {
    setItems(listCommunitySubmissions(filter));
  }, [filter?.kind, filter?.authorAddress]);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener('chronicles-community-updated', onUpdate);
    return () => window.removeEventListener('chronicles-community-updated', onUpdate);
  }, [refresh]);

  return { items, refresh };
}
