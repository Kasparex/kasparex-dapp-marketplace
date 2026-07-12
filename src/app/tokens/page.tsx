/**
 * Tokens Listing Page
 * Main page displaying all ecosystem tokens
 */

import { Suspense } from 'react';
import { TokensPageContent } from './TokensPageContent';
import { getAllTokens } from '@/lib/tokens/registry';
import { loadTokenWithMetadata } from '@/lib/tokens/metadata';

export const revalidate = 3600;

export default async function TokensPage() {
  const tokens = getAllTokens();
  const tokensWithMetadata = await Promise.all(
    tokens.map((token) => loadTokenWithMetadata(token))
  );

  return (
    <Suspense fallback={null}>
      <TokensPageContent tokens={tokensWithMetadata} />
    </Suspense>
  );
}
