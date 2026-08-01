import { KREX_DECIMALS } from '@/lib/game/diamond-veins-config';

/**
 * Split a token total into seller + platform shares that sum exactly to totalToken
 * (quantized to token decimals). Mirrors KAS fee economics without a second KAS fee.
 */
export function splitTokenPayment(
  totalToken: number,
  sellerKas: number,
  totalKas: number,
  decimals = KREX_DECIMALS,
): { sellerToken: number; platformToken: number } {
  const scale = 10 ** decimals;
  const totalUnits = Math.floor(totalToken * scale + 1e-9);
  if (totalUnits <= 0 || !(totalKas > 0)) {
    return { sellerToken: Math.max(0, totalToken), platformToken: 0 };
  }
  const sellerUnits = Math.min(
    totalUnits,
    Math.max(0, Math.floor((totalUnits * sellerKas) / totalKas + 1e-9)),
  );
  const platformUnits = totalUnits - sellerUnits;
  return {
    sellerToken: sellerUnits / scale,
    platformToken: platformUnits / scale,
  };
}
