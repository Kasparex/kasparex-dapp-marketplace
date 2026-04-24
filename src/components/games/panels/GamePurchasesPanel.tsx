'use client';

import type { ReactNode } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';

export function GamePurchasesPanel(props: { title?: string; children: ReactNode }) {
  return (
    <GamePanelCard title={props.title ?? 'Purchases'}>
      <div>{props.children}</div>
    </GamePanelCard>
  );
}

