# Story management (authoring workspace)

This directory is the **writer-facing workspace** for Krex's Chronicles: character bibles, shared lore, KMAG notes, vehicles, and community copy.

## What the live site uses

The Next.js app serves lore from:

- `data/chronicles/*.json` (catalog metadata)
- `data/chronicles/bodies/*.md` (published chapter prose)

It does **not** import these Markdown files at runtime. Keep this tree as **source material** and sync changes into `data/chronicles` manually or via a future script.

## Entitlements / vault (testing)

Mock wallet unlocks for `/chronicles/dashboard` are defined in:

- `data/chronicles/entitlements-catalog.json`
- `data/chronicles/entitlements-mock.json`

To simulate a connected wallet with unlocks, add your `kaspa:` address (normalized with the `kaspa:` prefix) to `entitlements-mock.json` under `byAddress` with `unlockedIds` matching catalog `id` values. A sample key `kaspa:demo-vault-wallet` is shipped for local UI testing only (not a real address).

## Sidebar folder map

`data/chronicles/story-folder-map.json` maps top-level folder names here to character slugs on the site (`null` = draft / no public page yet).

See also `README_QuickStart.md` in this folder for internal workflow.
