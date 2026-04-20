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
  // Coordinates are in the SVG's viewBox space (public/world-map.svg).
  { id: 'us', label: 'US', x: 148, y: 120 },
  { id: 'us-east', label: 'US East', x: 182, y: 122 },
  { id: 'us-west', label: 'US West', x: 118, y: 123 },
  { id: 'eu', label: 'EU', x: 266, y: 108 },
  { id: 'uk', label: 'UK', x: 254, y: 104 },
  { id: 'pl', label: 'PL', x: 276, y: 106 },
  { id: 'asia', label: 'Asia', x: 372, y: 122 },
  { id: 'sg', label: 'Singapore', x: 381, y: 176 },
  { id: 'jp', label: 'Japan', x: 416, y: 125 },
  { id: 'au', label: 'Australia', x: 419, y: 218 },
];

// The SVG we use (public/world-map.svg) is ~495x266.
const MAP_W = 494.7;
const MAP_H = 265.7;

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
          Tip: if your nodes show up as “unknown”, standardize their `region` (e.g. `eu`, `us-east`, `us-west`, `sg`).
        </div>
      </div>
    </section>
  );
}

