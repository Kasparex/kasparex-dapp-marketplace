/**
 * Coarse geography for the /nodes map: prefer country centroids when we can infer
 * a country from `region`; otherwise fall back to continent centers.
 * Centroids are approximate (administrative / geographic center style), not node GPS.
 */

export type NodeMapGeo = {
  /** Stable key for aggregation */
  key: string;
  label: string;
  lat: number;
  lng: number;
};

/**
 * ISO 3166-1 alpha-2 → geographic midpoint of each country (WGS84), for map pins only.
 * Values are tuned to sit visually near the interior of the country on small-scale Web Mercator maps.
 */
const COUNTRY_CENTROID: Record<string, { lat: number; lng: number; label: string }> = {
  AD: { lat: 42.55, lng: 1.6, label: 'Andorra' },
  AE: { lat: 23.42, lng: 53.85, label: 'United Arab Emirates' },
  AR: { lat: -34.0, lng: -64.0, label: 'Argentina' },
  AT: { lat: 47.59, lng: 14.12, label: 'Austria' },
  AU: { lat: -25.27, lng: 133.78, label: 'Australia' },
  BE: { lat: 50.64, lng: 4.64, label: 'Belgium' },
  BR: { lat: -14.24, lng: -51.93, label: 'Brazil' },
  CA: { lat: 56.13, lng: -106.35, label: 'Canada' },
  CH: { lat: 46.82, lng: 8.23, label: 'Switzerland' },
  CL: { lat: -35.68, lng: -71.54, label: 'Chile' },
  CN: { lat: 35.86, lng: 104.2, label: 'China' },
  CO: { lat: 4.57, lng: -74.3, label: 'Colombia' },
  CZ: { lat: 49.75, lng: 15.47, label: 'Czechia' },
  DE: { lat: 51.17, lng: 10.45, label: 'Germany' },
  DK: { lat: 56.26, lng: 9.5, label: 'Denmark' },
  EE: { lat: 58.6, lng: 25.01, label: 'Estonia' },
  EG: { lat: 26.82, lng: 30.8, label: 'Egypt' },
  ES: { lat: 40.24, lng: -3.7, label: 'Spain' },
  FI: { lat: 64.5, lng: 26.0, label: 'Finland' },
  FR: { lat: 46.6, lng: 2.45, label: 'France' },
  GB: { lat: 53.84, lng: -2.45, label: 'United Kingdom' },
  GR: { lat: 39.07, lng: 21.82, label: 'Greece' },
  HK: { lat: 22.32, lng: 114.17, label: 'Hong Kong' },
  HR: { lat: 45.1, lng: 15.2, label: 'Croatia' },
  HU: { lat: 47.16, lng: 19.5, label: 'Hungary' },
  ID: { lat: -0.79, lng: 113.92, label: 'Indonesia' },
  IE: { lat: 53.41, lng: -8.24, label: 'Ireland' },
  IL: { lat: 31.05, lng: 34.85, label: 'Israel' },
  IN: { lat: 20.59, lng: 78.96, label: 'India' },
  IS: { lat: 64.96, lng: -19.02, label: 'Iceland' },
  IT: { lat: 42.83, lng: 12.57, label: 'Italy' },
  JP: { lat: 36.2, lng: 138.25, label: 'Japan' },
  KE: { lat: -0.02, lng: 37.91, label: 'Kenya' },
  KR: { lat: 35.91, lng: 127.77, label: 'South Korea' },
  LT: { lat: 55.17, lng: 23.88, label: 'Lithuania' },
  LU: { lat: 49.82, lng: 6.13, label: 'Luxembourg' },
  LV: { lat: 56.88, lng: 24.6, label: 'Latvia' },
  MX: { lat: 23.63, lng: -102.55, label: 'Mexico' },
  MY: { lat: 4.21, lng: 101.98, label: 'Malaysia' },
  NG: { lat: 9.08, lng: 8.68, label: 'Nigeria' },
  NL: { lat: 52.13, lng: 5.29, label: 'Netherlands' },
  NO: { lat: 64.5, lng: 12.5, label: 'Norway' },
  NZ: { lat: -40.9, lng: 174.89, label: 'New Zealand' },
  PH: { lat: 12.88, lng: 121.77, label: 'Philippines' },
  /** ~Geographic midpoint of Poland (Łódź / central belt), not border cities. */
  PL: { lat: 52.13, lng: 19.48, label: 'Poland' },
  PT: { lat: 39.4, lng: -8.22, label: 'Portugal' },
  RO: { lat: 45.94, lng: 24.97, label: 'Romania' },
  RS: { lat: 44.02, lng: 21.01, label: 'Serbia' },
  RU: { lat: 61.52, lng: 105.32, label: 'Russia' },
  SA: { lat: 23.89, lng: 45.08, label: 'Saudi Arabia' },
  SE: { lat: 62.0, lng: 15.0, label: 'Sweden' },
  SG: { lat: 1.35, lng: 103.82, label: 'Singapore' },
  SI: { lat: 46.15, lng: 14.99, label: 'Slovenia' },
  SK: { lat: 48.67, lng: 19.7, label: 'Slovakia' },
  TH: { lat: 15.87, lng: 100.99, label: 'Thailand' },
  TR: { lat: 38.96, lng: 35.24, label: 'Türkiye' },
  TW: { lat: 23.7, lng: 120.96, label: 'Taiwan' },
  UA: { lat: 48.38, lng: 31.17, label: 'Ukraine' },
  US: { lat: 39.83, lng: -98.58, label: 'United States' },
  VN: { lat: 14.06, lng: 108.28, label: 'Vietnam' },
  ZA: { lat: -30.56, lng: 22.94, label: 'South Africa' },
  BG: { lat: 42.73, lng: 25.49, label: 'Bulgaria' },
};

