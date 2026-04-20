/**
 * Canonical Kasparex event schema (Frontend)
 *
 * Keep this aligned with `workers/kasparex-api/events.ts`.
 * The frontend uses it to generate payload bindings, show history, and interpret deck data.
 */

export const EVENT_SCHEMA_VERSION = 1 as const;

export type ChainNetwork = 'L1' | 'L2' | 'vProgs';

export type KasparexEventKind =
  | 'KASPayment'
  | 'SessionOutcome'
  | 'DiamondEarned'
  | 'DiamondSpent'
  | 'RewardAccrued'
  | 'RewardDistributed';

export type BaseEvent = {
  v: typeof EVENT_SCHEMA_VERSION;
  kind: KasparexEventKind;
  /** Unix ms */
  ts: number;
  user: {
    kaspaAddress?: string;
    evmAddress?: string;
  };
  context: {
    app: 'kasparex';
    gameId?: string;
    moduleId?: string;
    seasonId?: string;
    sessionId?: string;
    idempotencyKey?: string;
  };
};

export type KASPaymentEvent = BaseEvent & {
  kind: 'KASPayment';
  network: 'L1';
  txHash: string;
  purchase: {
    skuId: string;
    purchaseType: 'entry' | 'boost' | 'unlock' | 'slot' | 'other';
    amountKas: number;
  };
};

export type SessionOutcomeEvent = BaseEvent & {
  kind: 'SessionOutcome';
  outcome: {
    score?: number;
    multiplier?: number;
    riskChoice?: 'cashout' | 'push' | 'none';
    durationMs?: number;
  };
};

export type DiamondEarnedEvent = BaseEvent & {
  kind: 'DiamondEarned';
  diamonds: {
    amount: number;
    source: 'gameplay' | 'payment_bonus' | 'admin' | 'partner';
    reason?: string;
    relatedTxHash?: string;
    relatedSkuId?: string;
  };
};

export type DiamondSpentEvent = BaseEvent & {
  kind: 'DiamondSpent';
  diamonds: {
    amount: number;
    sink:
      | 'perk'
      | 'boost'
      | 'unlock'
      | 'insurance'
      | 'reroll'
      | 'cooldown_skip'
      | 'slot_upgrade'
      | 'tournament'
      | 'cosmetic'
      | 'other';
    reason?: string;
    targetGameId?: string;
  };
};

export type RewardAccruedEvent = BaseEvent & {
  kind: 'RewardAccrued';
  rewards: {
    gridAmount: number;
  };
};

export type RewardDistributedEvent = BaseEvent & {
  kind: 'RewardDistributed';
  network: 'L2';
  txHash: string;
  rewards: {
    gridAmount: number;
  };
};

export type KasparexEvent =
  | KASPaymentEvent
  | SessionOutcomeEvent
  | DiamondEarnedEvent
  | DiamondSpentEvent
  | RewardAccruedEvent
  | RewardDistributedEvent;

