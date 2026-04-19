import { MINING_RUN_OPTIONS } from '@/lib/game/diamond-veins-config';
import type { GameEvent, TyconGameState } from '@/lib/game/engine';

function utcDateString(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Returns events to auto-restart an ended mining run (Foreman + policy caps).
 */
export function computeAutoRestartMiningRunEvents(state: TyconGameState, nowMs: number): GameEvent[] {
  const a = state.automation;
  if (!a.autoRestartMiningRun) return [];
  if (state.miningRunEndTime > nowMs) return [];
  if (state.miningRunOptionIndex == null) return [];

  const today = utcDateString(nowMs);
  let used = a.autoRestartRunsUsedToday;
  if (a.autoRestartLastUtcDate !== today) {
    used = 0;
  }
  const cap = Math.max(a.foremanActive ? 3 : 0, a.autoRestartRunsCapPerDay);
  if (cap <= 0) return [];
  if (used >= cap) return [];

  const opt = MINING_RUN_OPTIONS[state.miningRunOptionIndex];
  if (!opt) return [];

  return [
    {
      type: 'SetAutomation',
      patch: {
        autoRestartRunsUsedToday: used + 1,
        autoRestartLastUtcDate: today,
      },
    },
    {
      type: 'StartMiningRun',
      optionIndex: state.miningRunOptionIndex,
      at: nowMs,
      durationMs: opt.durationMs,
      mult: opt.mult,
    },
  ];
}
