# How to Fix Metadata/File Name Mismatches on IPFS

This guide explains how to identify and fix mismatches between NFT metadata trait values and the actual file names on IPFS.

## Understanding the Problem

When HATS (or any trait) don't load, it's usually because:
- **Metadata says:** `"Golden Digger Hat"`
- **File on IPFS is:** `Golden_Digger.png` (missing "Hat")
- **Code normalizes to:** `Golden_Digger_Hat.png` (based on metadata)
- **Result:** File not found ❌

## Step 1: Identify the Mismatches

### Option A: Use Browser Console (Recommended)

1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Navigate to the PFP Builder page
5. Look for `[PFP Builder]` log messages:
   ```
   [PFP Builder] Getting image URL for trait: {
     traitType: "Hat",
     value: "Golden Digger Hat",
     folderName: "HATS",
     normalizedValue: "Golden_Digger_Hat",
     ...
   }
   ```
6. Note the `normalizedValue` - this is what the code expects
7. Check if the file exists on IPFS with that exact name

### Option B: Compare Metadata vs IPFS Files

1. **Get all metadata trait values:**
   - Query your NFT metadata from IPFS
   - Extract all HATS trait values
   - Normalize them (spaces → underscores, preserve capitalization)

2. **List all files on IPFS:**
   - Access your IPFS gateway: `https://your-gateway.com/ipfs/{CID}/HATS/`
   - Or use Pinata's file browser
   - List all `.png` files in the HATS folder

3. **Compare:**
   - Create a spreadsheet with two columns:
     - Column A: Normalized metadata values
     - Column B: Actual IPFS file names
   - Highlight mismatches

## Step 2: Choose Your Fix Strategy

### Strategy A: Rename Files on IPFS (If you control the files)

**Best when:** You have access to rename files before uploading

**Steps:**
1. Download all HATS files from IPFS
2. Rename files to match metadata values exactly:
   - `Golden_Digger.png` → `Golden_Digger_Hat.png`
   - `Blue_Byte.png` → `Blue_Byte.png` (if metadata says "Blue Byte")
3. Re-upload the entire HATS folder to IPFS
4. Update your `traitImagesBaseUri` CID in `collections.ts`

**Example renaming script (Node.js):**
```javascript
const fs = require('fs');
const path = require('path');

const HATS_FOLDER = './hats-files';
const METADATA_MAP = {
  'Golden_Digger': 'Golden_Digger_Hat',
  'Blue_Byte': 'Blue_Byte',
  // Add all mappings here
};

fs.readdirSync(HATS_FOLDER).forEach(file => {
  const baseName = file.replace('.png', '');
  if (METADATA_MAP[baseName]) {
    const newName = `${METADATA_MAP[baseName]}.png`;
    fs.renameSync(
      path.join(HATS_FOLDER, file),
      path.join(HATS_FOLDER, newName)
    );
    console.log(`Renamed: ${file} → ${newName}`);
  }
});
```

### Strategy B: Update Metadata on IPFS (If you control the metadata)

**Best when:** You have access to update NFT metadata

**Steps:**
1. Identify which metadata values don't match file names
2. Update metadata to match existing file names:
   - Change `"Golden Digger Hat"` → `"Golden Digger"` (if file is `Golden_Digger.png`)
   - Change `"Blue Byte Hat"` → `"Blue Byte"` (if file is `Blue_Byte.png`)
3. Re-upload updated metadata JSON files to IPFS
4. Update your NFT contract's base URI if needed

**⚠️ Warning:** This changes the actual NFT metadata, which may affect:
- NFT marketplaces
- Existing NFT holders
- Rarity calculations
- Other systems using your metadata

### Strategy C: Create Missing Files (If files are missing)

**Best when:** Files don't exist at all

**Steps:**
1. Identify missing files from metadata
2. Create placeholder images or find the correct images
3. Name them exactly as metadata expects (after normalization)
4. Upload missing files to IPFS HATS folder
5. Update CID if you created a new folder structure

## Step 3: Re-upload to IPFS

### Using Pinata (Recommended)

1. **Prepare your files:**
   ```
   HATS/
   ├── Golden_Digger_Hat.png
   ├── Blue_Byte.png
   ├── Green_Stylish_Hair.png
   └── ... (all files)
   ```

2. **Upload via Pinata Web UI:**
   - Go to https://app.pinata.cloud/
   - Click "Upload" → "Folder"
   - Select your `HATS` folder
   - Wait for upload to complete
   - Copy the CID

3. **Upload via Pinata API:**
   ```bash
   curl -X POST https://api.pinata.cloud/pinning/pinFileToIPFS \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "file=@HATS.zip"
   ```

4. **Update your code:**
   ```typescript
   // src/lib/nft/collections.ts
   traitImagesBaseUri: 'ipfs://NEW_CID_HERE'
   ```

### Using IPFS CLI

```bash
# Add the HATS folder to IPFS
ipfs add -r HATS/

# Pin it to your node
ipfs pin add CID_HERE

# Or use a pinning service
ipfs pin remote add --service=pinata CID_HERE
```

## Step 4: Verify the Fix

1. **Check file accessibility:**
   ```
   https://your-gateway.com/ipfs/{CID}/HATS/Golden_Digger_Hat.png
   ```
   Should return the image (not 404)

2. **Test in your app:**
   - Open PFP Builder
   - Select a HATS trait
   - Check browser console for successful loads
   - Verify image appears correctly

3. **Check console logs:**
   - Look for: `✅ Successfully loaded: Hat:Golden Digger Hat -> {url}`
   - No errors should appear

## Step 5: Update Collection Configuration

After fixing files and getting a new CID:

```typescript
// src/lib/nft/collections.ts
export const collections: Record<string, CollectionConfig> = {
  PIXELKREX: {
    // ... other config
    traitImagesBaseUri: 'ipfs://NEW_CID_AFTER_FIX', // Update this
  },
};
```

## Quick Reference: Normalization Rules

The code normalizes trait values like this:

1. **Preserves capitalization** (case-sensitive matching)
2. **Converts spaces to underscores:** `"Golden Digger Hat"` → `"Golden_Digger_Hat"`
3. **Preserves special characters:** `"Blue-Byte"` → `"Blue-Byte"` (hyphens kept)
4. **Removes em dashes:** `"Name – Description"` → `"Name_Description"`
5. **No suffix stripping:** Preserves "Hat", "Cap", etc. if in metadata

**Examples:**
- Metadata: `"Golden Digger Hat"` → File: `Golden_Digger_Hat.png` ✅
- Metadata: `"Green Stylish Hair"` → File: `Green_Stylish_Hair.png` ✅
- Metadata: `"Burnt Rust Cap"` → File: `Burnt_Rust_Cap.png` ✅

## Troubleshooting

### Files still not loading?

1. **Check CID is correct** in `collections.ts`
2. **Verify folder name** is exactly `HATS` (uppercase, no spaces)
3. **Check file names** match normalized metadata exactly (case-sensitive)
4. **Test gateway URL** directly in browser
5. **Check browser console** for specific error messages
6. **Verify CORS** settings on your IPFS gateway

### Gateway issues?

If using a custom Pinata gateway:
- Ensure gateway token is set in environment variables
- Check gateway URL format: `https://{gateway}.mypinata.cloud/ipfs/{CID}/...`
- Verify gateway is accessible and not rate-limited

## Need Help?

If you're still having issues:
1. Share the browser console logs
2. Share a few examples of:
   - Metadata trait value
   - Expected normalized file name
   - Actual file name on IPFS
3. Check if the issue is specific to certain HATS or all of them

