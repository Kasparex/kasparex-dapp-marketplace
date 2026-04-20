'use client';

import type { KrexNode } from '@/lib/storage/krex-nodes';
import { Tooltip } from '@/components/ui/Tooltip';
import { SectionHeader } from './SectionHeader';
import Image from 'next/image';

const CARD_CLASS =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

type RegionPin = { id: string; label: string; x: number; y: number };

// Lightweight mapping without extra deps. We refine as regions standardize.
const REGION_PINS: RegionPin[] = [
  // Continent-only pins (coordinates are in the SVG's viewBox space: public/world-map.svg).
  { id: 'north-america', label: 'North America', x: 105, y: 98 },
  { id: 'south-america', label: 'South America', x: 132, y: 170 },
  { id: 'europe', label: 'Europe', x: 248, y: 82 },
  { id: 'africa', label: 'Africa', x: 252, y: 140 },
  { id: 'asia', label: 'Asia', x: 342, y: 100 },
  { id: 'oceania', label: 'Oceania', x: 415, y: 195 },
];

// The SVG we use (public/world-map.svg) is ~495x266.
const MAP_W = 494.7;
const MAP_H = 265.7;

function normalizeRegion(r: string | null | undefined): string {
  const x = (r ?? '').trim().toLowerCase();
  if (!x) return 'unknown';

  // Continent-first normalization (simple + stable for the current SVG map).
  if (x.includes('north america') || x === 'na' || x === 'north-america') return 'north-america';
  if (x.includes('south america') || x === 'sa' || x === 'south-america') return 'south-america';
  if (x.includes('europe') || x === 'eu') return 'europe';
  if (x.includes('africa') || x === 'af') return 'africa';
  if (x.includes('asia') || x === 'as') return 'asia';
  if (x.includes('oceania') || x.includes('australia') || x === 'au' || x === 'oc') return 'oceania';

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

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
          <div className="relative w-full aspect-[494.7/265.7]">
            <Image
              src="/world-map.svg"
              alt="World map"
              fill
              priority={false}
              className="object-contain opacity-70 dark:opacity-60"
            />

            {/* Pins are positioned using percentages in the 2:1 map box. */}
            {REGION_PINS.map((p) => {
              const row = counts.get(p.id);
              const total = row?.total ?? 0;
              const r = radiusForCount(total);
              const label = row
                ? `${p.label}: ${row.total} (mirror ${row.mirror}, light ${row.light}, super ${row.super})`
                : `${p.label}: 0`;

              // Convert SVG coords to percent for the overlay.
              const leftPct = (p.x / MAP_W) * 100;
              const topPct = (p.y / MAP_H) * 100;
              const size = Math.max(10, r * 2);

              return (
                <div
                  key={p.id}
                  className="absolute"
                  style={{ left: `${leftPct}%`, top: `${topPct}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <Tooltip content={label} side="top" align="center">
                    <div className="relative">
                      <div
                        className={[
                          'rounded-full',
                          total > 0 ? 'bg-[#02abb8]' : 'bg-zinc-300 dark:bg-zinc-700',
                        ].join(' ')}
                        style={{ width: size, height: size, opacity: total > 0 ? 0.95 : 0.75 }}
                      />
                      {total > 0 ? (
                        <div
                          className="absolute inset-0 rounded-full bg-[#02abb8]"
                          style={{ transform: 'scale(1.7)', opacity: 0.15 }}
                        />
                      ) : null}
                    </div>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
          Tip: standardize node `region` to a continent for now (e.g. `north-america`, `south-america`, `europe`, `africa`,
          `asia`, `oceania`).
        </div>
      </div>
    </section>
  );
}