const CONTINENT: Record<string, { lat: number; lng: number; label: string }> = {
  'north-america': { lat: 45, lng: -100, label: 'North America' },
  'south-america': { lat: -15, lng: -60, label: 'South America' },
  europe: { lat: 54, lng: 15, label: 'Europe' },
  africa: { lat: 1, lng: 20, label: 'Africa' },
  asia: { lat: 35, lng: 100, label: 'Asia' },
  oceania: { lat: -25, lng: 135, label: 'Oceania' },
};

/** Map free-text / cloud region hints → ISO2 when obvious. */
const REGION_ALIAS_TO_ISO2: Array<{ re: RegExp; iso2: string }> = [
  { re: /\b(us|usa|united states|america)\b/i, iso2: 'US' },
  { re: /\b(canada|ca)\b/i, iso2: 'CA' },
  { re: /\b(mexico|mx)\b/i, iso2: 'MX' },
  { re: /\b(uk|united kingdom|britain|england|scotland|wales|gb)\b/i, iso2: 'GB' },
  { re: /\b(ireland|ie)\b/i, iso2: 'IE' },
  { re: /\b(france|fr)\b/i, iso2: 'FR' },
  { re: /\b(germany|deutschland|de)\b/i, iso2: 'DE' },
  { re: /\b(spain|es)\b/i, iso2: 'ES' },
  { re: /\b(italy|it)\b/i, iso2: 'IT' },
  { re: /\b(netherlands|holland|nl)\b/i, iso2: 'NL' },
  { re: /\b(belgium|be)\b/i, iso2: 'BE' },
  { re: /\b(switzerland|ch)\b/i, iso2: 'CH' },
  { re: /\b(austria|at)\b/i, iso2: 'AT' },
  { re: /\b(sweden|se)\b/i, iso2: 'SE' },
  { re: /\b(norway|no)\b/i, iso2: 'NO' },
  { re: /\b(finland|fi)\b/i, iso2: 'FI' },
  { re: /\b(denmark|dk)\b/i, iso2: 'DK' },
  { re: /\b(poland|pl)\b/i, iso2: 'PL' },
  { re: /\b(czech|cz)\b/i, iso2: 'CZ' },
  { re: /\b(slovakia|sk)\b/i, iso2: 'SK' },
  { re: /\b(hungary|hu)\b/i, iso2: 'HU' },
  { re: /\b(romania|ro)\b/i, iso2: 'RO' },
  { re: /\b(bulgaria|bg)\b/i, iso2: 'BG' },
  { re: /\b(ukraine|ua)\b/i, iso2: 'UA' },
  { re: /\b(japan|jp)\b/i, iso2: 'JP' },
  { re: /\b(korea|kr)\b/i, iso2: 'KR' },
  { re: /\b(china|cn)\b/i, iso2: 'CN' },
  { re: /\b(india|in)\b/i, iso2: 'IN' },
  { re: /\b(australia|au)\b/i, iso2: 'AU' },
  { re: /\b(new zealand|nz)\b/i, iso2: 'NZ' },
  { re: /\b(singapore|sg)\b/i, iso2: 'SG' },
  { re: /\b(brazil|br)\b/i, iso2: 'BR' },
  { re: /\b(argentina|ar)\b/i, iso2: 'AR' },
  { re: /\b(eu-central|euwest|europe-west|europe-central|frankfurt|paris|london|ireland|stockholm)\b/i, iso2: 'DE' },
  { re: /\b(us-east|us-west|virginia|ohio|oregon|california|n\.?virginia)\b/i, iso2: 'US' },
  { re: /\b(ap-southeast|ap-northeast|tokyo|sydney|mumbai|singapore)\b/i, iso2: 'SG' },
];

