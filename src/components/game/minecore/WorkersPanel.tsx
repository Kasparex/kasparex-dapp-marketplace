'use client';

import { useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import type { MiningSlot } from '@/lib/game/engine';
import { NFTSlotSelector } from '@/components/game/NFTSlotSelector';
import { Tooltip } from '@/components/ui/Tooltip';

function slotLabel(s: MiningSlot) {
  if (s.type === 'worker') return 'Worker';
  if (s.type === 'operator') return 'Operator';
  if (s.type === 'foreman') return 'Foreman';
  if (s.type === 'engineer') return 'Engineer';
  return s.type;
}

export function WorkersPanel(props: {
  slots: MiningSlot[];
  autoRestart: boolean;
  foremanActive: boolean;
  onToggleAutoRestart: (enabled: boolean) => void;
  onDeploy: (slotIndex: number, nftId: number, collection: string) => void;
  onRemove: (slotIndex: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="space-y-6">
      <GamePanelCard title="Workers" hint="NFT slots that boost mining.">
        <div className="grid gap-3 sm:grid-cols-2">
          {props.slots.map((s, i) => (
            <button
              key={`${s.type}-${i}`}
              type="button"
              onClick={() => setSelected(i)}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/30 dark:hover:bg-zinc-800/50"
            >
              <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{slotLabel(s)}</div>
              <div className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.nftId != null ? `NFT #${s.nftId}` : 'Not set'}
              </div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{s.collection ?? 'Compatible collection required'}</div>
            </button>
          ))}
        </div>
      </GamePanelCard>

      <GamePanelCard title="Automation" hint="Lightweight V1 toggle. Foreman enables full automation later.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Auto-restart: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{props.autoRestart ? 'On' : 'Off'}</span>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Foreman active: {props.foremanActive ? 'Yes' : 'No'}</div>
          </div>
          <Tooltip content="V1 toggles the automation flag. Full auto restart logic will be added when rules are finalized.">
            <button
              type="button"
              onClick={() => props.onToggleAutoRestart(!props.autoRestart)}
              className="k-cta-games h-11 px-6 text-sm"
            >
              {props.autoRestart ? 'Disable' : 'Enable'}
            </button>
          </Tooltip>
        </div>
      </GamePanelCard>

      {selected !== null ? (
        <NFTSlotSelector
          slotIndex={selected}
          slot={props.slots[selected] ?? null}
          allSlots={props.slots}
          isOpen={true}
          onClose={() => setSelected(null)}
          onDeploy={props.onDeploy}
          onRemove={() => props.onRemove(selected)}
        />
      ) : null}
    </div>
  );
}

