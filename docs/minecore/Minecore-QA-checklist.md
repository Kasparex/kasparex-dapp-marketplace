# Minecore manual QA checklist

Short regression pass after logic or UX changes to Minecore plants.

## Plant card (Mining tab)

1. Unlock a slot if needed; complete setup (machine, batteries, crew, reactors if applicable).
2. **Battery exploit guard**: Partially drain a battery (or note charge %). Open battery picker and select the **same** pack already in that pillar — charge % must **not** jump to full unless capacity math changed.
3. **First battery**: On an empty pillar, installing a battery should behave per product rules (initial fill only when transitioning from no battery to a battery).
4. Start mining; pause/resume; stop — statuses update (Active / Paused / Ready / Crediting as applicable).

## Daily cap

5. Drive a plant until **DailyCapReached** (or simulate via save). Confirm banner mentions **rolling window countdown**, **raising ceiling** (rig / crew / Overclock / KREX Boost), and that **refining alone does not reset** extraction headroom.
6. Cap tooltip / daily bar **cap stack** includes **Modules +X** when flat-cap modules are mounted.

## Refine / redeem

7. Refine diamonds from accumulated/live balances; verify refine path still credits correctly and daily-cap messaging stays consistent.

## Recharge / power

8. **Battery refill modal**: Pay with KAS and KREX (wallet flows); selected slots fill after successful payment.
9. **Power tab**: Battery sync / reserve pack / runtime bundle — **KREX** paths charge treasury like KAS equivalents (no silent full refill without payment).
10. **Demo**: First-plant demo top-up remains intentional dev/demo-only where wired.

## Modules / fabrication

11. Fabrication blueprint for modules shows **rolling cap +D/24h** for modules with `diamondsPer24hFlat`, not legacy `% extraction` for migrated output modules.
12. Toggle modules on premium/advanced plants; rolling cap breakdown updates.

## Crew / NFT deck

13. Assign/unassign crew rows; clearing crew behaves correctly; incomplete crew still blocks mining where enforced.
