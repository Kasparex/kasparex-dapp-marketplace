'use client';

import Link from 'next/link';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import {
  CHRONICLES_LB_POINTS_PER_READ_CONFIRM,
  CHRONICLES_LB_READ_CONFIRM_KAS,
} from '@/lib/chronicles/leaderboard/constants';
import {
  RX_HISTORY_FOOTER_NOTE,
  RX_HISTORY_TABLE,
  RX_HISTORY_TABLE_SHELL,
  RX_HISTORY_TD,
  RX_HISTORY_THEAD,
  RX_HISTORY_TH,
  RX_HISTORY_TR,
} from '@/components/rewards/rewardsHistoryTableChrome';

type Row = { hubActivity: string; typicalPts: string; howToEarn: string };

const ROWS: Row[] = [
  {
    hubActivity: 'Qualified dApp usage',
    typicalPts: String(HUB_EARN_POINTS.dappL1Interaction),
    howToEarn:
      'Interact with Kasparex Hub dApps when your Kaspa L1 profile qualifies; points credit after classified L1 confirmations per flow.',
  },
  {
    hubActivity: 'vBlog: new article',
    typicalPts: String(HUB_EARN_POINTS.vblogArticleCreate),
    howToEarn: 'Publish a new anchored article from vBlog once the bundle Kaspa tx succeeds.',
  },
  {
    hubActivity: 'vBlog: update article',
    typicalPts: String(HUB_EARN_POINTS.vblogArticleUpdate),
    howToEarn: 'Update an existing anchored article after the update Kaspa tx succeeds.',
  },
  {
    hubActivity: 'CrowdKAS campaign',
    typicalPts: String(HUB_EARN_POINTS.crowdkasCampaignCreate),
    howToEarn: 'Create a campaign from CrowdKAS studio with your Kaspa L1 tied to it; fires when the studio create tx settles.',
  },
  {
    hubActivity: 'Store listing',
    typicalPts: String(HUB_EARN_POINTS.storeProductList),
    howToEarn: 'Submit a storefront product after paying the Kaspa listing flow used by Store submission.',
  },
  {
    hubActivity: 'Magazine or page publish',
    typicalPts: String(HUB_EARN_POINTS.magazineIssuePublish),
    howToEarn: 'Upload issue metadata to IPFS then complete the Kaspa binding fee tx from the magazines editor.',
  },
  {
    hubActivity: 'Hub ads placement',
    typicalPts: String(HUB_EARN_POINTS.hubAdPlacement),
    howToEarn: 'Finish Kaspa-paid ad binding from the Ads wizard after metadata is anchored.',
  },
  {
    hubActivity: 'Krex node enrollment',
    typicalPts: String(HUB_EARN_POINTS.krexNodeEnrollmentOnce),
    howToEarn: 'Verify node enrollment once in the Nodes flow when onboarding succeeds.',
  },
  {
    hubActivity: 'Krex node operation',
    typicalPts: String(HUB_EARN_POINTS.krexNodeOperatorDaily),
    howToEarn: 'Operate a tracked node when the Nodes dashboard catches a qualifying epoch row; daily cap per policy.',
  },
  {
    hubActivity: 'Chronicles read confirm',
    typicalPts: String(CHRONICLES_LB_POINTS_PER_READ_CONFIRM),
    howToEarn: `Paid read confirmations in Chronicles (${CHRONICLES_LB_READ_CONFIRM_KAS} KAS) each season.`,
  },
  {
    hubActivity: 'Chronicles NFT slots',
    typicalPts: 'Varies',
    howToEarn: 'Slot swaps and confirmations move seasonal leaderboard scoring; redeemable deltas follow Chronicles slot rules.',
  },
  {
    hubActivity: 'Minecore Diamonds to pts',
    typicalPts: 'Varies',
    howToEarn: 'Refine Diamonds inside Minecore hub experiences into your gameplay-linked pts bucket, then redeem or spend.',
  },
  {
    hubActivity: 'Other hub programs',
    typicalPts: 'Varies',
    howToEarn: 'Imports or partner drops may attach under legacy imports or Rewards catalog earns; History shows every line.',
  },
];

/** Single reference table of hub-earn channels (matches History table chrome). */
export function RewardsEarnSourcesTable() {
  return (
    <div className={RX_HISTORY_TABLE_SHELL}>
      <table className={RX_HISTORY_TABLE}>
        <thead className={RX_HISTORY_THEAD}>
          <tr>
            <th className={RX_HISTORY_TH}>Hub activity</th>
            <th className={`${RX_HISTORY_TH} whitespace-nowrap`}>Typical pts</th>
            <th className={RX_HISTORY_TH}>How you earn</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.hubActivity} className={RX_HISTORY_TR}>
              <td className={`${RX_HISTORY_TD} text-zinc-800 dark:text-zinc-200 font-medium`}>{r.hubActivity}</td>
              <td className={`${RX_HISTORY_TD} text-right font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-300 whitespace-nowrap`}>
                {r.typicalPts}
              </td>
              <td className={`${RX_HISTORY_TD} text-xs text-zinc-600 dark:text-zinc-400`}>{r.howToEarn}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={RX_HISTORY_FOOTER_NOTE}>
        Amounts tune over time with policy constants. Spending in Catalog (offers or token pools) appears in{' '}
        <Link href="/rewards#rewards-history" className="text-[#02abb8] hover:underline font-medium">
          History
        </Link>{' '}
        as redeem rows. Ledger stays on this device until backend sync arrives.
      </div>
    </div>
  );
}
