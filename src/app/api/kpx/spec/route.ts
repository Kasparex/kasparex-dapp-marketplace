import { NextResponse } from 'next/server';
import { KPX_CM_RT_CODES_V1, KPX_MAX_BYTES, KPX_PROTOCOL, KPX_SEQ_MAX, KPX_SEQ_MIN, KPX_VERSION } from '@/lib/kpx/constants';

export async function GET() {
  return NextResponse.json({
    p: KPX_PROTOCOL,
    v: KPX_VERSION,
    seq: { min: KPX_SEQ_MIN, max: KPX_SEQ_MAX },
    maxBytes: KPX_MAX_BYTES,
    cm: { rtCodesV1: KPX_CM_RT_CODES_V1 },
    referenceRoutes: {
      parse: '/api/kpx/parse',
      spec: '/api/kpx/spec',
      pf: '/api/kpx/pf/{addr}',
      ver: '/api/kpx/ver/{addr}',
      lnk: '/api/kpx/lnk/{addr}',
      cm: '/api/kpx/cm/{addr}?rt={rt}&rid={rid}',
      cmSummary: '/api/kpx/cm/{addr}/summary',
      kpxToolsUi: '/protocols/kpx-tools',
    },
    indexerQueryParams:
      'All chain-backed kpx routes accept: net (mainnet|testnet), limit (20–500), offset (0–50000, Kaspa REST paging). cm/summary also accepts max_resources (1–500, default 100). Client helpers: src/hooks/useKpxIndexer.ts, src/hooks/useKpxPublicIdentity.ts.',
    kasparexVerifiedPolicy:
      'GET /api/kpx/ver/{addr}?policy=kasparex adds `kasparex: { mode, inAllowlist, verifiedBadge }`. If env KPX_VERIFIED_KASPA_ALLOWLIST is empty, mode=inherit and verifiedBadge mirrors on-chain `verified`. If set, mode=allowlist and verifiedBadge requires on-chain verified plus allowlist membership.',
    note: 'This endpoint describes the Kasparex reference implementation for kpx v1 parsing/limits.',
  });
}

