import type { KpxResourceTypeCodeV1 } from './types';

export const KPX_PROTOCOL = 'kpx' as const;
export const KPX_VERSION = 1 as const;

export const KPX_SEQ_MIN = 1;
export const KPX_SEQ_MAX = 2_147_483_647;

export const KPX_MAX_BYTES = {
  pf: 512,
  cm: 256,
  lnk: 256,
  ver: 192,
} as const;

export const KPX_CM_RT_CODES_V1: ReadonlyArray<KpxResourceTypeCodeV1> = [
  'vb',
  'ck',
  'st',
  'dp',
  'mg',
  'ad',
  'gm',
];

