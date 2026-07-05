'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listCommunitySubmissions,
  type ChroniclesCommunitySubmission,
  type ChroniclesContentKind,
} from '@/lib/chronicles/communitySubmissions';
import { bootstrapHubContent, onHubContentVisibilityRefresh } from '@/lib/hub/contentSync';

export function useChroniclesCommunitySubmissions(filter?: {
  kind?: ChroniclesContentKind;
  authorAddress?: string;
}) {
  const [items, setItems] = useState<ChroniclesCommunitySubmission[]>([]);

  const refresh = useCallback(() => {
    setItems(listCommunitySubmissions(filter));
  }, [filter?.kind, filter?.authorAddress]);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      await bootstrapHubContent(['chronicles']);
      if (!cancelled) refresh();
    };
    void bootstrap();
    const onUpdate = () => refresh();
    window.addEventListener('chronicles-community-updated', onUpdate);
    const stopVisibility = onHubContentVisibilityRefresh(() => refresh(), ['chronicles']);
    return () => {
      cancelled = true;
      window.removeEventListener('chronicles-community-updated', onUpdate);
      stopVisibility();
    };
  }, [refresh]);

  return { items, refresh };
}
