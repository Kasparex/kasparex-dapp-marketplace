export type RedeemItemId =
  | 'fee_discount_1'
  | 'badge_founder'
  | 'comment_credits_10';

export type RedeemItem = {
  id: RedeemItemId;
  title: string;
  description: string;
  /** Cost in points (MVP: season points). */
  costPoints: number;
  /** Optional action hint for future backend fulfillment. */
  fulfillmentHint?: string;
};

export const REDEEM_CATALOG: RedeemItem[] = [
  {
    id: 'fee_discount_1',
    title: '1% Fee discount coupon',
    description: 'Applies to supported dApps. MVP: redemption is recorded locally; fulfillment comes later.',
    costPoints: 250,
    fulfillmentHint: 'coupon:fee_discount_1pct',
  },
  {
    id: 'comment_credits_10',
    title: '10 comment credits',
    description: 'Use across Hub experiences that require comment credits.',
    costPoints: 120,
    fulfillmentHint: 'credits:comments:10',
  },
  {
    id: 'badge_founder',
    title: 'Founder badge (season)',
    description: 'A collectible badge for your profile once redemption is wired to the backend.',
    costPoints: 500,
    fulfillmentHint: 'badge:founder',
  },
];

