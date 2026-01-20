/**
 * Promo Page Route
 * 
 * Displays a token promo page with minting functionality
 */

import { notFound } from 'next/navigation';
import { getAllTokens, getTokenBySlug } from '@/lib/tokens/registry';
import { PromoPage } from '@/components/tokens/PromoPage';
import { TokenSidebar } from '@/components/tokens/TokenSidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface PromoPageRouteProps {
  params: Promise<{
    slug: string;
    pageId: string;
  }>;
}

export default async function PromoPageRoute({ params }: PromoPageRouteProps) {
  const { slug, pageId } = await params;
  const token = getTokenBySlug(slug);

  if (!token) {
    notFound();
  }

  // Check if token has promo engine enabled
  // For now, we'll allow any token, but in production you'd check hasPromoEngine flag
  const apiBaseUrl = process.env.NEXT_PUBLIC_KASPAREX_API_URL || 'https://kasparex-api.kasparexcom.workers.dev';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <TokenSidebar token={token} />

        {/* Main Content */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div className="max-w-7xl mx-auto">
            <PromoPage token={token} pageId={pageId} apiBaseUrl={apiBaseUrl} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
