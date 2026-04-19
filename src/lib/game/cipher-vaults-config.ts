/** L1 KAS recipient for Cipher Vault entry fees. Override via `NEXT_PUBLIC_CIPHER_VAULTS_TREASURY_ADDRESS`. */
export const CIPHER_VAULTS_TREASURY_ADDRESS =
  process.env.NEXT_PUBLIC_CIPHER_VAULTS_TREASURY_ADDRESS?.trim()
  || 'kaspa:qr54v0692g4csc45z6phshyh2twy5dv73mylx5uqjtpphynvg70vksky9xffw';

/** Rewards wallet (future on-chain distributions). Override via `NEXT_PUBLIC_REWARDS_ADDRESS`. */
export const KASPA_REWARDS_ADDRESS =
  process.env.NEXT_PUBLIC_REWARDS_ADDRESS?.trim()
  || 'kaspa:qzsjrd50vw36g4aj7ufj2d9a4fhewehaegxm7xmlt7jntlx6dpv2q77jl6fkn';

export const CIPHER_TICKET_REDEEM_RATE_POINTS = 100; // 100 refinement points = 1 ticket

export const CIPHER_VAULT_TIERS = [
  { id: 't1', label: 'Easy Vault', entryKAS: 0.5, gridPreview: 1, moveLimit: 14 },
  { id: 't2', label: 'Medium Vault', entryKAS: 1.0, gridPreview: 2, moveLimit: 12 },
  { id: 't3', label: 'Hard Vault', entryKAS: 2.0, gridPreview: 4, moveLimit: 10 },
] as const;

export type CipherVaultTierId = (typeof CIPHER_VAULT_TIERS)[number]['id'];

