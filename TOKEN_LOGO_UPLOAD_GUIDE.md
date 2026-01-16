# Token Logo Upload Guide

## Overview

You can upload token logos and featured images directly from the token page using the built-in edit modal. **No manual IPFS upload is required!** The system handles IPFS uploads automatically when you save your changes.

## How to Upload Token Logos

### Step 1: Navigate to a Token Page
1. Go to the Kasparex Hub
2. Navigate to the **Tokens** section
3. Click on any token (e.g., KAS, KREX, GRID)

### Step 2: Open the Edit Modal
1. **Connect your wallet** (must be connected as admin)
2. On the token page, look for the **Edit button** (pencil icon) next to the token logo in the sidebar
3. Click the Edit button to open the Edit Token Modal

### Step 3: Upload Images
The Edit Token Modal has a **"Media"** section where you can upload:

#### **Token Logo**
- Click on the **"Media"** section to expand it
- In the **"Token Logo"** field, you have two options:
  - **Option A: Upload a file** (Recommended)
    - Click "Choose File" or drag & drop an image file
    - Supported formats: PNG, JPEG, JPG, WebP
    - Max size: 5MB
    - The image will be automatically uploaded to IPFS
  - **Option B: Enter an IPFS URL**
    - If you already have an IPFS CID, paste it in the URL field
    - Format: `ipfs://Qm...` or `https://ipfs.io/ipfs/Qm...`

#### **Featured Image**
- In the **"Featured Image"** field, follow the same process:
  - Upload a file or enter an IPFS URL
  - This is the large banner image shown at the top of the token page

### Step 4: Save Changes
1. After uploading your images, scroll to the bottom of the modal
2. Click **"Save Changes (10 KAS)"**
3. Confirm the transaction in your wallet
4. Wait for the transaction to be confirmed
5. Your images are now saved to IPFS and will be displayed on the token page!

## Important Notes

### Admin Access Required
- Only **admin addresses** can edit tokens
- Make sure your connected wallet address is registered as an admin
- The Edit button only appears when you're connected as an admin

### IPFS Storage
- Images are automatically uploaded to IPFS when you upload a file
- The system uses a structured folder approach:
  - Token logos: `ipfs://{baseCID}/tokens/{tokenId}/logo.png`
  - Featured images: `ipfs://{baseCID}/tokens/{tokenId}/featured.png`
- Images are pinned to IPFS for permanent storage

### Image Requirements
- **Logo**: Square format recommended (e.g., 512x512px)
- **Featured Image**: Wide format recommended (e.g., 1200x600px)
- **Formats**: PNG, JPEG, JPG, WebP
- **Max Size**: 5MB per image

### Automatic dApp Logo Sync
- If a token is associated with a dApp (local token), the dApp logo will automatically sync to match the token logo
- This happens automatically when you save token changes

## Troubleshooting

### Edit Button Not Showing
- Make sure your wallet is connected
- Verify your address is registered as an admin
- Refresh the page and try again

### Upload Fails
- Check your internet connection
- Verify the image file is under 5MB
- Make sure the file format is supported (PNG, JPEG, JPG, WebP)
- Try a different image file

### Images Not Displaying
- Wait a few moments for IPFS propagation
- Clear your browser cache
- Check that the IPFS gateway is accessible

## Alternative: Manual IPFS Upload

If you prefer to upload to IPFS manually:

1. Upload your image to IPFS using a service like:
   - Pinata (https://pinata.cloud)
   - Web3.Storage (https://web3.storage)
   - NFT.Storage (https://nft.storage)

2. Get the IPFS CID (e.g., `QmXxxx...`)

3. Use the Edit Token Modal and paste the IPFS URL:
   - Format: `ipfs://QmXxxx...` or `https://ipfs.io/ipfs/QmXxxx...`

4. Save changes (still requires 10 KAS payment)

## Summary

✅ **No manual IPFS upload needed** - just click Edit, upload your image, and save!
✅ **Automatic IPFS integration** - images are uploaded and pinned automatically
✅ **Easy drag & drop** - simple file upload interface
✅ **Real-time preview** - see your images before saving
✅ **Automatic dApp sync** - dApp logos sync with token logos automatically

The entire process is handled through the web interface - no command line or manual IPFS tools required!
