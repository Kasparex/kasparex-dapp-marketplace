/** Stub pricing for token listing and page builder (Phase 2). */

export const TOKEN_LISTING_FEES = {
  createListingKas: 25,
  updateListingKas: 5,
  verifyProjectKas: 10,
} as const;

export function estimateTokenPageQuote(options: {
  baseFeeKas?: number;
  moduleIds?: string[];
  modulePriceById?: Record<string, number>;
}): {
  baseFeeKas: number;
  modulesFeeKas: number;
  networkFeeBufferKas: number;
  totalKas: number;
  moduleLines: { id: string; title: string; kas: number }[];
} {
  const baseFeeKas = options.baseFeeKas ?? TOKEN_LISTING_FEES.createListingKas;
  const moduleLines = (options.moduleIds ?? []).map((id) => ({
    id,
    title: id.replace(/_/g, ' '),
    kas: options.modulePriceById?.[id] ?? 0,
  }));
  const modulesFeeKas = moduleLines.reduce((sum, line) => sum + line.kas, 0);
  const networkFeeBufferKas = 0.5;
  const totalKas = Math.round((baseFeeKas + modulesFeeKas + networkFeeBufferKas) * 100) / 100;

  return {
    baseFeeKas,
    modulesFeeKas,
    networkFeeBufferKas,
    totalKas,
    moduleLines,
  };
}
