'use client';

import { useMemo } from 'react';
import { useIPFSContent } from '@/lib/ipfs/hooks';
import { composeIssueFromManifest, type ComposedSection } from '@/lib/magazines/composeIssue';
import { getFallbackManifestForIssue } from '@/lib/magazines/fallbackManifests';
import { normalizeManifest } from '@/lib/magazines/manifest';
import type { MagazineIssue } from '@/lib/magazines/types';

export function useIssueManifest(issue: MagazineIssue | null) {
  const { data: ipfsRaw, isLoading, error } = useIPFSContent<unknown>(issue?.cid);

  const manifest = useMemo(() => {
    if (!issue) return null;
    const fromIpfs = normalizeManifest(ipfsRaw);
    if (fromIpfs) return fromIpfs;
    return getFallbackManifestForIssue(issue.id);
  }, [issue, ipfsRaw]);

  const composedSections: ComposedSection[] = useMemo(() => {
    if (!manifest) return [];
    return composeIssueFromManifest(manifest);
  }, [manifest]);

  const usingFallback = Boolean(issue && !normalizeManifest(ipfsRaw) && getFallbackManifestForIssue(issue.id));

  return {
    manifest,
    composedSections,
    isLoading: Boolean(issue?.cid) && isLoading && !manifest,
    error,
    usingFallback,
  };
}
