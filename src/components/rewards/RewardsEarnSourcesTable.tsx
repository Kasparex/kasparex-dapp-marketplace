'use client';

import Link from 'next/link';
import { NFT_POINTS } from '@/lib/leaderboard/nftPoints';
import {
  CHRONICLES_LB_POINTS_PER_READ_CONFIRM,
  CHRONICLES_LB_READ_CONFIRM_KAS,
  CHRONICLES_LB_SLOT_ACTIVATION_KAS,
  CHRONICLES_LB_SLOT_CHANGE_KAS,
} from '@/lib/chronicles/leaderboard/constants';
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
    topic: 'Chronicles NFT slots',
    typical: 'Varies',
    notes: 'Seasonal leaderboard weighting and optional redeem deltas follow Chronicles slot confirmation rules.',
  },
  {
    scope: 'Varies',
    topic: 'Other hub programs',
    typical: 'Varies',
    notes: 'Imports or partner drops may attach under legacy imports or Rewards catalog earns; History keeps one append-only ledger per wallet blob.',
  },
] as const;

const CHRONICLES_ROWS = [
  {
    scope: 'Leaderboard score',
    topic: 'Confirm read',
    typical: String(CHRONICLES_LB_POINTS_PER_READ_CONFIRM),
    notes: `${CHRONICLES_LB_READ_CONFIRM_KAS} KAS. One confirmation per Chronicles entity per wallet per season.`,
  },
  {
    scope: 'Leaderboard score',
    topic: 'Activate slot (2–3)',
    typical: 'N/A (unlock)',
    notes: `${CHRONICLES_LB_SLOT_ACTIVATION_KAS} KAS. Activates Chronicle slots above the free slot for weighted scoring.`,
  },
  {
    scope: 'Leaderboard score',
    topic: 'Set / clear slot',
    typical: 'See tiers',
    notes: `${CHRONICLES_LB_SLOT_CHANGE_KAS} KAS last-write-wins. Active eligible NFTs contribute per the tiers below.`,
  },
] as const;

const NFT_TIER_ROWS = [
  {
    scope: 'Slot tier',
    topic: 'Premium collections',
    typical: `${NFT_POINTS.premium.base} / ${NFT_POINTS.premium.diamond} / ${NFT_POINTS.premium.rare}`,
    notes: `${NFT_POINTS.premiumCollections.join(', ')} tier scores: base vs diamond vs rare token IDs.`,
  },
  {
    scope: 'Slot tier',
    topic: 'Partner collections',
    typical: `${NFT_POINTS.partner.base}`,
    notes: Object.keys(NFT_POINTS.partnerCollections).join(', ') || 'Partner collections tracked in leaderboard config.',
  },
  {
    scope: 'Slot tier',
    topic: 'Standard collections',
    typical: `${NFT_POINTS.standard.base}`,
    notes: 'Any other supported Chronicles collection defaults to Standard base scoring.',
  },
] as const;

/**
 * Unified reference for redeemable pts, Minecore linkage, and seasonal leaderboard scoring rules.
 * One table keeps anchors stable for hashes without duplicating markup per program.
 */
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

          <tr className={RX_HISTORY_TR}>
            <td id="module-scoring-rules" colSpan={4} className={SECTION_HEAD}>
              Chronicles leaderboard modules
            </td>
          </tr>
          <tr className={RX_HISTORY_TR}>
            <td colSpan={4} className={`${RX_HISTORY_TD} text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50/70 dark:bg-zinc-950/40`}>
              Seasonal leaderboard score from confirmations and NFT slot placements. Mirrors into redeemable totals only where a Hub flow records a Rewards ledger delta.
            </td>
          </tr>
          {CHRONICLES_ROWS.map((r) => (
            <tr key={`ch:${r.topic}`} className={RX_HISTORY_TR}>
              <td className={`${RX_HISTORY_TD} text-zinc-500 dark:text-zinc-400 whitespace-nowrap`}>{r.scope}</td>
              <td className={`${RX_HISTORY_TD} text-zinc-900 dark:text-zinc-100 font-medium`}>{r.topic}</td>
              <td className={`${RX_HISTORY_TD} text-right font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-300 whitespace-nowrap`}>
                {r.typical}
              </td>
              <td className={`${RX_HISTORY_TD} text-xs text-zinc-600 dark:text-zinc-400`}>{r.notes}</td>
            </tr>
          ))}

          <tr className={RX_HISTORY_TR}>
            <td id="nft-slot-points" colSpan={4} className={SECTION_HEAD}>
              Chronicles NFT slot tiers
            </td>
          </tr>
          {NFT_TIER_ROWS.map((r) => (
            <tr key={`nft:${r.topic}`} className={RX_HISTORY_TR}>
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
        Policy constants evolve with seasons. Spending in Catalog (offers or token pools) lands in{' '}
        <Link href="/rewards#rewards-history" className="text-[#02abb8] hover:underline font-medium">
          History
        </Link>
        {' '}as redeem rows. Ledger storage is per wallet on-device (compact JSON capped on write), while production backend paths use pooled `pts_events` / `pts_balances` rows.
      </div>
    </div>
  );
}
