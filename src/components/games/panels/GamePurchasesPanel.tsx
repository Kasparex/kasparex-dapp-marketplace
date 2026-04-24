'use client';

import type { ReactNode } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';

export function GamePurchasesPanel(props: { title?: string; hint?: string; children: ReactNode }) {
  return (
    <GamePanelCard
      title={props.title ?? 'Purchases'}
      hint={props.hint ?? 'Your active purchases, boosts, and paid unlocks for this game.'}
    >
      <div>{props.children}</div>
    </GamePanelCard>
  );
}

