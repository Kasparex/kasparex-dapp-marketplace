# kpx/pf v1  -  Profile Record

Profile records provide a small, wallet-owned identity payload (no URLs/IPFS in v1).

## Envelope
See `docs/protocols/kpx-family-v1.md` for shared rules. This type uses:
- `t: "pf"`
- `v: 1`
- `op: "set"` or `op: "clear"`

## Payload limits (v1)
- Max payload bytes (entire JSON): **512 bytes**

## `data` schema (v1)
All fields are optional in JSON, but **replace semantics** apply (see below).

| key | type | constraints |
|---|---|---|
| `display` | string | 1–24 chars, trim, collapse spaces |
| `bio` | string | 0–160 chars, trim |
| `tags` | string[] | max 10; each 1–16 chars; lowercase; `[a-z0-9-]`; dedupe |

## Operation semantics (deterministic)
### `op: "set"` (full replace)
The winning `kpx/pf` record for `(net, addr, t)` is the **complete authoritative profile state**.

- If a field is missing from `data`, it is treated as **absent/cleared** in the resulting profile.
- This makes indexers simple: no replay, no merges, no partial history required.

### `op: "clear"`
Clears the profile to an empty state (equivalent to `set` with empty `data`).

## Examples

### Set profile
```json
{
  "p": "kpx",
  "t": "pf",
  "v": 1,
  "net": "mainnet",
  "op": "set",
  "addr": "kaspa:q...",
  "seq": 1,
  "data": {
    "display": "Kasparex",
    "bio": "Builder on Kaspa",
    "tags": ["kaspa", "builder"]
  }
}
```

### Clear profile
```json
{
  "p": "kpx",
  "t": "pf",
  "v": 1,
  "net": "mainnet",
  "op": "clear",
  "addr": "kaspa:q...",
  "seq": 2
}
```

