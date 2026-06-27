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

/** Premium add-on: highlighted slot (one-time, not multiplied by duration). No tier discount. */
export const ADS_FEATURED_HIGHLIGHT_KAS = 20;

/** Premium add-on: +5 seconds of carousel exposure before advancing (one-time). No tier discount. */
export const ADS_EXTENDED_EXPOSURE_KAS = 30;
export const ADS_EXTENDED_EXPOSURE_SECONDS = 5;

/**
 * Native KAS bundled with the binding payload when the creative fee is settled in KREX (KRC-20).
 * Keeps an L1 output to the ads treasury for discovery alongside payload-bearing txs.
 */
export const ADS_KREX_BINDING_FEE_KAS = 0.02;

/** Optional hover promo line on ad creatives (stored in campaign metadata). */
export const ADS_MAX_PROMO_TOOLTIP_CHARS = 60;
