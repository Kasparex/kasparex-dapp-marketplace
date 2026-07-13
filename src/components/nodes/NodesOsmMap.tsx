'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';

/** OSM tiles still require attribution; this only removes Leaflet’s default “Leaflet” prefix/link. */
function MapAttributionChrome() {
  const map = useMap();
  useEffect(() => {
    map.attributionControl?.setPrefix(false);
  }, [map]);
  return null;
}

export type OsmRegionMarker = {
  id: string;
  label: string;
  /** Explicit WGS84 - avoids tuple [lat,lng] ambiguity with some Leaflet typings. */
  position: { lat: number; lng: number };
  total: number;
  edge: number;
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

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export function NodesOsmMap(props: { markers: OsmRegionMarker[]; mapTheme: 'light' | 'dark' }) {
  const markers = props.markers ?? [];
  const mapTheme = props.mapTheme ?? 'dark';
  const tileUrl =
    mapTheme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';

  return (
    <div className="k-nodes-map relative w-full h-[340px] sm:h-[380px]">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={6}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        className="k-nodes-map__canvas rounded-xl"
        worldCopyJump
      >
        <MapAttributionChrome />
        <TileLayer key={mapTheme} attribution={CARTO_ATTRIBUTION} url={tileUrl} subdomains="abcd" />

        {markers
          .filter((m) => m.total > 0)
          .map((m) => {
            const r = radiusForCount(m.total);
            return (
              <CircleMarker
                key={m.id}
                center={[m.position.lat, m.position.lng]}
                radius={r}
                pathOptions={{
                  color: '#02abb8',
                  weight: 2,
                  fillColor: '#02abb8',
                  fillOpacity: 0.35,
                }}
              >
                <Popup className="k-nodes-map-popup" closeButton>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{m.label}</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    {m.total} total (edge {m.edge}, light {m.light}, super {m.super})
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>
    </div>
  );
}

