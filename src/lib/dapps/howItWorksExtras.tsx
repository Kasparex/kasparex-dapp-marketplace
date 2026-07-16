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
      <p>
        Lockbox lets you hold KAS for someone until rules you set are met. Think of it as a simple safe deposit box
        on Kaspa.
      </p>
      <ul className={DAPP_ABOUT_LIST_CLASS}>
        <li>
          <strong>Who holds the KAS?</strong> Nobody custodies it. When you create a lock, the amount leaves your
          wallet and sits in a Kaspa L1 covenant output (a programmable UTXO). Kasparex does not hold or control
          those coins.
        </li>
        <li>
          <strong>Where is it locked?</strong> On Kaspa Layer 1, bound by covenant script rules you chose (escrow or
          timelock). The lock is visible on-chain under a covenant ID. Only a spend that satisfies those rules can
          move the funds.
        </li>
        <li>
          <strong>Who can release it?</strong> Only the beneficiary address you set. In escrow mode they can claim as
          soon as the lock exists. In timelock mode they must wait until the unlock date.
        </li>
        <li>
          <strong>Platform fee vs lock amount</strong> Hub deploy and claim fees (shown in the fee panel /
          claim button) are separate KAS transfers to Kasparex treasury. They are not part of the locked
          principal. KREX tiers discount both fees and multiply Hub Points.
        </li>
        <li>
          <strong>Hybrid / simulator mode</strong> Older demo vaults are hidden. LockBox on Hub uses real L1
          covenants when your wallet supports signPskt + pushTx. Import by covenant ID if you need to restore a lock
          from an explorer.
        </li>
        <li>
          <strong>Reading the wallet popup</strong> Kaspa spends whole UTXOs. One input is coins leaving a prior
          output. Two outputs is normal: the lock amount to the covenant address, plus change back to you. A
          positive &quot;balance change&quot; is usually that change returning, not a profit. The network fee is the
          leftover between inputs and outputs.
        </li>
        <li>
          <strong>Create vs claim</strong> Creating a lock may show a Hub fee payment, then the lock tx.
          Claiming shows wallet prompts to unlock the covenant, then a separate Hub claim fee (KREX tiers
          discount both). Claimers also earn Hub Points. Keep a little unlocked KAS for network fees plus
          the claim fee.
        </li>
        <li>
          <strong>Escrow</strong> Beneficiary can claim anytime after the lock is created.
        </li>
        <li>
          <strong>Timelock</strong> Same beneficiary rules, but claiming is blocked until the date you pick.
        </li>
      </ul>
      <p className={DAPP_ABOUT_FOOTNOTE_CLASS}>
        Useful for trades, freelance payments, savings goals, or any transfer where you want clear release conditions
        without trusting a middleman.
      </p>
    </ProseBlock>
  ),
  'covenant-split': (
    <ProseBlock>
      <p>
        Covenant Split is for paying several people from one pot of KAS. You lock the total once; each person claims
        only their share.
      </p>
      <ul className={DAPP_ABOUT_LIST_CLASS}>
        <li>
          <strong>Set shares</strong>: assign a percentage to each recipient. They must add up to 100%.
        </li>
        <li>
          <strong>Independent claims</strong>: recipients do not need to wait on each other. Each claims their slice
          when ready.
        </li>
        <li>
          <strong>Fixed rules</strong>: amounts are calculated from your split and enforced by covenant logic
          (simulated here until wallets ship covenant support).
        </li>
      </ul>
      <p className={DAPP_ABOUT_FOOTNOTE_CLASS}>
        Great for team payouts, creator revenue splits, prize pools, or treasury distributions.
      </p>
    </ProseBlock>
  ),
  'covenant-milestone': (
    <ProseBlock>
      <p>
        Covenant Milestone helps you pay for work in stages without handing over the full amount on day one.
      </p>
      <ul className={DAPP_ABOUT_LIST_CLASS}>
        <li>
          <strong>Fund once</strong>: you lock the total KAS for the whole deal.
        </li>
        <li>
          <strong>Release on schedule</strong>: each milestone unlocks on its date. Only the beneficiary can claim
          that slice.
        </li>
        <li>
          <strong>No middleman</strong>: rules are enforced by covenant logic on Kaspa L1 (simulated here until
          wallets ship covenant support).
        </li>
      </ul>
      <p className={DAPP_ABOUT_FOOTNOTE_CLASS}>
        Good for freelancers, builders, game quests, or any project with clear delivery steps.
      </p>
    </ProseBlock>
  ),
  'covenant-crowdfund': (
    <ProseBlock>
      <p>
        Covenant Crowdfund is an all-or-nothing raise: money only moves to the creator if enough people pledge before
        the deadline.
      </p>
      <ul className={DAPP_ABOUT_LIST_CLASS}>
        <li>
          <strong>Set a goal and deadline</strong>: backers know exactly what has to happen for the campaign to
          succeed.
        </li>
        <li>
          <strong>Pledge KAS</strong>: contributions are tracked on-chain style rules (simulated in this prototype).
        </li>
        <li>
          <strong>Goal met</strong>: the creator claims the pooled amount.
        </li>
        <li>
          <strong>Goal missed</strong>: backers can request refunds instead of losing funds to a failed project.
        </li>
      </ul>
      <p className={DAPP_ABOUT_FOOTNOTE_CLASS}>
        Useful for launches, community drops, charity drives, or any raise where trust matters.
      </p>
    </ProseBlock>
  ),
  'covenant-voucher': (
    <ProseBlock>
      <p>
        Covenant Voucher works like a gift card for KAS. You lock coins on-chain, then give someone a secret code so
        only they can claim it.
      </p>
      <ul className={DAPP_ABOUT_LIST_CLASS}>
        <li>
          <strong>Mint</strong>: choose an amount and expiry date. You get a voucher ID and a secret code.
        </li>
        <li>
          <strong>Share off-chain</strong>: send the code to the recipient by message or email. Do not post it
          publicly.
        </li>
        <li>
          <strong>Redeem once</strong>: whoever enters the correct code first claims the KAS. Each voucher works only
          one time.
        </li>
        <li>
          <strong>Expires</strong>: unredeemed vouchers stop working after the expiry date you set.
        </li>
      </ul>
      <p className={DAPP_ABOUT_FOOTNOTE_CLASS}>
        Great for tips, gifts, promo credits, or paying someone without needing their wallet address up front.
      </p>
    </ProseBlock>
  ),
  'kaspa-capsule': (
    <ProseBlock>
      <p>
        Kaspa Capsule is a permanent message board on Kaspa L1. Leave a rich-text note that becomes part of the early
        ecosystem archive.
      </p>
      <ul className={DAPP_ABOUT_LIST_CLASS}>
        <li>
          <strong>Compose</strong>: write with the same rich editor used in vBlog. Minimum and maximum character limits
          apply.
        </li>
        <li>
          <strong>Pay once</strong>: base fee plus payload size fee based on how many on-chain chunks your message
          needs.
        </li>
        <li>
          <strong>Stored forever</strong>: your L1 transaction and payload remain on-chain. The Hub archive can hide
          messages you delete locally.
        </li>
        <li>
          <strong>Hub Points</strong>: qualifying messages earn redeemable Hub Points on your connected wallet ledger.
        </li>
      </ul>
    </ProseBlock>
  ),
};

export function getHowItWorksExtras(slug?: string): ReactNode | null {
  if (!slug) return null;
  return HOW_IT_WORKS_EXTRAS[slug] ?? null;
}
