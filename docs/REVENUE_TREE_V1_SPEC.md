# Revenue Tree — V1 + L1-Ready Specification

**Version:** 1.0  
**Status:** Approved for implementation  
**Scope:** Unified Revenue Tree per wallet, L2-first, L1-ready architecture.

---

## 1. Overview

### 1.1 Goals

- **One Revenue Tree per wallet** across all dApps (per chain).
- **One universal referral link** per wallet (e.g. `kasparex.com/ref/<wallet>`).
- **Simple, deterministic rules:** no rotating boards, no race conditions, no block-order dependency.
- **L2 (Kasplex/IGRA) for V1;** same design deployable on L1 later without cross-chain complexity.

### 1.2 Principles

- **Independent trees:** Each user's tree is their own; no global shared state.
- **Immutable upline:** Upline chain is fixed at activation and never changes.
- **Per-chain state:** Volume, referrer, activation, and tree are per chain. L1 is "same contract, second deployment."

---

## 2. Tree Structure (Per User, Per Chain)

### 2.1 Definition

- Each wallet has **one** Revenue Tree **per chain** (L2 today, L1 when live).
- Tree = 5 levels of wallet addresses:
  - **L1:** Self (the user).
  - **L2:** Direct referrer.
  - **L3:** Referrer's referrer.
  - **L4:** Next upline.
  - **L5:** Next upline.

### 2.2 Independence

- When user B activates through user A's link:
  - **B's tree:** L1=B, L2=A, L3=A's L2, L4=A's L3, L5=A's L4.
  - **A's tree:** Unchanged.
- No global rotating board. No reshuffling. No "first tx in block wins."

### 2.3 Upline Snapshot (Immutable)

- At the **exact moment** a user activates (reaches 100 KAS lifetime volume on that chain):
  - The 5-level upline is computed and **stored permanently**.
  - That list of addresses **never changes** for that user on that chain.
- If a level has no referrer (e.g. no ref at all), that slot is filled by the **Genesis wallet** for that level (see §5).

---

## 3. Activation (Initial)

### 3.1 Rule

- **100 KAS lifetime total volume** on that chain (L2 only for V1).
- Volume = paid dApp usage on L2 (Kasplex/IGRA); only qualifying L2 payments count.
- Once reached, user is **activated** on that chain: upline is snapshotted and tree is fixed.

### 3.2 One-Time

- Activation happens once per user per chain. No "de-activation" of the tree structure; only **maintenance** (active vs inactive) affects earnings (§4).

---

## 4. Maintenance (Keeping Tree "Active")

- A user's tree can be **active** or **inactive** for the purpose of **receiving** revenue share.
- **No grace period** in V1: either the user meets a maintenance condition or they are inactive.

### 4.1 Active If Either Path Is Met

**Path 1 — Activity**

- **Volume in last 30 days ≥ 1000 KAS** on that chain (L2 for V1).

**Path 2 — KREX hold**

- **KREX balance ≥ 10,000,000** (10M) in wallet on that chain, **and**
- **Volume in last 30 days ≥ 100 KAS** on that chain.

- If **Path 1** OR **Path 2** is satisfied → user is **active**.
- If neither is satisfied → user is **inactive**.

### 4.2 KREX for V1

- **Hold only:** We only require `balanceOf(user) >= 10M` KREX; no lock contract.
- **Token address:** Configurable per chain (e.g. Kasplex L2: `0x0FD8d408cE707f4E4f8E54193c4C55a3b969834B`; IGRA/L1: set when available, or `address(0)` to disable KREX path).

### 4.3 When Inactive

- That user **stops receiving** their level's share.
- Their share for that level is sent to the **same-level Genesis wallet** (e.g. inactive L3 → Genesis L3).
- Reactivation: user meets Path 1 or Path 2 again; no extra steps.

---

## 5. Revenue Distribution

### 5.1 When It Runs

- On **every qualifying paid dApp usage** on that chain:
  - Identify **payer**.
  - Get payer's **upline chain** (5 levels, from snapshot at activation).
  - Distribute a fixed percentage of the payment to levels 1–5; remainder to platform/Genesis as defined below.

### 5.2 Percentages (Example; Configurable)

- L1: 2%, L2: 5%, L3: 10%, L4: 20%, L5: 45%.
- Platform/Genesis: remainder (e.g. 18% or as configured).

### 5.3 Per Level

- For each level 1–5:
  - If the upline wallet **exists** and is **active** → send that level's share to that wallet.
  - Otherwise (no upline or **inactive**) → send that level's share to the **same-level Genesis wallet** (e.g. inactive L3 → Genesis L3).

### 5.4 Genesis Wallets

- Five Genesis addresses (L1–L5) are configured per deployment. Used when:
  - A level has no referrer in the snapshot, or
  - The upline at that level is inactive.

---

## 6. Referrer Attribution

### 6.1 First Touch On-Chain (Option A)

- **Store referrer on-chain as early as possible.**
- **Dedicated function:** `setReferrer(address referrer)`.
  - Callable **once per user per chain** (e.g. `referrerOf[user] == address(0)`).
  - Require: `referrer != msg.sender`, `referrer != address(0)`.
  - Optional: require referrer to be already activated (so upline is well-defined).
