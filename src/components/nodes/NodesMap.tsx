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
            {/* Simplified world map silhouette (recognizable continents, decorative). */}
            <g fill="currentColor" className="text-zinc-200 dark:text-zinc-800" opacity={0.55}>
              {/* North America */}
              <path d="M82 86c20-18 44-26 70-24 16 1 26 10 36 16 10 6 26 4 36 12 10 8 16 20 10 30-7 12-20 10-30 18-10 8-10 22-24 26-16 5-34-2-52-10-16-7-34-8-50-18-12-7-16-32 4-50z" />
              {/* Greenland */}
              <path d="M198 42c12-10 30-10 40 0 7 7 6 16-2 22-10 8-24 10-36 4-10-5-10-16-2-26z" />
              {/* South America */}
              <path d="M190 150c12-6 28-4 36 6 8 10 2 22-2 34-4 12-2 24-10 34-9 11-24 14-30 0-6-13 0-26-2-38-2-14-12-26 8-36z" />
              {/* Europe */}
              <path d="M270 86c10-10 28-14 44-10 14 4 22 14 18 24-4 10-18 10-28 14-10 4-14 14-26 12-14-2-20-26-8-40z" />
              {/* Africa */}
              <path d="M280 132c14-10 34-10 48 0 14 10 14 30 6 44-8 14-10 28-28 32-18 4-28-14-30-30-2-16-16-32 4-46z" />
              {/* Middle East / West Asia */}
              <path d="M330 112c10-10 26-10 36-2 8 7 6 18-4 24-8 4-14 14-24 12-12-2-16-22-8-34z" />
              {/* Asia */}
              <path d="M356 86c22-18 52-22 78-12 22 9 40 26 38 44-2 18-22 24-36 34-14 10-16 26-34 30-18 4-32-10-48-16-18-6-40-2-54-14-16-14-8-50 56-66z" />
              {/* Australia */}
              <path d="M416 190c14-12 36-12 52-2 12 8 12 20 0 28-14 10-32 14-48 8-16-7-18-22-4-34z" />
            </g>

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

