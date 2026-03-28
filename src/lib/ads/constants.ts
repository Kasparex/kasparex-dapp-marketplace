/**
 * UTF-8 payload prefix on L1 tx (hex-encoded in `sendKaspa` options.payload) for indexer discoverability.
 * KasWare: we pass both `payload` (hex) and `note` (plain) so wallets that only support one field still have a path.
 */
export const AD_PAYLOAD_PREFIX = 'kasparex-ad:v1:';

export const ADS_MIN_DURATION_DAYS = 1;
export const ADS_MAX_DURATION_DAYS = 365;

/** Max treasury txs to scan per refresh (bounded lookback) */
export const ADS_TREASURY_TX_LIMIT = 200;
