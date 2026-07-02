import { KREX_TIER_PERKS_ROWS, formatHubPointsTierLabel } from '@/lib/rewards/hub-points';
import { TierBadge } from '@/components/rewards/TierBadge';

export function KrexTierPerksTooltipTable({ title = 'KREX tier perks' }: { title?: string }) {
  return (
    <div className="space-y-2 text-left max-w-md">
      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-300/80 dark:border-zinc-600">
            <th className="pb-1.5 pr-2 text-left font-semibold">Tier</th>
            <th className="pb-1.5 pr-2 text-left font-semibold">KREX held</th>
            <th className="pb-1.5 pr-2 text-left font-semibold">Fee discount</th>
            <th className="pb-1.5 text-left font-semibold">Hub Points</th>
          </tr>
        </thead>
        <tbody className="text-zinc-700 dark:text-zinc-300">
          {KREX_TIER_PERKS_ROWS.map((row) => (
            <tr key={row.tier}>
              <td className="py-1 pr-2 align-middle">
                <TierBadge tier={row.tier} isUnlocked={row.tier !== 'Tier0'} />
              </td>
              <td className="py-1 pr-2 align-middle whitespace-nowrap">{row.thresholdLabel}</td>
              <td className="py-1 pr-2 align-middle whitespace-nowrap">
                {row.feeDiscountPercent > 0 ? `${row.feeDiscountPercent}% off` : 'None'}
              </td>
              <td className="py-1 align-middle whitespace-nowrap">{formatHubPointsTierLabel(row.tier)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
