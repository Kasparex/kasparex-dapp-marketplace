'use client';

import Link from 'next/link';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import {
  RX_HISTORY_FOOTER_NOTE,
  RX_HISTORY_TABLE,
  RX_HISTORY_TABLE_SHELL,
  RX_HISTORY_TD,
  RX_HISTORY_THEAD,
  RX_HISTORY_TH,
  RX_HISTORY_TR,
} from '@/components/rewards/rewardsHistoryTableChrome';

const SECTION_HEAD =
  `${RX_HISTORY_TD} bg-zinc-100 dark:bg-zinc-800/60 text-xs font-black uppercase tracking-widest text-[#02abb8] scroll-mt-24 py-3`;

/** Redeemable hub programs (Balances tab math and catalog spend). */
const REDEEMABLE_ROWS = [
  {
    scope: 'Redeem balance',
    topic: 'Qualified dApp usage',
    typical: String(HUB_EARN_POINTS.dappL1Interaction),
    notes:
      'Interact with Kasparex Hub dApps when your Kaspa L1 profile qualifies; points credit after classified L1 confirmations per flow.',
  },
  {
    scope: 'Redeem balance',
    topic: 'vBlog: new article',
    typical: String(HUB_EARN_POINTS.vblogArticleCreate),
    notes: 'Publish a new anchored article from vBlog once the bundle Kaspa tx succeeds.',
  },
  {
    scope: 'Redeem balance',
    topic: 'vBlog: update article',
    typical: String(HUB_EARN_POINTS.vblogArticleUpdate),
    notes: 'Update an existing anchored article after the update Kaspa tx succeeds.',
  },
  {
    scope: 'Redeem balance',
    topic: 'CrowdKAS campaign',
    typical: String(HUB_EARN_POINTS.crowdkasCampaignCreate),
    notes: 'Create a campaign from CrowdKAS studio with your Kaspa L1 tied to it; fires when the studio create tx settles.',
  },
  {
    scope: 'Redeem balance',
    topic: 'Store listing',
    typical: String(HUB_EARN_POINTS.storeProductList),
    notes: 'Submit a storefront product after paying the Kaspa listing flow used by Store submission.',
  },
  {
    scope: 'Redeem balance',
    topic: 'Magazine or page publish',
    typical: String(HUB_EARN_POINTS.magazineIssuePublish),
    notes: 'Upload issue metadata to IPFS then complete the Kaspa binding fee tx from the magazines editor.',
  },
  {
    scope: 'Redeem balance',
    topic: 'Hub ads placement',
    typical: String(HUB_EARN_POINTS.hubAdPlacement),
    notes: 'Finish Kaspa-paid ad binding from the Ads wizard after metadata is anchored.',
  },
  {
    scope: 'Redeem balance',
    topic: 'Chronicles chapter quiz',
    typical: String(HUB_EARN_POINTS.chroniclesQuizComplete),
    notes: 'Pass the paid lore quiz on an official chapter after your entry Kaspa tx is verified.',
  },
  {
    scope: 'Redeem balance',
    topic: 'Krex node enrollment',
    typical: String(HUB_EARN_POINTS.krexNodeEnrollmentOnce),
    notes: 'Verify node enrollment once in the Nodes flow when onboarding succeeds.',
  },
  {
    scope: 'Redeem balance',
    topic: 'Krex node operation',
    typical: String(HUB_EARN_POINTS.krexNodeOperatorDaily),
    notes: 'Operate a tracked node when the Nodes dashboard catches a qualifying epoch row; daily cap per policy.',
  },
  {
    scope: 'Gameplay bucket',
    topic: 'Minecore refine',
    typical: 'Varies',
    notes:
      'Refine Diamonds stored in Minecore into gameplay-linked refinement points on this device (same pts bucket Unified Redeem merges with Hub ledger totals). Lost plant runs do not revoke refined points.',
  },
  {
    scope: 'Varies',
    topic: 'Other hub programs',
    typical: 'Varies',
    notes: 'Imports or partner drops may attach under legacy imports or Rewards catalog earns; History keeps one append-only ledger per wallet blob.',
  },
] as const;

/** Unified reference for redeemable pts and Minecore linkage. */
export function RewardsEarnSourcesTable() {
  return (
    <div className={RX_HISTORY_TABLE_SHELL}>
      <table className={RX_HISTORY_TABLE}>
        <thead className={RX_HISTORY_THEAD}>
          <tr>
            <th className={RX_HISTORY_TH}>Program scope</th>
            <th className={RX_HISTORY_TH}>Topic</th>
            <th className={`${RX_HISTORY_TH} whitespace-nowrap text-right`}>Typical weight</th>
            <th className={RX_HISTORY_TH}>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr className={RX_HISTORY_TR}>
            <td id="rewards-points-redeem" colSpan={4} className={SECTION_HEAD}>
              Hub redeem balance and gameplay bucket
            </td>
          </tr>
          {REDEEMABLE_ROWS.map((r) => (
            <tr key={`${r.scope}:${r.topic}`} className={RX_HISTORY_TR}>
              <td className={`${RX_HISTORY_TD} text-zinc-500 dark:text-zinc-400 whitespace-nowrap`}>{r.scope}</td>
              <td className={`${RX_HISTORY_TD} text-zinc-900 dark:text-zinc-100 font-medium`}>{r.topic}</td>
              <td className={`${RX_HISTORY_TD} text-right font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-300 whitespace-nowrap`}>
                {r.typical}
              </td>
              <td className={`${RX_HISTORY_TD} text-xs text-zinc-600 dark:text-zinc-400`}>{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={RX_HISTORY_FOOTER_NOTE}>
        Policy constants evolve over time. Spending in Catalog (offers or token pools) lands in{' '}
        <Link href="/rewards#rewards-history" className="text-[#02abb8] hover:underline font-medium">
          History
        </Link>
        {' '}as redeem rows. Ledger storage is per wallet on-device (compact JSON capped on write), while production backend paths use pooled `pts_events` / `pts_balances` rows.
      </div>
    </div>
  );
}
