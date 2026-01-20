/**
 * Promo Risk Notice Component
 * 
 * Global disclaimer for promo engine
 */

export function PromoRiskNotice() {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
        Important Notice
      </h3>
      <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
        <li>Kasparex does not manage liquidity or trading.</li>
        <li>Token creators are responsible for creating liquidity on external decentralized exchanges.</li>
        <li>Minting a token does not guarantee it will be tradable.</li>
        <li>Rewards depend on real mint activity and demand. No returns are guaranteed.</li>
      </ul>
    </div>
  );
}
