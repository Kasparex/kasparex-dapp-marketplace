# Pinata IPFS Setup Guide

## Getting Started with Pinata

Pinata is a user-friendly IPFS pinning service that doesn't require invitations. Here's how to set it up:

### 1. Create a Pinata Account

1. Go to [https://www.pinata.cloud/](https://www.pinata.cloud/)
2. Click "Sign Up" (free tier available)
3. Complete the registration process

### 2. Get Your API Keys

1. Log in to [Pinata Cloud](https://app.pinata.cloud/)
2. Go to **Account Settings** → **API Keys**
3. Click **"New Key"**
4. Give it a name (e.g., "Kasparex dApps")
5. Set permissions:
   - ✅ **pinFileToIPFS** - Upload files
   - ✅ **pinJSONToIPFS** - Upload JSON metadata
   - ✅ **pinByHash** - Pin existing hashes
   - ✅ **unpin** - Remove pins (optional)
6. Click **"Create Key"**
7. **Copy both the API Key and Secret** (you won't see the secret again!)

### 3. Configure Environment Variables

Add to your `.env.local` file:

```env
NEXT_PUBLIC_PINATA_API_KEY=your_api_key_here
NEXT_PUBLIC_PINATA_API_SECRET=your_api_secret_here
```

### 4. Test the Integration

The IPFS hooks are ready to use:

```tsx
import { useIPFSUpload } from '@/lib/ipfs/hooks';

function MyComponent() {
  const { upload, uploadJSON, isUploading, error, hash } = useIPFSUpload();

  const handleUpload = async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const cid = await upload(file);
    console.log('Uploaded to IPFS:', cid);
  };

  return (
    <button onClick={handleUpload} disabled={isUploading}>
      {isUploading ? 'Uploading...' : 'Upload to IPFS'}
    </button>
  );
}
```

## Pinata Features

### Free Tier
- 1 GB storage
- Unlimited requests
- Public gateway access

### Paid Tiers
- More storage
- Priority pinning
- Dedicated gateways
- Advanced analytics

## Gateway URLs

Pinata provides fast gateway access:
- Primary: `https://gateway.pinata.cloud/ipfs/{hash}`
- Fallback gateways are automatically used if Pinata is unavailable

## Best Practices

1. **Always pin important content** - Use `pin: true` option (default)
2. **Use descriptive filenames** - Helps with organization in Pinata dashboard
3. **Monitor your usage** - Check Pinata dashboard for storage/bandwidth
4. **Use JSON for metadata** - More efficient than storing in file names

## Troubleshooting

### "API credentials not configured"
- Check that environment variables are set correctly
- Restart your dev server after adding env vars
- Verify the keys in Pinata dashboard

### Upload fails
- Check API key permissions
- Verify you haven't exceeded free tier limits
- Check browser console for detailed error messages

### Content not accessible
- Ensure content is pinned (check Pinata dashboard)
- Try different gateway URLs
- Verify the hash is correct

## Migration from Fleek

The code has been updated to use Pinata instead of Fleek. No other changes needed - the interface remains the same!

