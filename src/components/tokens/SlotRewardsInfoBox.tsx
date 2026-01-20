/**
 * Slot Rewards Info Box Component
 * 
 * Information panel explaining slot rewards
 */

export function SlotRewardsInfoBox() {
  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-2">
        Slot Rewards
      </h3>
      <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
        <li>• Slot payouts occur only when mints happen through this page</li>
        <li>• Slot positions rotate automatically after each mint</li>
        <li>• Earnings depend on demand and promotion effort</li>
        <li>• There are no guaranteed returns</li>
      </ul>
    </div>
  );
}
