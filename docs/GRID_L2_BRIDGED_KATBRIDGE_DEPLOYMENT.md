# GRID  -  L2 bridged ERC-20 (Katbridge)

Official bridged **GRID** on EVM L2s, onboarded from canonical L1 KRC-20 via **[Katbridge](https://onboard.katbridge.com/)**. Same ticker, decimals, and max supply as [L1 deployment](./GRID_L1_MAINNET_KRC20_DEPLOYMENT.md).

**Naming:** In this repo, **GRID** refers only to the Katbridge-bridged canonical token on the networks below. Older Kasplex testnet GRID deployments are not used; sandboxes use **tGRID** (or other tickers) as documented separately.

---

## Kasplex L2 (chain ID `202555`)

| Field | Value |
|--------|--------|
| **Ticker** | GRID |
| **Max supply** | 10,000,000,000 |
| **Decimals** | 8 |
| **Total minted** | 10,000,000,000 |
| **EVM network** | Kasplex (202555) |
| **Token contract** | `0x9396eDf77EcA8087DDE39121e7A15ABfB8784570` |
| **Deployer (Kaspa)** | `kaspa:qzdfxy68rdcwyukrpja0dcc4994p3w49tlermjdvkgnqej77ajhqw6pgxlwfp` |
| **Transaction hash** | `0x05ac0186cc5c2c0a4486cd4150e264c673a5f6f796f84c1a2995d72c0276c1a6` |
| **Submission ID** | `TKN-1776607643669-3Z6TK36RC` |
| **Explorer (tx)** | https://explorer.kasplex.org/tx/0x05ac0186cc5c2c0a4486cd4150e264c673a5f6f796f84c1a2995d72c0276c1a6 |

---

## Igra L2 mainnet (chain ID `38833`)

| Field | Value |
|--------|--------|
| **Ticker** | GRID |
| **Max supply** | 10,000,000,000 |
| **Decimals** | 8 |
| **Total minted** | 10,000,000,000 |
| **EVM network** | Igra (38833) |
| **Token contract** | `0x05E02a8b14CD7974c6102CDB855F2dCd8E1f4902` |
| **Deployer (Kaspa)** | `kaspa:qzdfxy68rdcwyukrpja0dcc4994p3w49tlermjdvkgnqej77ajhqw6pgxlwfp` |
| **Transaction hash** | `0x0fafad59d80009e8971652b69e23a228a2cf3a8d8040f544b6464bc70803ccb4` |
| **Submission ID** | `TKN-1776607889641-5Z0F18W9N` |
| **Explorer (tx)** | https://explorer.igralabs.com/tx/0x0fafad59d80009e8971652b69e23a228a2cf3a8d8040f544b6464bc70803ccb4 |

---

## Related

- Canonical L1 (KRC-20): [GRID_L1_MAINNET_KRC20_DEPLOYMENT.md](./GRID_L1_MAINNET_KRC20_DEPLOYMENT.md)
- Supply model: [GRID_CANONICAL_SUPPLY_MODEL.md](./GRID_CANONICAL_SUPPLY_MODEL.md)
- In-repo constants: `src/lib/tokens/grid-l2-bridged.ts`
