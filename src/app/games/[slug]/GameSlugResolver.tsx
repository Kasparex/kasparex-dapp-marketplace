'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameContent } from './GameContent';
import type { UnifiedGame } from '@/lib/games/registry';
import {
  GAMES_PROMO_UPDATED_EVENT,
  getPublishedPromoGameBySlug,
} from '@/lib/games/promoListings';

/**
 * Resolves slug games from the static registry (SSR) or client-stored community promos.
 */
export function GameSlugResolver({
  slug,
  registryGame,
}: {
  slug: string;
  registryGame: UnifiedGame | null;
}) {
  const [promoGame, setPromoGame] = useState<UnifiedGame | null>(null);
  const [ready, setReady] = useState(Boolean(registryGame));

  useEffect(() => {
    if (registryGame) {
      setReady(true);
      return;
    }
    const load = () => {
      setPromoGame(getPublishedPromoGameBySlug(slug) ?? null);
      setReady(true);
    };
    load();
    window.addEventListener(GAMES_PROMO_UPDATED_EVENT, load);
    return () => window.removeEventListener(GAMES_PROMO_UPDATED_EVENT, load);
  }, [slug, registryGame]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
        </main>
        <Footer />
      </div>
    );
  }

  const game = registryGame ?? promoGame;
  if (!game) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <GameContent game={game} />
      <Footer />
    </div>
  );
}