function continentSlug(r: string): string | null {
  const x = r.trim().toLowerCase();
  if (!x) return null;
  if (x.includes('north america') || x === 'na' || x === 'north-america') return 'north-america';
  if (x.includes('south america') || x === 'sa' || x === 'south-america') return 'south-america';
  if (x.includes('europe') || x === 'eu') return 'europe';
  if (x.includes('africa') || x === 'af') return 'africa';
  if (x.includes('asia') || x === 'as') return 'asia';
  if (x.includes('oceania') || x.includes('australia') || x === 'au' || x === 'oc') return 'oceania';
  return null;
}

function tryIso2(raw: string): string | null {
  const t = raw.trim().toUpperCase();
  if (t.length === 2 && COUNTRY_CENTROID[t]) return t;
  const lower = raw.trim().toLowerCase();
  for (const { re, iso2 } of REGION_ALIAS_TO_ISO2) {
    if (re.test(lower)) return iso2;
  }
  // eu-central-1 style
  if (/^eu-|^europe-/i.test(raw)) return 'DE';
  if (/^us-|^na-/i.test(raw)) return 'US';
  if (/^ap-/i.test(raw)) return 'SG';
  if (/^sa-/i.test(raw)) return 'BR';
  if (/^af-/i.test(raw)) return 'ZA';
  if (/^me-/i.test(raw)) return 'AE';
  return null;
}

export function resolveNodeMapGeo(region: string | null | undefined): NodeMapGeo {
  const raw = (region ?? '').trim();
  if (!raw) {
    const c = CONTINENT.europe;
    return { key: 'continent:europe', label: `${c.label} (unknown region)`, lat: c.lat, lng: c.lng };
  }

  const iso = tryIso2(raw);
  if (iso && COUNTRY_CENTROID[iso]) {
    const c = COUNTRY_CENTROID[iso];
    return { key: `country:${iso}`, label: c.label, lat: c.lat, lng: c.lng };
  }

  const cont = continentSlug(raw);
  if (cont && CONTINENT[cont]) {
    const c = CONTINENT[cont];
    return { key: `continent:${cont}`, label: c.label, lat: c.lat, lng: c.lng };
  }

  // Unknown string: single letter codes etc.
  const c = CONTINENT.europe;
  return {
    key: `unknown:${raw.toLowerCase().slice(0, 32)}`,
    label: raw.length > 28 ? `${raw.slice(0, 28)}…` : raw,
    lat: c.lat,
    lng: c.lng,
  };
}
