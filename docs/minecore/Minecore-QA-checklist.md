# Minecore manual QA checklist

Short regression pass after logic or UX changes to Minecore plants.

## Plant card (Mining tab)

1. Unlock a slot if needed; complete setup (machine, batteries, crew, reactors if applicable).
2. **Battery exploit guard**: Partially drain a battery (or note charge %). Open battery picker and select the **same** pack already in that pillar — charge % must **not** jump to full unless capacity math changed.
3. **Equip after empty pillar**: Installing a battery into a pillar that had **no pack** starts at **zero charge** until paid recharge (no silent full tank).
4. **Battery pillar lock**: With charge remaining, **remove** and **swap** actions are disabled until runtime hits ~0%. Then remove works; reinstall mounts **empty** until paid recharge (no free full tank).
5. Start mining; pause/resume; stop — statuses update (Active / Paused / Ready / Crediting as applicable).

## Daily cap

6. Hit **DailyCapReached**. Banner/tooltip should mention countdown, raising ceiling, **refining on-plant diamonds frees headroom**, and that **Extract→wallet** gems still count until the window rolls.
7. Cap tooltip / daily bar **cap stack** includes **Modules +X** when flat-cap modules are mounted.

## Refine / redeem

8. Refine diamonds taken from **accumulated / live on the plant** — mining headroom should **drop** so you can start cycles again once below ceiling (unless blocked by something else).
9. After **Extract** to refineable wallet, refining those wallet diamonds **does not** refund rolling-window budget until the timer rolls (by design).

## Recharge / power

10. **Battery refill modal**: Pay with KAS and KREX (wallet flows); selected slots fill after successful payment.
11. **Power tab**: Battery sync / reserve pack / runtime bundle — **KREX** paths charge treasury like KAS equivalents (no silent full refill without payment).
12. **Demo**: First-plant demo top-up remains intentional dev/demo-only where wired.

## Modules / fabrication

13. Fabrication blueprint for modules shows **rolling cap +D/24h** for modules with `diamondsPer24hFlat`, and power lines use qualitative **Less grid draw** / **Less wear strain** (not % capsules) for cooling/strain unless you intentionally add kW deltas later.
14. Toggle modules on premium/advanced plants; rolling cap breakdown updates.

## Crew / NFT deck

15. Assign/unassign crew rows; clearing crew behaves correctly; incomplete crew still blocks mining where enforced.
