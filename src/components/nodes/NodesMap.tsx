'use client';

import type { KrexNode } from '@/lib/storage/krex-nodes';
import { resolveNodeMapGeo } from '@/lib/nodes/nodeMapGeo';
import { useTheme } from '@/components/ThemeProvider';
import { SectionHeader } from './SectionHeader';
import dynamic from 'next/dynamic';
import type { OsmRegionMarker } from './NodesOsmMap';

import { NODES_DASH_CARD } from './nodesTabLayout';

const NodesOsmMap = dynamic(() => import('./NodesOsmMap').then((m) => m.NodesOsmMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[340px] sm:h-[380px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950" />
  ),
});

type GeoAgg = { geoKey: string; label: string; lat: number; lng: number; total: number; mirror: number; light: number; super: number };

function aggregateByGeo(nodes: KrexNode[]): GeoAgg[] {
  const m = new Map<string, GeoAgg>();
  for (const n of nodes) {
    const g = resolveNodeMapGeo(n.region);
    const row = m.get(g.key);
    if (!row) {
      m.set(g.key, {
        geoKey: g.key,
        label: g.label,
        lat: g.lat,
        lng: g.lng,
        total: 1,
        mirror: n.role === 'mirror' ? 1 : 0,
        light: n.role === 'light' ? 1 : 0,
        super: n.role === 'super' ? 1 : 0,
      });
    } else {
      row.total += 1;
      if (n.role === 'mirror') row.mirror += 1;
      else if (n.role === 'light') row.light += 1;
      else if (n.role === 'super') row.super += 1;
    }
  }
  return Array.from(m.values());
}

export function NodesMap(props: { nodes: KrexNode[] }) {
  const nodes = props.nodes ?? [];
  const { theme } = useTheme();
  const mapTheme = theme === 'light' ? 'light' : 'dark';

  const rows = aggregateByGeo(nodes);
  const markers: OsmRegionMarker[] = rows.map((r) => ({
    id: r.geoKey,
    label: r.label,
    position: { lat: r.lat, lng: r.lng },
    total: r.total,
    mirror: r.mirror,
    light: r.light,
    super: r.super,
  }));

  return (
    <section id="map" className="mb-6">
      <div className={NODES_DASH_CARD}>
        <SectionHeader
          title="Node map"
          hint="Map data © OpenStreetMap contributors, style © CARTO. Pins are static (no geocoding): optional lat,lng in `region`, else cloud-region or country points — zero API usage."
          right={<span>{nodes.length} active</span>}
        />

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
          <NodesOsmMap markers={markers} mapTheme={mapTheme} />
        </div>

        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
          Tip: for an exact pin set <code className="font-mono">region</code> to <code className="font-mono">lat,lng</code> (WGS84,
          e.g. <code className="font-mono">52.2297,21.0122</code>). Otherwise use ISO2, a country name, or a cloud slug like{' '}
          <code className="font-mono">eu-central-1</code> — all resolved offline in the app.
        </div>
      </div>
    </section>
  );
}

