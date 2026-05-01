/**
 * Geography for the /nodes map - 100% static, no geocoding APIs or usage-based costs.
 *
 * Resolution order:
 * 1. Explicit WGS84 in `region`, e.g. `52.2297,21.0122` (comma-separated lat,lng).
 * 2. Common cloud / AZ-style slugs (bundled coordinates near the advertised region).
 * 3. ISO 3166-1 alpha-2 or known country name → representative point (capital; good map fit).
 * 4. Continent name / slug.
 *
 * Operators who want an exact pin can set `region` to `lat,lng` from any GPS or map click.
 */

export type NodeMapGeo = {
  /** Stable key for aggregation */
  key: string;
  label: string;
  lat: number;
  lng: number;
};

/** Longer / more specific patterns first. */
const CLOUD_REGION_GEO: { re: RegExp; lat: number; lng: number; label: string }[] = [
  { re: /\beu-central-2\b/i, lat: 47.3769, lng: 8.5417, label: 'EU Central 2 (Zurich area)' },
  { re: /\beu-central-1\b|^eu-central$/i, lat: 50.1109, lng: 8.6821, label: 'EU Central 1 (Frankfurt area)' },
  { re: /\beu-west-1\b/i, lat: 53.3498, lng: -6.2603, label: 'EU West 1 (Dublin area)' },
  { re: /\beu-west-2\b/i, lat: 51.5074, lng: -0.1278, label: 'EU West 2 (London area)' },
  { re: /\beu-west-3\b/i, lat: 48.8566, lng: 2.3522, label: 'EU West 3 (Paris area)' },
  { re: /\beu-north-1\b/i, lat: 59.3293, lng: 18.0686, label: 'EU North 1 (Stockholm area)' },
  { re: /\beu-south-1\b/i, lat: 45.4642, lng: 9.19, label: 'EU South 1 (Milan area)' },
  { re: /\beu-south-2\b/i, lat: 37.3891, lng: -5.9845, label: 'EU South 2 (Spain south)' },
  { re: /\beu-west\b|\beurope-west\b/i, lat: 51.5074, lng: -0.1278, label: 'EU West' },
  { re: /\beu-central\b|\beurope-central\b|\bfrankfurt\b/i, lat: 50.1109, lng: 8.6821, label: 'EU Central' },
  { re: /\beu-north\b|\bstockholm\b/i, lat: 59.3293, lng: 18.0686, label: 'EU North' },
  { re: /\beu-south\b/i, lat: 45.4642, lng: 9.19, label: 'EU South' },
  { re: /\beu-west-?\d\b/i, lat: 48.8566, lng: 2.3522, label: 'EU' },
  { re: /\bus-gov-east-1\b|\bus-east-1\b|\buse1\b/i, lat: 38.9072, lng: -77.0369, label: 'US East (N. Virginia area)' },
  { re: /\bus-east-2\b|\buse2\b/i, lat: 39.9612, lng: -82.9988, label: 'US East (Ohio area)' },
  { re: /\bus-west-1\b|\busw1\b/i, lat: 37.7749, lng: -122.4194, label: 'US West (N. California area)' },
  { re: /\bus-west-2\b|\busw2\b|\boregon\b/i, lat: 45.5152, lng: -122.6784, label: 'US West (Oregon area)' },
  { re: /\bca-central-1\b|\bcanada-central\b/i, lat: 45.5017, lng: -73.5673, label: 'Canada Central (Montreal area)' },
  { re: /\bap-southeast-1\b|\bsingapore\b/i, lat: 1.3521, lng: 103.8198, label: 'AP Southeast 1 (Singapore)' },
  { re: /\bap-southeast-2\b|\bsydney\b/i, lat: -33.8688, lng: 151.2093, label: 'AP Southeast 2 (Sydney area)' },
  { re: /\bap-northeast-1\b|\btokyo\b/i, lat: 35.6762, lng: 139.6503, label: 'AP Northeast 1 (Tokyo area)' },
  { re: /\bap-northeast-2\b|\bseoul\b/i, lat: 37.5665, lng: 126.978, label: 'AP Northeast 2 (Seoul area)' },
  { re: /\bap-south-1\b|\bmumbai\b/i, lat: 19.076, lng: 72.8777, label: 'AP South 1 (Mumbai area)' },
  { re: /\bap-east-1\b|\bhongkong\b|\bhong kong\b/i, lat: 22.3193, lng: 114.1694, label: 'AP East (Hong Kong area)' },
  { re: /\bsa-east-1\b|\bsa1\b|\bsão paulo\b|\bsao paulo\b/i, lat: -23.5505, lng: -46.6333, label: 'SA East 1 (São Paulo area)' },
  { re: /^us-|^na-/i, lat: 39.8283, lng: -98.5795, label: 'US (generic region code)' },
  { re: /^ap-/i, lat: 1.3521, lng: 103.8198, label: 'Asia-Pacific (generic)' },
  { re: /^sa-/i, lat: -23.5505, lng: -46.6333, label: 'South America (generic)' },
  { re: /^af-/i, lat: -26.2041, lng: 28.0473, label: 'Africa (generic)' },
  { re: /^me-/i, lat: 25.2048, lng: 55.2708, label: 'Middle East (generic)' },
];