- **Frontend:** When user lands with `?ref=<wallet>` and connects wallet, prompt "Set your referrer (one-time)" and send `setReferrer(affiliate)`.
- **localStorage:** Use only as UX helper (e.g. "Referred by …"); **do not** rely on passing referrer only at activation. At activation, contract **reads** on-chain `referrerOf[user]` and builds upline.

### 6.2 Universal Link

- One link per wallet: e.g. `https://kasparex.com/ref/<wallet_address>`.
- Works across all dApps on that chain; no per-dApp referral links for V1.

---

## 7. L1-Ready Architecture (No Cross-Chain in V1)

### 7.1 Same Contract, Two Deployments

- Contract is **chain-agnostic**: all state is per user and per chain (referrer, volume, upline snapshot, activation, last-30-day volume).
- **Deploy once on L2** (Kasplex/IGRA), **deploy again on L1** when live. Same code, same rules.

### 7.2 One Tree Per Wallet **Per Chain**

- **L2:** One tree per wallet (L2 volume, L2 referrer, L2 upline).
- **L1:** One tree per wallet (L1 volume, L1 referrer, L1 upline).
- **No cross-chain unification in V1:** no bridges, oracles, or cross-chain calls in the contract.

### 7.3 Volume and Activation Per Chain

- **L2:** Only L2 payments count for L2 activation and L2 maintenance (100 / 1000 / 10M KREX + 100).
- **L1:** Only L1 payments count for L1 activation and L1 maintenance.
- No "100 KAS total across L1+L2" in contract for V1.

### 7.4 Referrer on L1 When Live

- When user first touches L1, they call **`setReferrer(referrer)` on the L1 contract** with the **same** address (same wallet).
- Frontend can pre-fill from `?ref=…` or from "referrer already set on L2" (UI/backend only; no cross-chain read in contract).

### 7.5 Config Per Deployment

- Each deployment has its own config:
  - Genesis wallets (L1–L5).
  - KREX token address (or `address(0)` to disable KREX path).
  - Activation threshold (100 KAS lifetime).
  - Maintenance: 1000 KAS in 30 days; 10M KREX + 100 KAS in 30 days.
- Same or different values per chain as needed.

---

## 8. Constants and Configuration (V1)

| Item | Value | Notes |
|------|--------|------|
| Initial activation | 100 KAS | Lifetime volume on that chain |
| Activity path | 1000 KAS in last 30 days | Keeps tree active |
| KREX path | 10M KREX hold + 100 KAS in last 30 days | Same chain |
| Grace period | None | Not in V1 |
| L2 only for V1 | Kasplex / IGRA | L1 when contract is live |
| KREX token (Kasplex L2) | `0x0FD8d408cE707f4E4f8E54193c4C55a3b969834B` | Configurable; IGRA/L1 when set |

All numeric and address parameters should be configurable (constructor or owner) so L1 and future chains can tune without code change.

---

## 9. Deployment

- **Script:** `scripts/deploy-revenue-tree.js`
- **Networks:** `kasplexL2Testnet`, `kasplexL2Mainnet`, `igraGalleonTestnet` (38836), `igraGalleonTestMainnet` (38837).
- **On IGRA Galleon Testnet (38836):** the script deploys **tKREX** ERC-20 first, then RevenueTreeManager with `krexToken` set to tKREX. Set `NEXT_PUBLIC_TKREX_ADDRESS_38836` in the app when tKREX is deployed.
- **Env (optional):** `PRIVATE_KEY`, `GENESIS_1`..`GENESIS_5`, `PLATFORM_WALLET`, `FEE_COLLECTOR_ADDRESS`, `KREX_TOKEN_ADDRESS`, `SIMPLE_PAYMENT_ADDRESS`, `TREE_BPS` (e.g. 5000 = 50% to tree).
- **Output:** `deployments/revenue-tree-<network>.json` with contract addresses. Update `src/lib/contracts/addresses.ts` and `.env` with deployed addresses.

---

## 10. Out of Scope for V1

- Grace period (7 days).
- KREX **lock** (only **hold** in V1).
- Cross-chain volume or referrer sync.
- L1 deployment (prepared in design only).
- Tree energy / decay / gamification.
- NFT-based activation/renewal.
- Per-dApp trees or per-dApp referral links.

---

## 11. Summary Checklist

- [ ] One Revenue Tree per wallet **per chain**.
- [ ] Activation: 100 KAS lifetime volume on that chain.
- [ ] Maintenance: 1000 KAS in last 30 days **or** 10M KREX hold + 100 KAS in last 30 days; no grace.
- [ ] Upline snapshot at activation; immutable; no reshuffling.
- [ ] Revenue: per level, active → wallet, inactive/empty → same-level Genesis.
- [ ] Referrer: `setReferrer(referrer)` once per chain at first touch; no "pass at activation" from client.
- [ ] Universal referral link per wallet.
- [ ] L2-only volume for V1; contract and config L1-ready (per-chain deployment, no cross-chain).
- [ ] KREX: hold only; configurable token address per chain.

---

*Document generated for implementation. Update this spec when thresholds, addresses, or scope change.*
