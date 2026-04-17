# kpx/ver v1 — Verified Badge (Boolean)

`kpx/ver` is a minimal, deterministic “verified” badge record.

It is intentionally **not** a general credential system in v1.

## Envelope
See `docs/protocols/kpx-family-v1.md` for shared rules. This type uses:
- `t: "ver"`
- `v: 1`
- `op: "set"` or `op: "clear"`
- **no `data`** in v1 (badge is boolean)

## Payload limits (v1)
- Max payload bytes (entire JSON): **192 bytes**

## Operation semantics (deterministic)
Per `(net, addr)`:
- winning record is highest `seq`
- `op:set` => verified badge present
- `op:clear` => verified badge absent

## Validity and issuer policy
Protocol validity is `payer == addr` and schema correctness.

Kasparex may impose issuance policy in its reference verifier (what it means to be “verified”), but the on-chain shape remains portable for other indexers to display.

## Examples

### Set verified
```json
{
  "p": "kpx",
  "t": "ver",
  "v": 1,
  "net": "mainnet",
  "op": "set",
  "addr": "kaspa:q...",
  "seq": 1
}
```

### Clear verified
```json
{
  "p": "kpx",
  "t": "ver",
  "v": 1,
  "net": "mainnet",
  "op": "clear",
  "addr": "kaspa:q...",
  "seq": 2
}
```

