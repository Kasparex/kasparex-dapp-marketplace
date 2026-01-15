'use client';

export function KREXNFTMultipliersBox() {
  // Mock multipliers (for simulation)
  const mockKrexTier = 'Tier1'; // Default tier
  const mockKrexMultiplier = 1;
  const mockNftMultiplier = 1;
  const mockNodeMultiplier = 1;
  const mockSeasonalMultiplier = 1;
  const mockTotalMultiplier = mockKrexMultiplier * mockNftMultiplier * mockNodeMultiplier * mockSeasonalMultiplier;

  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
        KREX/NFT/Node Multipliers
      </h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">KREX Tier:</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {mockKrexTier} ({mockKrexMultiplier}x)
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">NFT Multiplier:</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {mockNftMultiplier}x
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">Node Multiplier:</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {mockNodeMultiplier}x
          </span>
        </div>
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Total Multiplier:</span>
            <span className="font-bold text-[#02abb8]">
              {mockTotalMultiplier.toFixed(2)}x
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

