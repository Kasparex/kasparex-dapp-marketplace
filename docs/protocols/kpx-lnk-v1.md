# kpx/lnk v1 — Kaspa ↔ EVM Link Record

`kpx/lnk` expresses a link between a Kaspa owner address and an EVM address for hybrid authentication and UX.

## Envelope
See `docs/protocols/kpx-family-v1.md` for shared rules. This type uses:
- `t: "lnk"`
- `v: 1`
- `op: "set"` or `op: "clear"`

## Payload limits (v1)
- Max payload bytes (entire JSON): **256 bytes**

## `data` schema (v1)
| key | type | required | constraints |
|---|---:|:---:|---|
| `evm` | string | yes (for `set`) | lowercase hex address with `0x` prefix |

## Operation semantics (deterministic)
`kpx/lnk` is a **single-link pointer** per `(net, addr)` in v1:
- winning record is highest `seq`
- `op:set` stores the linked EVM address
- `op:clear` removes it

## Validity and Kasparex policy
Protocol validity is `payer == addr` plus schema correctness.

Kasparex may enforce additional policy (e.g., requiring an EVM signature proof before it *accepts* the link in its UI), without changing protocol validity.

## Examples

### Set link
```json
{
  "p": "kpx",
  "t": "lnk",
  "v": 1,
  "net": "mainnet",
  "op": "set",
  "addr": "kaspa:q...",
  "seq": 1,
  "data": { "evm": "0x1234567890abcdef1234567890abcdef12345678" }
}
```

### Clear link
```json
{
  "p": "kpx",
  "t": "lnk",
  "v": 1,
  "net": "mainnet",
  "op": "clear",
  "addr": "kaspa:q...",
  "seq": 2
}
```

