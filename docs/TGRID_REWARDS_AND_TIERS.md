# tGRID Rewards and Tier System (Quick Reference)

## Tier system

- **Tier 0 (Inactive):** 0 KREX held; no perks, no multiplier.
- **Tier 1:** 1+ KREX (up to tier threshold).
- **Tier 2–4:** Higher KREX thresholds for increased multipliers and fee reduction.

Tier 1 requires at least 1 KREX; zero balance is Tier 0.

## Reward flow

- **Single entry:** FeeRouter. All L2 fee and reward handling goes through FeeRouter.
- **No ProofOfUtility / SecureProofOfUtility** in the flow. Rewards and analytics are handled by FeeRouter and/or off-chain to keep usage and scaling costs low.
- **On payment:** FeeRouter splits the fee, distributes GRID (95% user, 5% treasury), updates Revenue Tree, and can call LoyaltyPoints for on-chain points.

## GRID treasury

- 5% of GRID from each reward distribution goes to the configured `gridTreasury` address; 95% goes to the user.

## Points

- On-chain via the LoyaltyPoints contract. Multipliers are based on KREX tier (and optionally NFT/Node status). FeeRouter calls `LoyaltyPoints.awardPointsWithMultiplier(payer, transactionType)` after GRID distribution.

## Premium UI

- Toasts, tooltips, and success/error modals for transaction feedback (e.g. after payments, votes).

## ProofOfUtility

- **Not used.** The app does not call ProofOfUtility or SecureProofOfUtility. This avoids extra on-chain transactions and keeps off-chain usage and scaling costs low. When the node system is in place, the same cost-conscious approach applies.
