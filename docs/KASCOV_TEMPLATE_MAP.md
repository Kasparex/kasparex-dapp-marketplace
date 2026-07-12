# Kasparex covenants on kascov

How each Hub Silverscript template maps to [kascov](https://kascov.io) surfaces, and what "success" looks like on testnet-10 or mainnet.

kascov discovers contracts from **on-chain activity**, not from Hub registration. Deploy real instances, spend/reveal them, and optionally publish verified source.

Hub config: `NEXT_PUBLIC_KASCOV_BASE=https://kascov.io` (see `src/lib/programmable/config.ts`).

## kascov surfaces (quick reference)

| Surface | API / UI | What it shows |
|---------|----------|---------------|
| Coin page | `/#/c/{covenant_id}` · `GET /data/{network}/c/{id}.json` | One smart coin: born / moved / retired timeline, UTXOs, revealed fields |
| What's running here | `GET /data/{network}/templates.json` | Aggregated **recognized templates** (live states, total value) |
| Tokens directory | `GET /data/{network}/tokens.json` | KCC20-shaped covenant tokens (`tick`, `op`, etc.; decoded, not validated) |
| Apps (move together) | `GET /data/{network}/families.json` | Clusters of covenant ids co-spent in the same transactions |
| Galaxy | `GET /data/{network}/galaxy.json` · Explore UI | Network-wide graph: dots = coins, edges = shared txs |
| Latest stories | Explore feed | Recent genesis / transition / burn events |
| Verified source | `POST /data/{network}/publish` | Etherscan-style: publish Silverscript keyed by program hash |
| Search | `GET /data/{network}/search?q=` | Match by covenant id prefix, friendly name, or template substring |

Friendly coin names (e.g. `brave-jade-osprey`) are **deterministic from covenant id**, not "Kasparex". Template labels come from script recognition (e.g. `SilverScript · Escrow`) or published source.

## Template map

Compiled from `covenant-lockbox/*.sil` via `npm run covenant:compile` → `public/covenant/*.json`.

### KasparexLockbox (`lockbox.sil`)

| | |
|--|--|
| **Hub dApp** | Covenant Lockbox (`/dapps/lockbox`) |
| **Pattern** | Stateful singleton · `claim` transition · optional timelock |
| **Primary kascov surface** | **templates.json** after deploy + at least one spend/reveal |
| **Coin page** | Yes: each lock instance is its own covenant id |
| **tokens.json** | No (native KAS escrow, not KCC20) |
| **families.json** | Unlikely alone; possible if co-spent with a payment or controller covenant |
| **Expected template label** | `SilverScript · KasparexLockbox` or generic P2SH state until revealed; exact string depends on kascov recognizer + `/publish` |
| **Testnet demo success** | 1) Deploy lock on testnet-10 (kascov lab or CLI). 2) Beneficiary claims. 3) Coin shows `revealed_template` + labeled constructor fields on [coin page](https://kascov.io/#/explore). 4) Template row increments in **what's running here** if still live |

### KasparexSplitPayment (`split-payment.sil`)

| | |
|--|--|
| **Hub dApp** | Covenant Split (`/dapps/covenant-split`) |
| **Pattern** | Verification · auth binding · 1 input → up to 8 outputs · stateless |
| **Primary kascov surface** | **templates.json**; **families.json** when used in multi-covenant checkout txs |
| **Coin page** | Yes per split vault / fan-out instance |
| **tokens.json** | No |
| **Galaxy** | High visibility when co-linked to other covenants in store-style flows |
| **Expected template label** | Likely `SilverScript · KasparexSplitPayment` after recognition; **publish source** so humans see Kasparex intent |
| **Testnet demo success** | 1) Fund split covenant. 2) Distribute to 2+ recipients in one tx. 3) Appears under templates; if same tx touches another covenant, check **apps · coins that move together** |
| **Store relevance** | Best candidate for future "seller + platform fee in one tx" visibility on kascov |

### KasparexMilestone (`milestone.sil`)

