/**
 * Tokens Listing Page
 * Main page displaying all ecosystem tokens
 */

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TokenListingTable } from '@/components/tokens/TokenListingTable';
import { TokensListingSidebar } from '@/components/tokens/TokensListingSidebar';
import { getAllTokens } from '@/lib/tokens/registry';
import { loadTokenWithMetadata } from '@/lib/tokens/metadata';

export const dynamic = 'force-dynamic';

export default async function TokensPage() {
  // Get all tokens
  const tokens = getAllTokens();

  // Load IPFS metadata for tokens that have it
  const tokensWithMetadata = await Promise.all(
    tokens.map((token) => loadTokenWithMetadata(token))
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <TokensListingSidebar />

        {/* Main Content */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Kasparex Tokens
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Explore all tokens in the Kasparex ecosystem
              </p>
            </div>

            {/* Token Listing Table */}
            <TokenListingTable tokens={tokensWithMetadata} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
