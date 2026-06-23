'use client';

import type { ReactNode } from 'react';
import type { Game } from '@/lib/games/games';
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';

export function GamePlayWalletGate({ game, children }: { game: Game; children: ReactNode }) {
  return (
    <HubWalletGateShell
      mode="replace"
      config={{
        name: game.name,
        message: `Connect your Kaspa wallet to play ${game.name}.`,
        requirement: { layer: 'L1' },
        networkBadge: { layer: 'L1', label: 'Kaspa' },
        autoPrompt: true,
      }}
    >
      {children}
    </HubWalletGateShell>
  );
}
