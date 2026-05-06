'use client';

import { NFT_POINTS } from '@/lib/leaderboard/nftPoints';
import {
  CHRONICLES_LB_POINTS_PER_READ_CONFIRM,
  CHRONICLES_LB_READ_CONFIRM_KAS,
  CHRONICLES_LB_SLOT_ACTIVATION_KAS,
  CHRONICLES_LB_SLOT_CHANGE_KAS,
} from '@/lib/chronicles/leaderboard/constants';
import {
  RX_HISTORY_TABLE,
  RX_HISTORY_TABLE_SHELL,
  RX_HISTORY_TD,
  RX_HISTORY_THEAD,
  RX_HISTORY_TH,
  RX_HISTORY_TR,
} from '@/components/rewards/rewardsHistoryTableChrome';

/** Leaderboard module scoring tables (styled like History rows). */
export function PointsTables() {
  return (
    <div className="space-y-8">
      <div id="module-scoring-rules" className="scroll-mt-24 space-y-4">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-1">Module scoring rules</p>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Global leaderboard seasonal score from Chronicles confirmations and NFT slot activity. Separate from redeemable pts
            in the table above unless a flow also mirrors into the Rewards ledger.
          </p>
        </div>
        <div className={RX_HISTORY_TABLE_SHELL}>
          <table className={RX_HISTORY_TABLE}>
            <thead className={RX_HISTORY_THEAD}>
              <tr>
                <th className={RX_HISTORY_TH}>Action</th>
                <th className={RX_HISTORY_TH}>Cost</th>
                <th className={RX_HISTORY_TH}>Leaderboard pts</th>
                <th className={RX_HISTORY_TH}>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className={RX_HISTORY_TR}>
                <td className={`${RX_HISTORY_TD} font-medium text-zinc-800 dark:text-zinc-200`} title="One read confirmation per entity per wallet in each season.">
                  Confirm read
                </td>
                <td className={`${RX_HISTORY_TD} text-zinc-600 dark:text-zinc-400`}>{CHRONICLES_LB_READ_CONFIRM_KAS} KAS</td>
                <td className={`${RX_HISTORY_TD} text-right font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-300`}>
                  {CHRONICLES_LB_POINTS_PER_READ_CONFIRM}
                </td>
                <td className={`${RX_HISTORY_TD} text-xs text-zinc-600 dark:text-zinc-400`}>One per entity per wallet per season.</td>
              </tr>
              <tr className={RX_HISTORY_TR}>
                <td className={`${RX_HISTORY_TD} font-medium text-zinc-800 dark:text-zinc-200`} title="Activation unlocks slots 2 and 3 for scoring in the current season.">
                  Activate slot (2–3)
                </td>
                <td className={`${RX_HISTORY_TD} text-zinc-600 dark:text-zinc-400`}>{CHRONICLES_LB_SLOT_ACTIVATION_KAS} KAS</td>
                <td className={`${RX_HISTORY_TD} text-xs text-zinc-500 dark:text-zinc-400 text-right`}>-</td>
                <td className={`${RX_HISTORY_TD} text-xs text-zinc-600 dark:text-zinc-400`}>Unlocks slots for leaderboard scoring.</td>
              </tr>
              <tr className={RX_HISTORY_TR}>
                <td className={`${RX_HISTORY_TD} font-medium text-zinc-800 dark:text-zinc-200`} title="Set and clear updates use last-write-wins and only active slots count.">
                  Set / clear slot
                </td>
                <td className={`${RX_HISTORY_TD} text-zinc-600 dark:text-zinc-400`}>{CHRONICLES_LB_SLOT_CHANGE_KAS} KAS</td>
                <td className={`${RX_HISTORY_TD} text-xs text-zinc-500 dark:text-zinc-400 text-right`}>See slot table</td>
                <td className={`${RX_HISTORY_TD} text-xs text-zinc-600 dark:text-zinc-400`}>
                  Score reflects what is inserted in eligible slots below.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div id="nft-slot-points" className="scroll-mt-24 space-y-4">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-1">NFT slot points</p>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Chronicles slot scoring tiers by collection. Values feed seasonal leaderboard totals.
          </p>
        </div>
        <div className={RX_HISTORY_TABLE_SHELL}>
          <table className={RX_HISTORY_TABLE}>
            <thead className={RX_HISTORY_THEAD}>
              <tr>
                <th className={RX_HISTORY_TH}>Collection type</th>
                <th className={`${RX_HISTORY_TH} text-right whitespace-nowrap`}>Base</th>
                <th className={`${RX_HISTORY_TH} text-right whitespace-nowrap`}>Diamond</th>
                <th className={`${RX_HISTORY_TH} text-right whitespace-nowrap`}>Rare</th>
                <th className={RX_HISTORY_TH}>Examples</th>
              </tr>
            </thead>
            <tbody>
              <tr className={RX_HISTORY_TR}>
                <td className={`${RX_HISTORY_TD} font-medium text-zinc-800 dark:text-zinc-200`}>Premium collections</td>
                <td className={`${RX_HISTORY_TD} text-right font-mono font-semibold tabular-nums`}>{NFT_POINTS.premium.base}</td>
                <td className={`${RX_HISTORY_TD} text-right font-mono font-semibold tabular-nums`}>{NFT_POINTS.premium.diamond}</td>
                <td className={`${RX_HISTORY_TD} text-right font-mono font-semibold tabular-nums`}>{NFT_POINTS.premium.rare}</td>
                <td className={`${RX_HISTORY_TD} text-xs text-zinc-600 dark:text-zinc-400`}>{NFT_POINTS.premiumCollections.join(', ')}</td>
              </tr>
              <tr className={RX_HISTORY_TR}>
                <td className={`${RX_HISTORY_TD} font-medium text-zinc-800 dark:text-zinc-200`}>Partner collections</td>
                <td className={`${RX_HISTORY_TD} text-right font-mono font-semibold tabular-nums`}>{NFT_POINTS.partner.base}</td>
                <td className={`${RX_HISTORY_TD} text-xs text-zinc-500 dark:text-zinc-400 text-right`}>-</td>
                <td className={`${RX_HISTORY_TD} text-xs text-zinc-500 dark:text-zinc-400 text-right`}>-</td>
                <td className={`${RX_HISTORY_TD} text-xs text-zinc-600 dark:text-zinc-400`}>
                  {Object.keys(NFT_POINTS.partnerCollections).join(', ') || '-'}
                </td>
              </tr>
              <tr className={RX_HISTORY_TR}>
                <td className={`${RX_HISTORY_TD} font-medium text-zinc-800 dark:text-zinc-200`}>Standard collections</td>
                <td className={`${RX_HISTORY_TD} text-right font-mono font-semibold tabular-nums`}>{NFT_POINTS.standard.base}</td>
                <td className={`${RX_HISTORY_TD} text-xs text-zinc-500 dark:text-zinc-400 text-right`}>-</td>
                <td className={`${RX_HISTORY_TD} text-xs text-zinc-500 dark:text-zinc-400 text-right`}>-</td>
                <td className={`${RX_HISTORY_TD} text-xs text-zinc-600 dark:text-zinc-400`}>Any other supported collection</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
