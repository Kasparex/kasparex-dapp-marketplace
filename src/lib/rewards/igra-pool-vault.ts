import type { Address } from 'viem';

/**
 * ## Hub pool claims on Igra Mainnet (chain 38833)
 *
 * **Product contract:** `RewardsClaimVault` only. GRID/KREX pool cards do **not** use `RewardManager` or `RewardVault` for this flow.
 *
 * **What actually controls which vault receives `claim` txs**
 * 1. Cloudflare Worker env **`REWARDS_CLAIM_VAULT_ADDRESS`** plus **`VOUCHER_SIGNER_PRIVATE_KEY`** (private key for the vault `claimSigner` set at deploy).
 * 2. `POST /kasparex/pts/redeem` builds a voucher whose EIP-712 domain uses that vault address.
 * 3. The JSON sent back to the browser includes **`voucher.vault`**. `RewardsPageContent` calls `claim` on **that** address (see `writeContractAsync` there).
 *
 * So the **Worker** is the runtime source of truth. If you deploy a *new* vault but **do not** update Cloudflare with the new address and matching signer key, production keeps using the **previous** vault. The app cannot read Cloudflare; it only follows the voucher.
 *
 * **This file:** one default address for the repo when env is unset: fund scripts, and `NEXT_PUBLIC_REWARDS_CLAIM_VAULT_ADDRESS` on Vercel for the catalog **pool balance** line. Set that env to the **same** hex as Worker `REWARDS_CLAIM_VAULT_ADDRESS` or the pill can disagree with real claims.
 *
 * **Network:** Igra Mainnet, `38833`. Not Kasplex L2 unless you intentionally deploy another vault there and point the Worker at it (not the default Hub path).
 */
export const IGRA_POOL_REWARDS_VAULT_ADDRESS: Address =
  '0xdC151b27ECE53F1c5FEaF0f18d333d4C94dAC703';
