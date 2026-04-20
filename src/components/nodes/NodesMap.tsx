'use client';

import type { KrexNode } from '@/lib/storage/krex-nodes';
import { Tooltip } from '@/components/ui/Tooltip';
import { SectionHeader } from './SectionHeader';

const CARD_CLASS =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

type RegionPin = { id: string; label: string; x: number; y: number };

// Lightweight mapping without extra deps. We refine as regions standardize.
const REGION_PINS: RegionPin[] = [
  { id: 'us', label: 'US', x: 155, y: 120 },
  { id: 'us-east', label: 'US East', x: 185, y: 120 },
  { id: 'us-west', label: 'US West', x: 135, y: 120 },
  { id: 'eu', label: 'EU', x: 285, y: 105 },
  { id: 'uk', label: 'UK', x: 270, y: 100 },
  { id: 'pl', label: 'PL', x: 290, y: 100 },
  { id: 'asia', label: 'Asia', x: 390, y: 125 },
  { id: 'sg', label: 'Singapore', x: 410, y: 170 },
  { id: 'jp', label: 'Japan', x: 435, y: 118 },
  { id: 'au', label: 'Australia', x: 450, y: 210 },
];

function normalizeRegion(r: string | null | undefined): string {
  const x = (r ?? '').trim().toLowerCase();
  if (!x) return 'unknown';
  if (x.startsWith('us-')) return x;
  if (x === 'usa' || x === 'us') return 'us';
  if (x === 'europe' || x === 'eu') return 'eu';
  if (x === 'uk' || x.includes('london')) return 'uk';
  if (x === 'pl' || x.includes('poland') || x.includes('warsaw')) return 'pl';
  if (x === 'asia' || x.includes('asia')) return 'asia';
  if (x === 'sg' || x.includes('singapore')) return 'sg';
  if (x === 'jp' || x.includes('japan') || x.includes('tokyo')) return 'jp';
  if (x === 'au' || x.includes('australia') || x.includes('sydney')) return 'au';
  return x;
}

function countByRegion(nodes: KrexNode[]) {
  const m = new Map<string, { total: number; mirror: number; light: number; super: number }>();
  for (const n of nodes) {
    const key = normalizeRegion(n.region);
    if (!m.has(key)) m.set(key, { total: 0, mirror: 0, light: 0, super: 0 });
    const row = m.get(key)!;
    row.total += 1;
    if (n.role === 'mirror') row.mirror += 1;
    else if (n.role === 'light') row.light += 1;
    else row.super += 1;
  }
  return m;
}

function radiusForCount(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 5;
  if (n <= 3) return 7;
  if (n <= 8) return 9;
  return 11;
}

export function NodesMap(props: { nodes: KrexNode[] }) {
  const nodes = props.nodes ?? [];
  const counts = countByRegion(nodes);

  return (
    <section id="map" className="mb-6">
      <div className={CARD_CLASS}>
        <SectionHeader
          title="Node map"
          hint="Simple interactive view based on the node registry. Pins are approximate until regions are standardized."
          right={<span>{nodes.length} active</span>}
        />

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 overflow-hidden">
          <svg viewBox="0 0 520 260" className="w-full h-auto">
            {/* Very simple world silhouette (decorative) */}
            <path
              d="M70,140 C80,120 100,110 120,110 C145,105 160,90 180,92 C205,94 220,112 235,118 C250,124 265,110 290,108 C320,105 332,90 352,92 C375,95 388,110 410,114 C440,119 462,140 462,160 C462,185 430,205 390,205 C340,205 320,190 285,192 C250,194 235,210 210,212 C180,214 165,200 140,192 C105,181 58,175 58,160 C58,152 63,146 70,140 Z"
              fill="currentColor"
              className="text-zinc-200 dark:text-zinc-800"
              opacity={0.55}
            />

            {/* Region pins */}
            {REGION_PINS.map((p) => {
              const row = counts.get(p.id);
              const total = row?.total ?? 0;
              const r = radiusForCount(total);
              const label = row
                ? `${p.label}: ${row.total} (mirror ${row.mirror}, light ${row.light}, super ${row.super})`
                : `${p.label}: 0`;
              return (
                <g key={p.id}>
                  <Tooltip content={label} side="top" align="center">
                    <g>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={Math.max(4, r)}
                        className={total > 0 ? 'fill-[#02abb8]' : 'fill-zinc-300 dark:fill-zinc-700'}
                        opacity={total > 0 ? 0.95 : 0.7}
                      />
                      {total > 0 ? (
                        <circle cx={p.x} cy={p.y} r={Math.max(9, r + 6)} className="fill-[#02abb8]" opacity={0.15} />
                      ) : null}
                    </g>
                  </Tooltip>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
          Tip: if your nodes show up as “unknown”, standardize their `region` (e.g. `eu`, `us-east`, `us-west`, `sg`).
        </div>
      </div>
    </section>
  );
}

