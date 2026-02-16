/**
 * Tokens Listing Page
 * Main page displaying all ecosystem tokens
 */

import { TokensPageContent } from './TokensPageContent';
import { getAllTokens } from '@/lib/tokens/registry';
import { loadTokenWithMetadata } from '@/lib/tokens/metadata';

export const dynamic = 'force-dynamic';

export default async function TokensPage() {
  const tokens = getAllTokens();
  const tokensWithMetadata = await Promise.all(
    tokens.map((token) => loadTokenWithMetadata(token))
  );

  return <TokensPageContent tokens={tokensWithMetadata} />;
}
