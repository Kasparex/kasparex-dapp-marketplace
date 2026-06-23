'use client';

import type { ReactNode } from 'react';
import type { Game } from '@/lib/games/games';
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
import { gameL1PlayGateConfig } from '@/lib/hub/gateConfigs';

export function GamePlayWalletGate({ game, children }: { game: Game; children: ReactNode }) {
  return (
    <HubWalletGateShell config={gameL1PlayGateConfig(game)} mode="overlay">
      {children}
    </HubWalletGateShell>
  );
}
