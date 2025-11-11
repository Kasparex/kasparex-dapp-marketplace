# Troubleshooting Guide

## IPFS Test Page Loading Slowly

If `/test-ipfs` page is loading slowly or hanging:

### 1. Check Environment Variables

Make sure your `.env.local` file has:
```env
NEXT_PUBLIC_PINATA_API_KEY=your_key_here
NEXT_PUBLIC_PINATA_API_SECRET=your_secret_here
```

**Important:** After adding/changing environment variables:
- Stop your dev server (Ctrl+C)
- Restart it: `npm run dev`
- Environment variables are loaded at startup

### 2. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab** - Look for errors
- **Network tab** - Check if requests are hanging
- **React DevTools** - Check for infinite re-renders

### 3. Common Issues

#### "API credentials not configured"
- Restart dev server after adding env vars
- Check `.env.local` file is in project root
- Verify variable names match exactly (case-sensitive)

#### Page hangs on load
- Check browser console for errors
- Try hard refresh (Ctrl+Shift+R)
- Clear browser cache
- Check if other pages load (try `/`)

#### Upload fails
- Verify API keys in Pinata dashboard
- Check API key permissions (needs `pinFileToIPFS`, `pinJSONToIPFS`)
- Check Pinata account limits (free tier has limits)

### 4. Quick Test

Try a minimal test in browser console:
```javascript
// Test if Pinata API is accessible
fetch('https://api.pinata.cloud/data/testAuthentication', {
  headers: {
    'pinata_api_key': 'YOUR_KEY',
    'pinata_secret_api_key': 'YOUR_SECRET'
  }
}).then(r => r.json()).then(console.log)
```

### 5. Alternative: Test Directly

If the page still doesn't load, test IPFS directly:

```bash
# Test Pinata API with curl
curl -X GET "https://api.pinata.cloud/data/testAuthentication" \
  -H "pinata_api_key: YOUR_KEY" \
  -H "pinata_secret_api_key: YOUR_SECRET"
```

### 6. Check Dev Server Logs

Look at your terminal where `npm run dev` is running:
- Are there compilation errors?
- Are there runtime errors?
- Is the server responding?

### 7. Simplify the Test

If still having issues, create a minimal test:

```tsx
// Minimal test component
export default function Test() {
  const test = async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY!,
        'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_API_SECRET!,
      },
      body: formData,
    });
    
    console.log(await response.json());
  };
  
  return <button onClick={test}>Test Upload</button>;
}
```

## Still Having Issues?

1. Check Pinata dashboard - verify account is active
2. Check network connectivity
3. Try a different browser
4. Check if other Next.js pages load
5. Review server logs for errors

