'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

export type OsmRegionMarker = {
  id: string;
  label: string;
  position: LatLngExpression;
  total: number;
  mirror: number;
  light: number;
  super: number;
};

function radiusForCount(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 6;
  if (n <= 3) return 8;
  if (n <= 8) return 10;
  return 12;
}

export function NodesOsmMap(props: { markers: OsmRegionMarker[] }) {
  const markers = props.markers ?? [];

  return (
    <div className="relative w-full h-[340px] sm:h-[380px]">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={6}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        className="rounded-xl"
        worldCopyJump
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers
          .filter((m) => m.total > 0)
          .map((m) => {
            const r = radiusForCount(m.total);
            return (
              <CircleMarker
                key={m.id}
                center={m.position}
                radius={r}
                pathOptions={{
                  color: '#02abb8',
                  weight: 2,
                  fillColor: '#02abb8',
                  fillOpacity: 0.35,
                }}
              >
                <Popup>
                  <div className="text-sm font-semibold">{m.label}</div>
                  <div className="text-xs opacity-80">
                    {m.total} total (mirror {m.mirror}, light {m.light}, super {m.super})
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>
    </div>
  );
}

