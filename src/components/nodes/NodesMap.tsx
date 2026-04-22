'use client';

import type { KrexNode } from '@/lib/storage/krex-nodes';
import { SectionHeader } from './SectionHeader';
import dynamic from 'next/dynamic';
import type { OsmRegionMarker } from './NodesOsmMap';

const CARD_CLASS =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

const NodesOsmMap = dynamic(() => import('./NodesOsmMap').then((m) => m.NodesOsmMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[340px] sm:h-[380px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950" />
  ),
});

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

const REGION_CENTERS: Array<{ id: string; label: string; lat: number; lng: number }> = [
  { id: 'north-america', label: 'North America', lat: 40, lng: -100 },
  { id: 'south-america', label: 'South America', lat: -15, lng: -60 },
  { id: 'europe', label: 'Europe', lat: 54, lng: 15 },
  { id: 'africa', label: 'Africa', lat: 0, lng: 20 },
  { id: 'asia', label: 'Asia', lat: 35, lng: 100 },
  { id: 'oceania', label: 'Oceania', lat: -25, lng: 135 },
];

export function NodesMap(props: { nodes: KrexNode[] }) {
  const nodes = props.nodes ?? [];
  const counts = countByRegion(nodes);

  const markers: OsmRegionMarker[] = REGION_CENTERS.map((r) => {
    const row = counts.get(r.id) ?? { total: 0, mirror: 0, light: 0, super: 0 };
    return {
      id: r.id,
      label: r.label,
      position: [r.lat, r.lng],
      ...row,
    };
  });

  return (
    <section id="map" className="mb-6">
      <div className={CARD_CLASS}>
        <SectionHeader
          title="Node map"
          hint="OpenStreetMap view based on the node registry. Locations are approximate (continent/region-level)."
          right={<span>{nodes.length} active</span>}
        />

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
          <NodesOsmMap markers={markers} />
        </div>

        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
          Tip: standardize node `region` to a continent for now (e.g. `north-america`, `south-america`, `europe`, `africa`,
          `asia`, `oceania`).
        </div>
      </div>
    </section>
  );
}

