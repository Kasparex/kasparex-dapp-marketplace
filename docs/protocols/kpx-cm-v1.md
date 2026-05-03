# kpx/cm v1  -  Commit Record (Creator-Owned Resources)

`kpx/cm` is a small, standardized “commit pointer” used to finalize **public canonical updates** of creator-owned resources across the ecosystem.

It is designed to be reused globally so projects do not re-implement ownership rules one by one.

## Envelope
See `docs/protocols/kpx-family-v1.md` for shared rules. This type uses:
- `t: "cm"`
- `v: 1`
- `op: "create"` or `op: "edit"`

## Payload limits (v1)
- Max payload bytes (entire JSON): **256 bytes**

## `data` schema (v1)
| key | type | required | constraints |
|---|---:|:---:|---|
| `rt` | string | yes | resource type code (2–4 chars) |
| `rid` | string | yes | resource id (1–64 chars, `[a-z0-9_-]`) |
| `ch` | string | yes | content hash, **64-char lowercase hex** |
| `sv` | number | yes | schema version for the resource payload |

### Resource type code registry (v1, append-only)
These values are used in `data.rt`:
- `vb`: vBlog article
- `ck`: CrowdKAS campaign
- `st`: Store product
- `dp`: dApp listing
- `mg`: Magazine issue/article
- `ad`: Ads campaign
- `gm`: Games content

## Operation semantics (deterministic)
The winning `kpx/cm` record for `(net, addr, rt, rid)` represents the latest canonical pointer for that resource.

Indexers SHOULD present commits grouped by `(rt,rid)` and resolved by highest `seq`, applying the standard tie-breakers.

> Note: the base `kpx` resolver is keyed by `(net, addr, t)`. For `kpx/cm` you will typically maintain a per-resource index keyed by `(net, rt, rid)` and validate `addr` as the owner.

## Protocol validity vs acceptance policy
Protocol validity is only `payer == addr` and schema correctness.

Kasparex may additionally enforce acceptance policy for “verified” commits (fees, discounts), without changing protocol validity.

## Examples

### Create (first publish)
```json
{
  "p": "kpx",
  "t": "cm",
  "v": 1,
  "net": "mainnet",
  "op": "create",
  "addr": "kaspa:q...",
  "seq": 1,
  "data": { "rt": "vb", "rid": "vba_123", "ch": "0123...abcd", "sv": 1 }
}
```

### Edit (canonical update)
```json
{
  "p": "kpx",
  "t": "cm",
  "v": 1,
  "net": "mainnet",
  "op": "edit",
  "addr": "kaspa:q...",
  "seq": 2,
  "data": { "rt": "vb", "rid": "vba_123", "ch": "ffff...0000", "sv": 1 }
}
```

