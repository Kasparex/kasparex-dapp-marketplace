'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { HubMetadataStatGrid } from '@/components/hub/HubMetadataStatGrid';
import { KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';
import {
  ARIA_TARGETS,
  PRECISION_LEVELS,
  fragmentsForClick,
  getAriaTarget,
  getPrecisionLevel,
  pickAriaTargetKind,
  type AriaTargetKind,
  type PrecisionLevelDef,
} from '@/lib/game/precision-click/config';

type LiveTarget = {
  id: string;
  kind: AriaTargetKind;
  x: number;
  y: number;
  r: number;
  ttlMs: number;
  createdAt: number;
};

export function PrecisionClickPlayPanel(props: {
  entryUnlocked: boolean;
  maxUnlockedLevel: number;
  highestClearedLevel: number;
  boosterMult: number;
  tierNftMult: number;
  addonBundle: { extraTimeMs: number; fragmentBonusMult: number; missForgiveness: number };
  inventory: { shard_lens: number; null_filter: number };
  onConsumeItems: (opts: { useShardLens: boolean; useNullFilter: boolean }) => void;
  onBankRun: (grossFragments: number, levelId: number, cleared: boolean) => void;
  onRunningChange?: (running: boolean) => void;
}) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [running, setRunning] = useState(false);
  const [targets, setTargets] = useState<LiveTarget[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [sessionFragments, setSessionFragments] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [useShardLens, setUseShardLens] = useState(false);
  const [useNullFilter, setUseNullFilter] = useState(false);
  const [runLens, setRunLens] = useState(false);
  const [runFilter, setRunFilter] = useState(false);
  const [endReason, setEndReason] = useState<string | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef(0);
  const missesRef = useRef(0);
  const runningRef = useRef(false);
  const finishedRef = useRef(false);

  const level = getPrecisionLevel(selectedLevel) ?? PRECISION_LEVELS[0]!;
  const unlocked = props.entryUnlocked && selectedLevel <= props.maxUnlockedLevel;
  const totalMult = props.boosterMult * props.tierNftMult * props.addonBundle.fragmentBonusMult;
  const maxMisses = level.maxMisses + props.addonBundle.missForgiveness;
  const durationMs = level.durationMs + props.addonBundle.extraTimeMs;

  const onRunningChange = props.onRunningChange;
  const onBankRun = props.onBankRun;

  useEffect(() => {
    runningRef.current = running;
    onRunningChange?.(running);
  }, [running, onRunningChange]);

  useEffect(() => {
    if (selectedLevel > props.maxUnlockedLevel) {
      setSelectedLevel(Math.max(1, props.maxUnlockedLevel));
    }
  }, [props.maxUnlockedLevel, selectedLevel]);

  const finishRun = useCallback(
    (reason: 'time' | 'misses' | 'cleared') => {
      if (!runningRef.current || finishedRef.current) return;
      finishedRef.current = true;
      runningRef.current = false;
      setRunning(false);
      const gained = Math.max(0, Math.floor(sessionRef.current));
      const cleared = gained >= level.clearGoal || reason === 'cleared';
      const end =
        reason === 'misses'
          ? 'Too many misses. Run ended early.'
          : cleared
            ? `Level ${level.id} cleared. Next level unlocked.`
            : `Run finished. Need ${level.clearGoal} fragments to clear (got ${gained}).`;
      setEndReason(end);
      onBankRun(gained, level.id, cleared);
    },
    [level.clearGoal, level.id, onBankRun],
  );

  function spawnTarget(levelDef: PrecisionLevelDef, lensActive: boolean) {
    const el = arenaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 20;
    const w = Math.max(200, rect.width);
    const h = Math.max(240, rect.height);
    const kind = pickAriaTargetKind(levelDef.hazardScale);
    const def = getAriaTarget(kind)!;
    let r = def.radiusMin + Math.floor(Math.random() * Math.max(1, def.radiusMax - def.radiusMin));
    if (lensActive && !def.hazard) r += 1;
    const x = pad + r + Math.random() * (w - (pad + r) * 2);
    const y = pad + r + Math.random() * (h - (pad + r) * 2);
    const ttlMs =
      levelDef.ttlMinMs + Math.floor(Math.random() * Math.max(1, levelDef.ttlMaxMs - levelDef.ttlMinMs));
    const createdAt = Date.now();
    const id = `${createdAt}_${Math.random().toString(16).slice(2)}`;
    setTargets((t) => [...t, { id, kind, x, y, r, ttlMs, createdAt }]);
  }

  useEffect(() => {
    if (!running) return;
    sessionRef.current = 0;
    missesRef.current = 0;
    finishedRef.current = false;
    setTargets([]);
    setHits(0);
    setMisses(0);
    setSessionFragments(0);
    setTimeLeftMs(durationMs);
    setEndReason(null);

    const levelDef = level;
    const lens = runLens;

    const tick = setInterval(() => {
      setTimeLeftMs((ms) => Math.max(0, ms - 100));
      setTargets((t) => {
        const now = Date.now();
        const alive: LiveTarget[] = [];
        let expired = 0;
        for (const a of t) {
          if (now - a.createdAt > a.ttlMs) expired++;
          else alive.push(a);
        }
        if (expired > 0) {
          missesRef.current += expired;
          setMisses(missesRef.current);
        }
        return alive;
      });
    }, 100);

    const spawner = setInterval(() => {
      spawnTarget(levelDef, lens);
      if (Math.random() < levelDef.doubleSpawnChance) spawnTarget(levelDef, lens);
    }, levelDef.spawnEveryMs);

    return () => {
      clearInterval(tick);
      clearInterval(spawner);
    };
  }, [running, level, durationMs, runLens]);

  useEffect(() => {
    if (!running) return;
    if (timeLeftMs <= 0) {
      finishRun('time');
      return;
    }
    if (missesRef.current > maxMisses) {
      finishRun('misses');
    }
  }, [timeLeftMs, misses, running, maxMisses, finishRun]);

  function startRun() {
    if (!unlocked || running) return;
    const lens = useShardLens && props.inventory.shard_lens > 0;
    const filter = useNullFilter && props.inventory.null_filter > 0;
    setRunLens(lens);
    setRunFilter(filter);
    if (lens || filter) props.onConsumeItems({ useShardLens: lens, useNullFilter: filter });
    setRunning(true);
  }

  const lore = useMemo(() => {
    const lines = [
      'A Null Gang glyph flickers on the wall…',
      'Krex’s visor highlights a weak signal trace.',
      'ARIA’s fragment pulses. Lock it precisely.',
      'Vector’s calibration drifts. Click with intent.',
      'Tessa marks a stealth window. No wasted motion.',
    ];
    return lines[(selectedLevel - 1) % lines.length]!;
  }, [selectedLevel]);

  return (
    <div className="space-y-6">
      <GamePanelCard title="Level select" hint="Clear a level to unlock the next.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PRECISION_LEVELS.map((lv) => {
            const isUnlocked = props.entryUnlocked && lv.id <= props.maxUnlockedLevel;
            const cleared = lv.id <= props.highestClearedLevel;
            const active = lv.id === selectedLevel;
            return (
              <button
                key={lv.id}
                type="button"
                disabled={!isUnlocked || running}
                onClick={() => setSelectedLevel(lv.id)}
                className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? 'border-[color:var(--hub-accent)] bg-[color:var(--hub-accent)]/10'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700'
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Lv {lv.id}
                  {cleared ? ' · Cleared' : !isUnlocked ? ' · Locked' : ''}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">{lv.name}</p>
              </button>
            );
          })}
        </div>
      </GamePanelCard>

      {!props.entryUnlocked ? (
        <GamePanelCard title="Entry required" hint="Pay from the Calculation breakdown.">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Unlock ARIA Lock with the 10 KAS training entry (add-ons optional) in the sidebar Calculation breakdown.
          </p>
        </GamePanelCard>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <GameOverviewTitleBlock
              as="h3"
              kicker="Precision training"
              title={level.name}
              subtitle={`${level.subtitle} ${lore}`}
              compact
            />
            <div className="text-right">
              <p className="text-xs font-semibold text-zinc-500">Session fragments</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {sessionFragments.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-500">
                Goal {level.clearGoal} · Mult ×{totalMult.toFixed(2)}
              </p>
            </div>
          </div>

          <HubMetadataStatGrid
            stats={[
              { label: 'Time', value: `${(timeLeftMs / 1000).toFixed(1)}s`, copyable: false },
              { label: 'Hits', value: String(hits), copyable: false },
              { label: 'Misses', value: `${misses} / ${maxMisses}`, copyable: false },
            ]}
          />

          <div className={`${KX_SURFACE_NESTED} flex flex-wrap items-center gap-4 rounded-xl p-3 text-xs`}>
            <label className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                disabled={running || props.inventory.shard_lens <= 0}
                checked={useShardLens}
                onChange={(e) => setUseShardLens(e.target.checked)}
              />
              Shard Lens ({props.inventory.shard_lens})
            </label>
            <label className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                disabled={running || props.inventory.null_filter <= 0}
                checked={useNullFilter}
                onChange={(e) => setUseNullFilter(e.target.checked)}
              />
              Null Filter ({props.inventory.null_filter})
            </label>
            <div className="ml-auto flex flex-wrap gap-2 text-[11px] text-zinc-500">
              {ARIA_TARGETS.slice(0, 4).map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.imageSrc} alt="" width={14} height={14} className="rounded-sm" />
                  +{t.fragmentMult}×
                </span>
              ))}
              <span className="text-rose-600 dark:text-rose-400">Hazards drain fragments</span>
            </div>
          </div>

          {endReason ? (
            <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              {endReason}
            </p>
          ) : null}

          <div
            ref={arenaRef}
            className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={level.scenerySrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-zinc-950/25" />

            {!running ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  type="button"
                  className="k-cta-games h-12 px-6 text-sm"
                  disabled={!unlocked}
                  onClick={startRun}
                >
                  Start level {level.id}
                </button>
              </div>
            ) : null}

            {targets.map((t) => {
              const def = getAriaTarget(t.kind)!;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-label={def.label}
                  title={`${def.label} (${def.hazard ? '' : '+'}${def.fragmentMult}×)`}
                  className="absolute overflow-hidden rounded-full border border-white/30 shadow-lg transition-transform hover:scale-105"
                  style={{ left: t.x - t.r, top: t.y - t.r, width: t.r * 2, height: t.r * 2 }}
                  onClick={() => {
                    setTargets((all) => all.filter((x) => x.id !== t.id));
                    setHits((h) => h + 1);
                    const delta = fragmentsForClick({
                      kind: t.kind,
                      levelMult: level.fragmentMult,
                      addonFragmentMult: props.addonBundle.fragmentBonusMult,
                      boosterMult: props.boosterMult * props.tierNftMult,
                      nullFilterActive: runFilter,
                    });
                    setSessionFragments((s) => {
                      const next = Math.max(0, s + delta);
                      sessionRef.current = next;
                      if (next >= level.clearGoal) {
                        queueMicrotask(() => finishRun('cleared'));
                      }
                      return next;
                    });
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={def.imageSrc} alt="" className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
