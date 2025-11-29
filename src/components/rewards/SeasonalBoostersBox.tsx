'use client';

// Mock seasonal multiplier (for simulation)
const mockSeasonalMultiplier = 1;

export function SeasonalBoostersBox() {
  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
        Seasonal Boosters
      </h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">Current Boost:</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {((mockSeasonalMultiplier - 1) * 100).toFixed(0)}%
          </span>
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {mockSeasonalMultiplier > 1 ? 'Active boosters applied' : 'No active boosters'}
        </div>
      </div>
    </div>
  );
}

