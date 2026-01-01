# Upload Trait Images to IPFS - Guide

I've created a script to upload your PIXELKREX trait images to Pinata IPFS. Here's how to use it:

## Option 1: Automated Upload (Recommended)

### Step 1: Set Up Pinata API Credentials

1. Go to [Pinata Cloud](https://app.pinata.cloud/api-keys)
2. Create a new API key with these permissions:
   - ✅ `pinFileToIPFS` - Upload files
   - ✅ `pinJSONToIPFS` - Upload JSON metadata
   - ✅ `pinByHash` - Pin existing hashes

3. Copy your **API Key** and **Secret Key**

### Step 2: Set Environment Variables

Create a `.env.local` file in the project root (if it doesn't exist) and add:

```env
NEXT_PUBLIC_PINATA_API_KEY=your_api_key_here
NEXT_PUBLIC_PINATA_API_SECRET=your_api_secret_here
```

**OR** set them temporarily for this session:

**Windows PowerShell:**
```powershell
$env:NEXT_PUBLIC_PINATA_API_KEY="your_api_key_here"
$env:NEXT_PUBLIC_PINATA_API_SECRET="your_api_secret_here"
```

**Windows CMD:**
```cmd
set NEXT_PUBLIC_PINATA_API_KEY=your_api_key_here
set NEXT_PUBLIC_PINATA_API_SECRET=your_api_secret_here
```

**Mac/Linux:**
```bash
export NEXT_PUBLIC_PINATA_API_KEY="your_api_key_here"
export NEXT_PUBLIC_PINATA_API_SECRET="your_api_secret_here"
```

### Step 3: Test the Upload (Dry Run)

First, test what will be uploaded:

```bash
pnpm run upload:traits:dry
```

This will show you:
- How many files will be uploaded
- The folder structure
- No actual upload will happen

### Step 4: Upload to IPFS

Once you're ready, run the actual upload:

```bash
pnpm run upload:traits
```

The script will:
1. ✅ Read all PNG files from `public/nft/PIXELKREX/Pixelkrex traits/`
2. ✅ Maintain the folder structure (BACKGROUNDS, BASE, CLOTHING, HATS, etc.)
3. ✅ Upload everything to Pinata IPFS
4. ✅ Return the root CID

### Step 5: Update the Code

After upload completes, you'll get a CID like:
```
bafybeihxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Update `src/lib/nft/collections.ts`:

```typescript
PIXELKREX: {
  // ... other config
  traitImagesBaseUri: 'ipfs://bafybeihxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
},
```

### Step 6: Test

1. Verify the gateway URL works:
   ```
   https://gateway.pinata.cloud/ipfs/{CID}/HATS/Golden_Digger_Hat.png
   ```

2. Check the folder structure:
   ```
   https://gateway.pinata.cloud/ipfs/{CID}/
   ```

3. Test in your app - Hat traits should now load!

---

## Option 2: Manual Upload via Pinata Web Interface

If you prefer to upload manually:

1. Go to [Pinata Cloud](https://app.pinata.cloud/)
2. Click **"Upload"** → **"Folder"**
3. Select the `public/nft/PIXELKREX/Pixelkrex traits` folder
4. Wait for upload to complete
5. Copy the CID from the upload result
6. Update `src/lib/nft/collections.ts` with the new CID

---

## Option 3: Use Pinata CLI

1. Install Pinata CLI:
   ```bash
   npm install -g pinata-upload-cli
   ```

2. Authenticate:
   ```bash
   pinata-cli -a YOUR_PINATA_JWT
   ```

3. Upload the folder:
   ```bash
   cd public/nft/PIXELKREX
   pinata-cli -u "./Pixelkrex traits"
   ```

4. Copy the CID and update the code

---

## Troubleshooting

### "Pinata API credentials not found"
- Make sure you've set the environment variables correctly
- Restart your terminal after setting them
- Check that `.env.local` exists and has the correct values

### "form-data package not found"
- Run: `npm install form-data`
- Or: `pnpm add form-data`

### Upload fails with 403/401
- Check your API key permissions in Pinata dashboard
- Verify your API key and secret are correct
- Make sure you haven't exceeded Pinata's rate limits

### Files upload but structure is wrong
- The script maintains folder structure automatically
- Make sure you're uploading from the correct directory
- Check that folder names match exactly (HATS, not Hats or hats)

---

## What Gets Uploaded?

The script uploads:
- ✅ All PNG files from `public/nft/PIXELKREX/Pixelkrex traits/`
- ✅ Maintains folder structure:
  - BACKGROUNDS/
  - BASE/
  - CLOTHING/
  - DIAMONDS/
  - EYEWEAR/
  - HATS/ ← This is the important one!
  - HEADPHONES/
  - MASKS/
  - MOUTH/
  - NOSES/

---

## Expected Result

After successful upload, you should see:
```
✅ Upload successful!
   CID: bafybeihxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Size: X.XX MB
   Timestamp: 2024-XX-XX...
```

Then update the code and test - Hat traits should load correctly! 🎉

