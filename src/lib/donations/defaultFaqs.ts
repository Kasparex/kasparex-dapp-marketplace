import type { CrowdfundFaqItem } from '@/lib/covenant/crowdfund-types';
import { VDONATE_SHORT_NAME } from '@/lib/donations/brand';

/** Shared Hub FAQ for every vDonate campaign (shown with any creator-authored FAQs). */
export const VDONATE_DEFAULT_FAQS: CrowdfundFaqItem[] = [
  {
    id: 'vd-default-how',
    question: `How does ${VDONATE_SHORT_NAME} work?`,
    answer:
      'You pledge KAS to a live campaign. Funds lock until the deadline. If the goal is met, the creator claims the raise. If not, backers can refund.',
  },
  {
    id: 'vd-default-goal-met',
    question: 'What happens when the goal is reached?',
    answer:
      'The campaign succeeds. After the raise (or at deadline if already funded), the creator claims the locked funds to their wallet.',
  },
  {
    id: 'vd-default-goal-missed',
    question: 'What if the goal is not met?',
    answer:
      'On L1 covenant campaigns, backers can refund their pledge after the deadline. On L2 escrow, refunds follow the on-chain campaign rules.',
  },
  {
    id: 'vd-default-fee',
    question: 'Is there a platform fee?',
    answer:
      'Yes. L1 pledges include a 1% platform fee (minimum 1 KAS) on the same transaction as your pledge. KREX holders can get a tier discount on that fee.',
  },
  {
    id: 'vd-default-security',
    question: 'How are pledges secured?',
    answer:
      'L1 pledges lock in a Kaspa L1 covenant until claim or refund. L2 campaigns use Igra escrow contracts. Always confirm amounts in your wallet before signing.',
  },
  {
    id: 'vd-default-rewards',
    question: 'How do reward tiers work?',
    answer:
      'Pick a tier and pledge at least its minimum. That unlocks the tier reward content for your wallet. You can still pledge a custom amount without a tier.',
  },
];

/** Defaults first, then unique creator FAQs (by id / question). */
export function mergeVDonateFaqs(custom?: CrowdfundFaqItem[] | null): CrowdfundFaqItem[] {
  const seen = new Set(VDONATE_DEFAULT_FAQS.map((f) => f.id.toLowerCase()));
  const seenQ = new Set(VDONATE_DEFAULT_FAQS.map((f) => f.question.trim().toLowerCase()));
  const extras = (custom ?? []).filter((f) => {
    const id = (f.id || '').trim().toLowerCase();
    const q = (f.question || '').trim().toLowerCase();
    if (!q) return false;
    if (id && seen.has(id)) return false;
    if (seenQ.has(q)) return false;
    if (id) seen.add(id);
    seenQ.add(q);
    return true;
  });
  return [...VDONATE_DEFAULT_FAQS, ...extras];
}

export function vdonateCommentsArticleId(args: {
  network: 'l1' | 'l2';
  campaignId: string;
}): string {
  const id = args.campaignId.trim();
  return args.network === 'l1' ? `vdonate:covenant:${id}` : `vdonate:l2:${id}`;
}
