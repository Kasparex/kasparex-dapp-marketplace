# GRID — Kaspa L1 mainnet (KRC-20) deployment record

**Canonical GRID** on Kaspa L1. Source of truth for max supply and premint. **L2 bridged ERC-20:** [GRID_L2_BRIDGED_KATBRIDGE_DEPLOYMENT.md](./GRID_L2_BRIDGED_KATBRIDGE_DEPLOYMENT.md) (Katbridge).

| Field | Value |
|--------|--------|
| **Deployed (local)** | 19.04.2026, 15:40:49 |
| **Network** | Kaspa mainnet |
| **Ticker (display)** | GRID |
| **Ticker (KRC-20 `tick`)** | `grid` |
| **Decimals** | 8 |
| **Max supply (human)** | 10,000,000,000 GRID |
| **Preminted (human)** | 10,000,000,000 GRID |

## Deploy inscription (KRC-20 deploy payload)

```json
{
  "p": "krc-20",
  "op": "deploy",
  "tick": "grid",
  "max": "1000000000000000000",
  "lim": "100000000",
  "pre": "1000000000000000000",
  "dec": "8"
}
```

## Transactions

| Step | Transaction ID | Explorer |
|------|------------------|----------|
| **Commit** | `3d6a1dd78928576f29080eb4bb6059613f550cac473853f0cd86fe7d97af26cd` | https://explorer.kaspa.org/transactions/3d6a1dd78928576f29080eb4bb6059613f550cac473853f0cd86fe7d97af26cd |
| **Commit (Kaspa Stream)** | same | https://kaspa.stream/transactions/3d6a1dd78928576f29080eb4bb6059613f550cac473853f0cd86fe7d97af26cd?blockHash=0d451fe26a3f49473288883b50d032a0a45ff0ea4a6a9a76731da5ffe9ca8a92 |
| **Reveal** | `11a5d15b0ad12e89303efa625e0b9a134c7a1328ddfdbed26c01069d99c07135` | https://explorer.kaspa.org/transactions/11a5d15b0ad12e89303efa625e0b9a134c7a1328ddfdbed26c01069d99c07135 |

## Deployer

| Type | Value |
|------|--------|
| **Kaspa address** | `kaspa:qzdfxy68rdcwyukrpja0dcc4994p3w49tlermjdvkgnqej77ajhqw6pgxlwfp` |
| **EVM-style (reference)** | `0xEaCE479d80d2DC1e8704aaf96F3cA17937269c3B` |
| **Explorer (address)** | https://explorer.kaspa.org/addresses/kaspa:qzdfxy68rdcwyukrpja0dcc4994p3w49tlermjdvkgnqej77ajhqw6pgxlwfp |
| **Kaspa Stream (address)** | https://kaspa.stream/addresses/kaspa:qzdfxy68rdcwyukrpja0dcc4994p3w49tlermjdvkgnqej77ajhqw6pgxlwfp |

## Inscription / block context (from Kaspa Stream)

| Field | Value |
|--------|--------|
| **Subnetwork ID** | `0000000000000000000000000000000000000000` |
| **Hash** | `1c3185ba3130db02648d2fef88e6f6a3e1959b51f9dcee56194e173aa32e2a7f` |
| **Seen in block** | `0d451fe26a3f49473288883b50d032a0a45ff0ea4a6a9a76731da5ffe9ca8a92` |
| **Accepting block** | `7983cc53693a04cbebdf7a0e744540345e40e24e2eeab6c2f24e537281aef625` |
| **Accepted (Kaspa Stream)** | 19.04.26, 15:40:50,575 |

## Related docs

- [GRID_CANONICAL_SUPPLY_MODEL.md](./GRID_CANONICAL_SUPPLY_MODEL.md) — L1 canonical + bridged L2 story.