| | |
|--|--|
| **Hub dApp** | Covenant Milestone (`/dapps/covenant-milestone`) |
| **Pattern** | Stateful singleton · staged `release_next` transitions |
| **Primary kascov surface** | **templates.json** |
| **Coin page** | Yes; timeline shows multiple `transition` events as milestones unlock |
| **tokens.json** | No |
| **families.json** | Possible alongside crowdfund or treasury covenants in one campaign tx |
| **Testnet demo success** | Deploy → release step 1 → release step 2; coin page shows `event_count` > 2 and updated state fields |

### KasparexCrowdfund (`crowdfund.sil`)

| | |
|--|--|
| **Hub dApp** | Covenant Crowdfund (`/dapps/covenant-crowdfund`) |
| **Pattern** | Verification · cov binding · goal check (`raised_sompi >= goal_sompi`) |
| **Primary kascov surface** | **templates.json**; **latest stories** on active testnet campaigns |
| **Coin page** | Yes |
| **tokens.json** | No (unless paired with a separate KCC20 token covenant) |
| **families.json** | Strong fit: deposit UTXOs + goal verifier co-spent in assurance-contract flows |
| **Testnet demo success** | Multiple contributors + goal verification tx; family cluster if several covenant ids share txs |

### KasparexVoucher (`voucher.sil`)

| | |
|--|--|
| **Hub dApp** | Covenant Voucher (`/dapps/covenant-voucher`) |
| **Pattern** | Verification · hashlock + signature · single output redeem |
| **Primary kascov surface** | **templates.json** |
| **Coin page** | Yes; ends with **retired** after successful redeem |
| **tokens.json** | No |
| **families.json** | Possible in checkout: payment covenant + voucher redeem in related txs |
| **Testnet demo success** | Issue voucher → redeem with preimage; lifespan histogram gets another short-lived coin |

### quine.sil (reference only, not in `covenant:compile` bundle)

Educational self-replicating pattern. If deployed manually, appears like any other covenant on the **galaxy** and **coin page**; not a Hub product surface.

## KCC20 path (not these templates today)

None of the five compiled templates implement the KCC20 fungible interface. To appear on kascov **tokens** page:

1. Implement `KCC20State` (+ optional `virtual extension` per [KCC20 spec discussion](https://kas-smiths.org/t/fungible-token-covenant-specification-kcc20/8/16)).
2. Deploy on testnet-10 or mainnet.
3. Indexer picks up `template: "KCC20 token"` in `GET /data/{network}/tokens.json`.
4. Connect covenant id in Kasparex Tokens Dashboard (see [PROGRAMMABLE_TOKEN_UAAS.md](./PROGRAMMABLE_TOKEN_UAAS.md)).

## How to improve Kasparex visibility on kascov

Priority order (no Hub code required):

1. **Deploy on testnet-10** using [kascov playground](https://kascov.io/#/playground) or `kascov-lab` with compiled hex from `npm run covenant:compile`.
2. **Spend / reveal** so `revealed_template` and `revealed_fields` populate.
3. **Publish verified source** via kascov `POST /data/{network}/publish` with matching `.sil` + constructor args.
4. **Co-spend** multiple Kasparex covenants in one transaction where the product allows it → **families.json** / galaxy edges (closest to "Kasparex app running here").
5. **Recompile with post–PR-143 silverc** before mainnet deploy so template hashes stay canonical.

Linking from Hub ("View on kascov") helps users but does **not** add rows to **what's running here**. Only live on-chain instances do.

## Hub code touchpoints

| Concern | Path |
|---------|------|
| Base URL + explorer links | `src/lib/programmable/config.ts` |
| JSON client | `src/lib/programmable/kascovClient.ts` |
| Covenant metadata links | `src/lib/covenant/kpxCovenantMetadata.ts` |
| Artifacts | `public/covenant/*.json` |
| Silverscript sources | `covenant-lockbox/*.sil` |

## Smoke checklist (testnet-10)

- [ ] `NEXT_PUBLIC_KASCOV_BASE=https://kascov.io`
- [ ] Deploy one template instance; copy covenant id
- [ ] Open `https://kascov.io/#/c/{id}?network=testnet-10`
- [ ] Confirm `GET https://kascov.io/data/testnet-10/templates.json` lists your template after reveal
- [ ] Import same id in Hub Covenant Lab / Lockbox widget; **View on kascov** opens coin page
- [ ] Optional: publish source; confirm verified badge / readable decode on kascov