/** ISO2 → capital-class coordinates (WGS84) for map pins; no network calls. */
const COUNTRY_POINT: Record<string, { lat: number; lng: number; label: string }> = {
  AD: { lat: 42.5063, lng: 1.5218, label: 'Andorra' },
  AE: { lat: 24.4539, lng: 54.3773, label: 'United Arab Emirates' },
  AR: { lat: -34.6037, lng: -58.3816, label: 'Argentina' },
  AT: { lat: 48.2082, lng: 16.3738, label: 'Austria' },
  AU: { lat: -35.2809, lng: 149.13, label: 'Australia' },
  BE: { lat: 50.8503, lng: 4.3517, label: 'Belgium' },
  BR: { lat: -15.7939, lng: -47.8828, label: 'Brazil' },
  CA: { lat: 45.4215, lng: -75.6972, label: 'Canada' },
  CH: { lat: 46.948, lng: 7.4474, label: 'Switzerland' },
  CL: { lat: -33.4489, lng: -70.6693, label: 'Chile' },
  CN: { lat: 39.9042, lng: 116.4074, label: 'China' },
  CO: { lat: 4.711, lng: -74.0721, label: 'Colombia' },
  CZ: { lat: 50.0755, lng: 14.4378, label: 'Czechia' },
  DE: { lat: 52.52, lng: 13.405, label: 'Germany' },
  DK: { lat: 55.6761, lng: 12.5683, label: 'Denmark' },
  EE: { lat: 59.437, lng: 24.7536, label: 'Estonia' },
  EG: { lat: 30.0444, lng: 31.2357, label: 'Egypt' },
  ES: { lat: 40.4168, lng: -3.7038, label: 'Spain' },
  FI: { lat: 60.1699, lng: 24.9384, label: 'Finland' },
  FR: { lat: 48.8566, lng: 2.3522, label: 'France' },
  GB: { lat: 51.5074, lng: -0.1278, label: 'United Kingdom' },
  GR: { lat: 37.9838, lng: 23.7275, label: 'Greece' },
  HK: { lat: 22.3193, lng: 114.1694, label: 'Hong Kong' },
  HR: { lat: 45.815, lng: 15.9819, label: 'Croatia' },
  HU: { lat: 47.4979, lng: 19.0402, label: 'Hungary' },
  ID: { lat: -6.2088, lng: 106.8456, label: 'Indonesia' },
  IE: { lat: 53.3498, lng: -6.2603, label: 'Ireland' },
  IL: { lat: 31.7683, lng: 35.2137, label: 'Israel' },
  IN: { lat: 28.6139, lng: 77.209, label: 'India' },
  IS: { lat: 64.1466, lng: -21.9426, label: 'Iceland' },
  IT: { lat: 41.9028, lng: 12.4964, label: 'Italy' },
  JP: { lat: 35.6762, lng: 139.6503, label: 'Japan' },
  KE: { lat: -1.2921, lng: 36.8219, label: 'Kenya' },
  KR: { lat: 37.5665, lng: 126.978, label: 'South Korea' },
  LT: { lat: 54.6872, lng: 25.2797, label: 'Lithuania' },
  LU: { lat: 49.6116, lng: 6.1319, label: 'Luxembourg' },
  LV: { lat: 56.9496, lng: 24.1052, label: 'Latvia' },
  MX: { lat: 19.4326, lng: -99.1332, label: 'Mexico' },
  MY: { lat: 3.139, lng: 101.6869, label: 'Malaysia' },
  NG: { lat: 9.0765, lng: 7.3986, label: 'Nigeria' },
  NL: { lat: 52.3676, lng: 4.9041, label: 'Netherlands' },
  NO: { lat: 59.9139, lng: 10.7522, label: 'Norway' },
  NZ: { lat: -41.2865, lng: 174.7762, label: 'New Zealand' },
  PH: { lat: 14.5995, lng: 120.9842, label: 'Philippines' },
  PL: { lat: 52.2297, lng: 21.0122, label: 'Poland' },
  PT: { lat: 38.7223, lng: -9.1393, label: 'Portugal' },
  RO: { lat: 44.4268, lng: 26.1025, label: 'Romania' },
  RS: { lat: 44.7866, lng: 20.4489, label: 'Serbia' },
  RU: { lat: 55.7558, lng: 37.6173, label: 'Russia' },
  SA: { lat: 24.7136, lng: 46.6753, label: 'Saudi Arabia' },
  SE: { lat: 59.3293, lng: 18.0686, label: 'Sweden' },
  SG: { lat: 1.3521, lng: 103.8198, label: 'Singapore' },
  SI: { lat: 46.0569, lng: 14.5058, label: 'Slovenia' },
  SK: { lat: 48.1486, lng: 17.1077, label: 'Slovakia' },
  TH: { lat: 13.7563, lng: 100.5018, label: 'Thailand' },
  TR: { lat: 41.0082, lng: 28.9784, label: 'Türkiye' },
  TW: { lat: 25.033, lng: 121.5654, label: 'Taiwan' },
  UA: { lat: 50.4501, lng: 30.5234, label: 'Ukraine' },
  US: { lat: 38.9072, lng: -77.0369, label: 'United States' },
  VN: { lat: 21.0285, lng: 105.8542, label: 'Vietnam' },
  ZA: { lat: -25.7479, lng: 28.2293, label: 'South Africa' },
  BG: { lat: 42.6977, lng: 23.3219, label: 'Bulgaria' },
};

