# KCC20 Interface (reference)

Saved from the community draft by [@Manyfestation](https://github.com/Manyfestation) (gist updated 2026-07-01):

https://gist.github.com/Manyfestation/be844fbe1e8c00ac990898e7a737bfec

Contributors mentioned in the announcement: @missutton, @IzioDev, @saefstroem, @someone235.

## What KCC20 is

A **KCC20 token** is a covenant instance that implements a **minimal fungible-token interface** on Kaspa L1 (post-Toccata / Covenants++).

It is **not** the same as inscription-based **KRC-20**. KRC-20 today relies on off-chain indexers interpreting inscriptions. KCC20 is covenant-native: balances live in P2SH UTXOs, and transfers are validated by SilverScript covenant rules plus a shared Reader/Writer convention.

To be KCC20-compatible, a covenant must:

- Maintain basic token state:
  - who owns a token quantity
  - how much they own
- Provide a **transfer entrypoint** that follows the KCC20 transfer convention.

KCC20 interaction reduces to two responsibilities:

1. Determine current KCC20 state (Reader)
2. Create valid next-state transactions (Writer)

## Roles

### Reader

Observes accepted Kaspa transactions and projects KCC20 state.

Given accepted transactions and token descriptors, it identifies KCC20 activity, decodes token state, and maintains the live KCC20 UTXO set.

### Writer

Consumes Reader-provided state and user intent.

Given live KCC20 UTXOs, decoded token state, and token descriptors, it constructs valid KCC20 transactions.

## Token Descriptor

Each known KCC20 token covenant is described by a descriptor artifact per covenant id:

```text
TokenDescriptor {
    prefix
    suffix
    state_layout
    leader_entrypoint_selector
    delegator_entrypoint_selector
}
```

| Field | Purpose |
|-------|---------|
| `prefix`, `suffix` | Script bytes before/after encoded token state. Reader verifies decoded states; Writer reconstructs outputs. |
| `state_layout` | How raw state bytes are decoded/encoded. Must include standard header: `owner_identifier`, `identifier_type`, `amount`. |
| `leader_entrypoint_selector` | Builds leader input sigscript for transfers. |
| `delegator_entrypoint_selector` | Builds delegating input sigscripts. |

## Reader operation (summary)

For each transaction with inputs matching registered token descriptors:

1. Identify the covenant input leader (convention: first covenant input).
2. Extract declared raw `next_states` from the leader input sigscript.
3. Decode `next_states` using `state_layout`.
4. Verify each decoded next state against the matching transaction output.
5. Update the live KCC20 UTXO set only after verification succeeds.

The transfer convention expects a **verification-mode** covenant declaration: the Writer provides intended next states in the sigscript; the entrypoint **verifies** those states instead of computing them at runtime.

Verification loop (conceptual):

```text
decoded_next_states = decode(next_states_raw, state_layout)

for index, next_state in enumerate(decoded_next_states):
    encoded_state = encode(next_state, state_layout)
    expected_output_p2sh = P2SH(prefix || encoded_state || suffix)
    output_index = cov_output_index(index)
    output_p2sh = outputs[output_index].spk
    assert output_p2sh == expected_output_p2sh
```

## Writer operation (summary)

1. Fetch relevant owner token UTXOs from the Reader.
2. Verify indexed decoded state against `P2SH(prefix || encoded_state || suffix)`.
3. Calculate the state transition; produce `prev_states` and `next_states`.
4. Build leader sigscript: redeem script + leader entrypoint + transfer arguments (`next_states`, `authorization_data`).
5. Build delegator sigscripts for remaining inputs.
6. Set output scripts from `next_states`.
7. User signs; Writer broadcasts.

## Extension state

Token state may extend the standard KCC20 header:

```text
encoded_state = encoded_kcc20_state || extension_state_bytes
```

Generic Readers only need the standard header. Generic Writers only need the transfer convention. If inputs have incompatible extension state, the Writer must fail rather than merge custom state arbitrarily.

Mint, burn, freeze, vesting, and stablecoin rules are intentionally **above** the minimal interface, not part of the first generic layer.

## Future goals (from spec)

- Practical SilverScript interaction and composition with KCC20 tokens.
- Explorers expose genesis + pre-compiled Silver logic so deployed covenants can be matched, verified, and traced through state transitions.

## Kasparex Hub relevance

See also:

- [TOCCATA_READINESS.md](./TOCCATA_READINESS.md)
- [COVENANT_EXTERNAL_INTEGRATION.md](./COVENANT_EXTERNAL_INTEGRATION.md)
- `.cursor/rules/toccata-agent-brief.mdc`
- `.cursor/rules/silverscript-covenant-design.mdc`

### L1 programmability vs KCC20

**Covenants and Toccata do not require KCC20.** Hub already ships covenant templates (lockbox, split, crowdfund, milestone, voucher) that are pure L1 programmability with no fungible token layer.

**KCC20 is optional** and applies when you want **fungible tokens** (KREX, GRID, loyalty points, LP shares) as covenant UTXOs instead of inscription KRC-20.

### Fit for KREX / Hub tokens

| Today (KREX L1) | Possible KCC20 path |
|-----------------|---------------------|
| KRC-20 inscription + external indexer (Kasplex / KasWare) | Covenant UTXOs + TokenDescriptor + Reader |
| Tier checks via `queryL1KREXBalance` | Tier checks via Reader UTXO set for owner (**also:** wrapped KCC20 via `queryKcc20KrexBalance` in Hub total) |
| No on-chain composability with Hub covenants | Atomic KCC20 + covenant flows (e.g. lock KREX in lockbox, crowdfund in KCC20) |

Wrap / migrate path: [KREX_WRAP_BRIDGE.md](./KREX_WRAP_BRIDGE.md) (`/dapps/krex-wrap-bridge`, KRC20 Wrap Bridge).

### Architecture alignment

Hub principles (client-first, no Hub chain scanning) map cleanly to KCC20:

- **Writer** side: wallet + Hub tx builder (same as existing `sendCovenantTransaction` path).
- **Reader** side: wallet plugin, user-local light indexer, or third-party explorer API. Hub should not operate a global Reader unless explicitly requested.

### Lightweight / sustainable?

**Yes, by design:**

- Minimal on-chain state: owner + amount (+ optional extension bytes).
- UTXO-parallel model fits Kaspa BlockDAG throughput.
- Verification-mode transfers avoid heavy runtime computation in script.
- Bounded covenant logic (not full account-style global mutable contracts).
- Reader verifies against consensus-visible scripts; it does not trust declared state blindly.

**Caveats:**

- UTXO fragmentation (many small balance UTXOs) increases mass/fees; wallets/Writers should consolidate when practical.
- Each token variant still needs a published TokenDescriptor and visible SilverScript rules for trust.
- Ecosystem maturity (wallets, Readers, explorers) is still early compared to KRC-20 indexers.

## Related Kaspa docs / KIPs

- [Toccata agent brief](https://docs.kaspa.org/toccata/agent-brief)
- [KIP-17 Covenants](https://github.com/kaspanet/kips/blob/master/kip-0017.md)
- [KIP-20 Covenant IDs](https://github.com/kaspanet/kips/blob/master/kip-0020.md)
