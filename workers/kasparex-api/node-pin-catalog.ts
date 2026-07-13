import catalog from '../config/node-pin-catalog.json';

export type NodePinCatalog = {
  gateways: string[];
  recommendedCids: string[];
};

const DEFAULT_GATEWAYS = [
  'https://storacha.network/ipfs/{cid}',
  'https://ipfs.io/ipfs/{cid}',
  'https://{cid}.ipfs.dweb.link',
];

function normalizeCid(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s) return null;
  const m = s.match(/(?:ipfs:\/\/|\/ipfs\/)([a-zA-Z0-9]+)/i);
  if (m?.[1]) return m[1];
  if (/^[a-zA-Z0-9]+$/.test(s) && s.length >= 32) return s;
  return null;
}

export function buildNodePinCatalog(env: { REGISTRY_CID?: string }): NodePinCatalog {
  const cfg = catalog as NodePinCatalog;
  const gateways = Array.isArray(cfg.gateways) && cfg.gateways.length ? cfg.gateways : DEFAULT_GATEWAYS;
  const seen = new Set<string>();
  const recommendedCids: string[] = [];

  const push = (raw: string) => {
    const cid = normalizeCid(raw);
    if (!cid || seen.has(cid)) return;
    seen.add(cid);
    recommendedCids.push(cid);
  };

  for (const c of cfg.recommendedCids ?? []) push(c);
  if (env.REGISTRY_CID) push(env.REGISTRY_CID);

  return { gateways, recommendedCids };
}

export function gatewayUrlForCid(template: string, cid: string, subpath = ''): string {
  const base = template.replace(/\{cid\}/g, cid).replace(/\/$/, '');
  if (!subpath) return base;
  const path = subpath.startsWith('/') ? subpath : `/${subpath}`;
  return `${base}${path}`;
}