const CONTINENT: Record<string, { lat: number; lng: number; label: string }> = {
  'north-america': { lat: 45, lng: -100, label: 'North America' },
  'south-america': { lat: -15, lng: -60, label: 'South America' },
  europe: { lat: 54, lng: 15, label: 'Europe' },
  africa: { lat: 1, lng: 20, label: 'Africa' },
  asia: { lat: 35, lng: 100, label: 'Asia' },
  oceania: { lat: -25, lng: 135, label: 'Oceania' },
};

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

function parseExplicitLatLng(raw: string): NodeMapGeo | null {
  const t = raw.trim();
  const m = t.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const key = `gps:${lat.toFixed(4)},${lng.toFixed(4)}`;
  return { key, label: 'Custom (lat,lng)', lat, lng };
}

function tryCloudRegion(raw: string): NodeMapGeo | null {
  const s = raw.trim();
  if (!s) return null;
  for (const row of CLOUD_REGION_GEO) {
    if (row.re.test(s)) {
      const slug = s.toLowerCase().replace(/\s+/g, '-').slice(0, 48);
      return {
        key: `cloud:${slug}`,
        label: row.label,
        lat: row.lat,
        lng: row.lng,
      };
    }
  }
  return null;
}

function tryIso2(raw: string): string | null {
  const t = raw.trim().toUpperCase();
  if (t.length === 2 && COUNTRY_POINT[t]) return t;
  const lower = raw.trim().toLowerCase();
  for (const { re, iso2 } of REGION_ALIAS_TO_ISO2) {
    if (re.test(lower)) return iso2;
  }
  return null;
}

export function resolveNodeMapGeo(region: string | null | undefined): NodeMapGeo {
  const raw = (region ?? '').trim();
  if (!raw) {
    const c = CONTINENT.europe;
    return { key: 'continent:europe', label: `${c.label} (unknown region)`, lat: c.lat, lng: c.lng };
  }

  const explicit = parseExplicitLatLng(raw);
  if (explicit) return explicit;

  const cloud = tryCloudRegion(raw);
  if (cloud) return cloud;

  const iso = tryIso2(raw);
  if (iso && COUNTRY_POINT[iso]) {
    const c = COUNTRY_POINT[iso];
    return { key: `country:${iso}`, label: c.label, lat: c.lat, lng: c.lng };
  }

  const cont = continentSlug(raw);
  if (cont && CONTINENT[cont]) {
    const c = CONTINENT[cont];
    return { key: `continent:${cont}`, label: c.label, lat: c.lat, lng: c.lng };
  }

  const c = CONTINENT.europe;
  return {
    key: `unknown:${raw.toLowerCase().slice(0, 32)}`,
    label: raw.length > 28 ? `${raw.slice(0, 28)}…` : raw,
    lat: c.lat,
    lng: c.lng,
  };
}
