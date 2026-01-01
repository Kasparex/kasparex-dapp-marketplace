# Missing Trait Images

This document lists trait values from metadata that don't have corresponding image files in the IPFS/local folders.

## Missing Hat Traits

These Hat trait values should be **removed from your NFT metadata** as they don't have corresponding image files:

1. **Snapback Cap Front Green Pepe**
   - Normalized: `Snapback_Cap_Front_Green_Pepe.png`
   - Similar files: `Green_Byteblock.png`

2. **Snapback Cap Back Dark Violet**
   - Normalized: `Snapback_Cap_Back_Dark_Violet.png`
   - Similar files: `Violet_Drop.png`

3. **Snapback Cap Front Cream Pink Panther**
   - Normalized: `Snapback_Cap_Front_Cream_Pink_Panther.png`
   - Similar files: `Pink_Beam_Cap.png`, `Pink_Plasma_Cap.png`

4. **Snapback Cap Front White Pink Panther**
   - Normalized: `Snapback_Cap_Front_White_Pink_Panther.png`
   - Similar files: `Pink_Beam_Cap.png`, `Pink_Plasma_Cap.png`

5. **Kaspa Winter Hat**
   - Normalized: `Kaspa_Winter.png`
   - Similar files: `Kaspa_Red_Snap.png`

6. **Rainbow Hair**
   - Normalized: `Rainbow_Hair.png`
   - Similar files: `Rainbow_Dome.png`

## Action Required

**Option 1 (Recommended):** Remove these trait values from your NFT metadata JSON files on IPFS.

**Option 2:** Create and upload the missing image files to IPFS with the exact normalized names listed above.

**Option 3:** Update the metadata to use existing similar files (e.g., use `Rainbow_Dome` instead of `Rainbow_Hair`).

## Note

These traits are already filtered out in the PFP Builder code, so they won't appear in the UI. However, they should be removed from the source metadata to avoid confusion.

