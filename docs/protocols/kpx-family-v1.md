# kpx Protocol Family v1

`kpx` is a **Kaspa-wide, app-agnostic** payload standard for wallet-owned records.

This document defines the shared envelope, normalization, validity rules, and deterministic state resolution used by all `kpx/*` record types.

## Design goals
- **Deterministic**: independent indexers compute the same state.
- **Small**: payloads are cheap to write and easy to scan.
- **Portable**: the spec does not require Kasparex infrastructure.

## Envelope (all kpx types)
All records are UTF‑8 JSON objects with the following top-level fields:

| field | type | required | notes |
|---|---:|:---:|---|
| `p` | string | yes | must be `"kpx"` |
| `t` | string | yes | record type code (e.g. `pf`, `cm`, `lnk`, `ver`) |
| `v` | number | yes | version integer; v1 uses `1` |
| `net` | string | yes | network discriminator (e.g. `mainnet`, `testnet`) |
| `op` | string | yes | operation name; allowed set is type-specific |
| `addr` | string | yes | owner address (Kaspa L1) |
| `seq` | number | yes | positive integer sequence for conflict resolution |
| `data` | object | no | type-specific payload |

### Canonical encoding guidance
- JSON must be **UTF‑8**.
- Writers should serialize **without extra whitespace**.
- Indexers must be tolerant of key ordering and formatting differences.

## Normalization
### Address normalization
Indexers must normalize `addr` and the computed payer address as:
- lowercase
- must include `kaspa:` prefix

If normalization fails, the record is invalid.

## Validity (protocol-level)
A `kpx` record is **valid** if and only if:
- It parses as JSON and has the required fields.
- `p === "kpx"` and `v === 1`.
- `seq` is a positive integer in range \([1, 2^31-1]\).
- The payload size is within the **type’s max byte limit**.
- **Authorization rule**: the transaction **payer** (derived from tx inputs) equals `addr` after normalization.

> The payer derivation method is indexer-dependent (it comes from the chain transaction). The *rule* is protocol-level and deterministic: **payer == addr**.

## Unknown keys (forward compatibility)
- Unknown top-level keys: **ignore**
- Unknown keys in `data`: **ignore**

## Conflict resolution (deterministic state)
State is resolved per tuple `(net, addr, t)`:
- Choose the **valid record** with the highest `seq`.
- If multiple valid records share the same `(net, addr, t, seq)`, apply tie-breakers:
  1) highest block height wins
  2) if still tied, lexicographically highest txid wins

The winning record fully determines the state for that `(net, addr, t)` (type-specific semantics).

## Kasparex policy vs protocol validity
This spec defines **validity** and **resolution** rules only.

Kasparex may apply additional acceptance/UX policies (fees, discounts, verification criteria) in its reference indexer/verifier. Other indexers may ignore these policies while still implementing `kpx` correctly.

