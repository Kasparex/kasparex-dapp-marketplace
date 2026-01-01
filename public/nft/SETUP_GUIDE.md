# PIXELKREX Trait Images Setup Guide

## ✅ Current Structure (Verified)

Your trait images are organized correctly:

```
public/nft/PIXELKREX/traits/
├── BACKGROUNDS/     (66 PNG files)
├── BASE/            (18 PNG files)
├── CLOTHING/        (97 PNG files)
├── DIAMONDS/        (7 PNG files)
├── EYEWEAR/         (44 PNG files)
├── GEAR/            (30 PNG files)
├── HATS/            (150 PNG files)
├── MASKS/           (12 PNG files)
├── MOUTH/           (84 PNG files)
├── NOSES/           (5 PNG files)
└── TRANSPARENT/     (7 PNG files - social media icons)
```

## 📋 File Naming Convention

**Current format:** `{TraitValue}.png` (e.g., `Aqua Mint.png`, `Blue.png`)

**This is correct!** The code automatically:
- Maps trait types from metadata to folder names (case-insensitive)
- Handles spaces and special characters in file names
- Works with both local files and IPFS

## 🔄 How It Works

1. **Trait Type Mapping:**
   - Metadata trait type: `"Background"` → Folder: `BACKGROUNDS`
   - Metadata trait type: `"Hat"` → Folder: `HATS`
   - Metadata trait type: `"Base"` → Folder: `BASE`
   - etc.

2. **File Matching:**
   - Metadata value: `"Aqua Mint"` → File: `Aqua Mint.png`
   - Metadata value: `"Blue"` → File: `Blue.png`
   - Spaces and case are preserved

3. **Path Construction:**
   - **Local (current):** `/nft/PIXELKREX/traits/BACKGROUNDS/Aqua Mint.png`
   - **IPFS (after upload):** `ipfs://{cid}/BACKGROUNDS/Aqua Mint.png`

## 📤 Next Steps: Upload to IPFS

### Step 1: Upload Trait Images to IPFS

Upload the entire `traits` folder to IPFS maintaining the folder structure:

```
Your IPFS CID/
├── BACKGROUNDS/
│   ├── Aqua Mint.png
│   ├── Aqua.png
│   └── ...
├── BASE/
│   ├── Byte Moss.png
│   └── ...
├── CLOTHING/
├── DIAMONDS/
├── EYEWEAR/
├── GEAR/
├── HATS/
├── MASKS/
├── MOUTH/
└── NOSES/
```

**Recommended IPFS Services:**
- Pinata (https://pinata.cloud)
- NFT.Storage (https://nft.storage)
- Web3.Storage (https://web3.storage)

### Step 2: Get Your IPFS CID

After uploading, you'll receive a CID like:
```
bafybeihxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Add traitImagesBaseUri to Collection Config

Edit `src/lib/nft/collections.ts`:

```typescript
PIXELKREX: {
  id: 'PIXELKREX',
  name: 'PIXELKREX',
  slug: 'PIXELKREX',
  deployer: 'kaspa:qzeegrxt993rkwkupx0u8yd8sz94atpeg4e7x8yrjav8x7wgulxszc8svhenj',
  baseUri: 'ipfs://bafybeiakbvm7hn6ev23tiorgdxh3hcjkuu7huxdijklybastzmceclycnu',
  kaspaComUrl: 'https://kaspa.com/nft/collections/PIXELKREX',
  description: 'PIXELKREX NFT collection',
  traitImagesBaseUri: 'ipfs://YOUR_CID_HERE', // Add this line
},
```

**Important:** The CID should point to the `traits` folder, not the individual trait folders.

### Step 4: Test

1. The PFP Builder will automatically switch from local files to IPFS
2. Test trait selection and image composition
3. Verify all trait types load correctly

## 🎨 Trait Type Mapping Reference

| Metadata Trait Type | Folder Name | Examples |
|---------------------|-------------|----------|
| Background, Backgrounds | BACKGROUNDS | Aqua Mint, Blue, Kaspa |
| Base | BASE | Byte Moss, Cloud Sync |
| Clothing | CLOTHING | Various clothing items |
| Diamonds, Diamond | DIAMONDS | Diamond 1-7 |
| Eyewear | EYEWEAR | Various eyewear |
| Gear | GEAR | gear 1-10, diamond 1-15 |
| Hats, Hat | HATS | Various hats |
| Masks, Mask | MASKS | mask 1-12 |
| Mouth | MOUTH | Various mouth expressions |
| Noses, Nose | NOSES | nose 1-5 |

## ✅ Verification Checklist

- [x] Folder structure matches expected format
- [x] File names match trait values from metadata
- [x] All PNG files are valid images
- [ ] Uploaded to IPFS (pending)
- [ ] traitImagesBaseUri added to collection config (pending)
- [ ] Tested PFP Builder with IPFS (pending)

