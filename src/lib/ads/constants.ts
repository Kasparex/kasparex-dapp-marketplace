/**
 * UTF-8 payload prefix on L1 tx (hex in `sendKaspa` options.payload).
 * Compact form: KasWare often stores the UTF-8 binding as ASCII hex on-chain (double-encoded in REST);
 * a shorter prefix reduces the chance of truncation/corruption.
 * Legacy `kasparex-ad:v1:` is still recognized when decoding.
 */
export const AD_PAYLOAD_PREFIX = 'kxad1:';
export const AD_PAYLOAD_PREFIX_LEGACY = 'kasparex-ad:v1:';

export const ADS_MIN_DURATION_DAYS = 1;
export const ADS_MAX_DURATION_DAYS = 365;

/** Max treasury txs to scan per refresh (bounded lookback) */
export const ADS_TREASURY_TX_LIMIT = 200;
