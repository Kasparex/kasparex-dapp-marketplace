import type { ReactNode } from 'react';
import {
  DAPP_ABOUT_FOOTNOTE_CLASS,
  DAPP_ABOUT_LIST_CLASS,
  DAPP_ABOUT_PROSE_CLASS,
} from '@/components/dapps/panels/dappAboutStyles';

function ProseBlock({ children }: { children: ReactNode }) {
  return <div className={DAPP_ABOUT_PROSE_CLASS}>{children}</div>;
}

const HOW_IT_WORKS_EXTRAS: Record<string, ReactNode> = {
  lockbox: (
    <ProseBlock>
      <p>Lock KAS for someone else until your rules are met. Nobody custodians the coins.</p>
      <ul className={DAPP_ABOUT_LIST_CLASS}>
        <li>
          <strong>Where it sits:</strong> Kaspa L1 covenant UTXO. Kasparex does not hold the keys.
        </li>
        <li>
          <strong>Claimers:</strong> Set wallets and shares (must total 100%). Escrow claims anytime;
          timelock claims after the date.
        </li>
        <li>
          <strong>Fees:</strong> Hub deploy / claim fees are separate KAS to treasury (not part of the
          lock). Extra claimers add +5 KAS each.
        </li>
        <li>
          <strong>Wallet popup:</strong> Whole UTXOs move. Change back to you is normal, not a profit.
        </li>
      </ul>
      <p className={DAPP_ABOUT_FOOTNOTE_CLASS}>
        Useful for trades, freelance payouts, or savings with clear release rules.
      </p>
    </ProseBlock>
  ),
  'covenant-split': (
    <ProseBlock>
      <p>Pay several people from one KAS pot. Each share is its own L1 lock.</p>
      <ul className={DAPP_ABOUT_LIST_CLASS}>
        <li>
          <strong>Shares:</strong> Percentages must total 100% and meet the minimum lock.
        </li>
        <li>
          <strong>Claims:</strong> Recipients claim independently (Hub claim fee + Hub Points).
        </li>
      </ul>
      <p className={DAPP_ABOUT_FOOTNOTE_CLASS}>
        Team payouts, revenue splits, prize pools.
      </p>
    </ProseBlock>
  ),
  'covenant-milestone': (
    <ProseBlock>
      <p>Fund work in stages. Lock the total once; each milestone unlocks on its date.</p>
      <ul className={DAPP_ABOUT_LIST_CLASS}>
        <li>
          <strong>Fund once:</strong> One L1 lock per milestone share.
        </li>
        <li>
          <strong>Release:</strong> Only the beneficiary claims each unlocked slice.
        </li>
      </ul>
      <p className={DAPP_ABOUT_FOOTNOTE_CLASS}>
        Freelancers, builders, quests with clear delivery steps.
      </p>
    </ProseBlock>
  ),
  'covenant-crowdfund': (
    <ProseBlock>
      <p>All-or-nothing raise: funds move only if the goal is met before the deadline.</p>
      <ul className={DAPP_ABOUT_LIST_CLASS}>
        <li>
          <strong>Pledge:</strong> Each backer locks KAS in an L1 covenant.
        </li>
        <li>
          <strong>Goal met:</strong> Creator claims the pool.
        </li>
        <li>
          <strong>Goal missed:</strong> Backers refund after the deadline.
        </li>
      </ul>
      <p className={DAPP_ABOUT_FOOTNOTE_CLASS}>
        Launches, community drops, charity drives.
      </p>
    </ProseBlock>
  ),
  'covenant-voucher': (
    <ProseBlock>
      <p>Gift-card style KAS: lock coins, share a secret code, redeem once before expiry.</p>
      <ul className={DAPP_ABOUT_LIST_CLASS}>
        <li>
          <strong>Mint:</strong> Amount + expiry → voucher ID + secret (keep private).
        </li>
        <li>
          <strong>Redeem:</strong> First correct code wins; one use only.
        </li>
      </ul>
      <p className={DAPP_ABOUT_FOOTNOTE_CLASS}>
        Tips, gifts, promo credits without needing an address up front.
      </p>
    </ProseBlock>
  ),
  'kaspa-capsule': (
    <ProseBlock>
      <p>Leave a permanent rich-text note on Kaspa L1.</p>
      <ul className={DAPP_ABOUT_LIST_CLASS}>
        <li>
          <strong>Compose:</strong> Same rich editor as vBlog (size limits apply).
        </li>
        <li>
          <strong>Pay once:</strong> Base fee plus payload size.
        </li>
        <li>
          <strong>Stay on-chain:</strong> Tx + payload remain; Hub can hide local deletes.
        </li>
      </ul>
    </ProseBlock>
  ),
  'kcc20-bridge': (
    <ProseBlock>
      <p>After Burn, Confirm runs on its own. You only sign Claim.</p>
      <ul className={DAPP_ABOUT_LIST_CLASS}>
        <li>
          <strong>Burn:</strong> Permanent. Sink has no private key.
        </li>
        <li>
          <strong>Confirm:</strong> Kasplex + attestors open a one-time claim ticket (usually under a
          couple of minutes). History refreshes by itself.
        </li>
        <li>
          <strong>Claim:</strong> You sign in KasWare. Matching KCC20 lands as a covenant coin.
        </li>
        <li>
          <strong>Balance:</strong> Use History / kascov. KasWare will not show KCC20 like KRC-20.
        </li>
      </ul>
      <p className={DAPP_ABOUT_FOOTNOTE_CLASS}>
        One-way for now. Only send the selected ticker to the sink shown in Migrate.
      </p>
    </ProseBlock>
  ),
};

export function getHowItWorksExtras(slug?: string): ReactNode | null {
  if (!slug) return null;
  return HOW_IT_WORKS_EXTRAS[slug] ?? null;
}
