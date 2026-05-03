# GRID: Canonical supply model (L1 + bridged L2)

This document is the **single supply story** for GRID across Kaspa L1, Kasplex L2, and Igra L2. It aligns product, rewards, and deployments so users see **one GRID brand** with **representations** on each rail - not unrelated tokens.

**Live canonical L1 deployment (mainnet):** [GRID_L1_MAINNET_KRC20_DEPLOYMENT.md](./GRID_L1_MAINNET_KRC20_DEPLOYMENT.md) · in-repo: `src/lib/tokens/grid-l1-canonical.ts`.

**Live bridged L2 (Katbridge):** [GRID_L2_BRIDGED_KATBRIDGE_DEPLOYMENT.md](./GRID_L2_BRIDGED_KATBRIDGE_DEPLOYMENT.md) · in-repo: `src/lib/tokens/grid-l2-bridged.ts`.

## Principles

1. **Canonical issuance on Kaspa L1 (KRC-20)**  
   Fixed total supply is defined and enforced at the **KRC-20** layer (premint or strict mint cap). This is the **source of truth** for “how much GRID exists in the world.”

2. **L2 GRID = official bridged representation**  
   ERC-20 `GRID` on **Kasplex L2** and ERC-20 `GRID` / `tGRID` (or equivalent) on **Igra L2** are **not separate economies**. They are **backed representations** of the same canonical supply, minted/burned only through the **official bridge(s)** you trust.

3. **Global accounting**  
   At any time, stakeholders should be able to reason about:

   ```text
   canonical_max (or current L1-defined supply)
     ≈ L1_treasury + L1_circulating
     + Kasplex_L2_totalSupplyGRID (mapped to bridge backing)
     + Igra_L2_totalSupplyGRID   (mapped to bridge backing)
     − burns_already_applied_at_each_layer (per your rules)
   ```

   Exact equality depends on bridge design (custody vs burn-mint); the **intent** is one cap and clear reserves.

4. **Rewards and dApps**  
   **FeeRouter**, **RewardManager**, games, and partners consume GRID **on the chain where the transaction runs** (typically Kasplex or Igra). Treasury **allocates** canonical GRID to bridge custodians or mint caps so each L2 has **liquidity for payouts**, without inventing a second max supply.

## Relationship to this repository

- [`contracts/GRIDToken.sol`](../contracts/GRIDToken.sol) is an **EVM ERC-20** suitable for **Kasplex L2** (and the same pattern can be deployed on Igra with the **same name/symbol policy** and **coordinated** max supply / premint rules).
- It is **not** the KRC-20 contract (Kaspa L1 uses the KRC-20 inscription / indexer model). Treat this Solidity token as the **L2 representation** once you wire the bridge.
- **RewardVault** + **RewardManager** on each L2 hold **that chain’s** GRID float for distribution; globally they are part of the **allocated** slice of canonical supply.

## Recommended rollout

1. **Define the cap once** on L1 (KRC-20 premint or fixed max). Publish ticker, decimals, and explorer links.
2. **Bridge allocations** (example only - not financial advice):
   - Treasury / ops on L1 for covenants, vProgs, future logic.
   - Custody or mint allowance for **Kasplex** bridge → fund `RewardVault` / FeeRouter pool on Kasplex.
   - Custody or mint allowance for **Igra** bridge → same on Igra.
3. **Freeze “independent” L2-only GRID mints** for anything marketed as `GRID`. New deployments should either:
   - mint only against bridge instructions, or  
   - use a **different ticker** if it is truly experimental (e.g. `GRID-TEST`).
4. **UI copy**: Prefer “GRID on Kasplex” / “GRID on Igra” / “GRID (Kaspa L1)” over implying different tokens.

## Risks (acknowledged)

- **Bridge risk** is the main systemic risk: exploit or pause affects all representations. Mitigate with monitoring, conservative limits, insurance/bounty programs, and clear incident comms.
- **Liquidity fragmentation** persists (pools per chain); unified supply does not merge order books - plan treasury rebalancing and incentives.

## Environment variables (optional wiring)

See [.env.example](../.env.example) for commented placeholders:

- L1: ticker / optional indexer references for canonical GRID.
- L2: `GRIDToken` / FeeRouter addresses per chain ID (already partially used elsewhere in the repo).

## References

- Ecosystem overview: [ECOSYSTEM_CONTRACTS_REFERENCE.md](./ECOSYSTEM_CONTRACTS_REFERENCE.md) (GRIDToken section).
- Igra rewards/tiers: [TGRID_REWARDS_AND_TIERS.md](./TGRID_REWARDS_AND_TIERS.md).
