# Vercel Deployment Checklist

## Before Deploying

### ✅ 1. Set Environment Variable in Vercel

**IMPORTANT:** Your `.env.local` file won't be deployed. You MUST set the environment variable in Vercel.

1. Go to [vercel.com](https://vercel.com) → Your Project
2. **Settings** → **Environment Variables**
3. Click **Add New**
4. **Name:** `NEXT_PUBLIC_ADMIN_ADDRESSES`
5. **Value:** Your wallet address(es) (comma-separated if multiple)
   - Example: `0x0808e5ce2f0f6d488975e5f23f1a1c8b6dd53cbc`
   - Multiple: `0xAddress1,0xAddress2`
6. **Environments:** Select all (Production, Preview, Development)
7. Click **Save**

### ✅ 2. Commit All Changes

All new files and modifications need to be committed:

```bash
git add .
git commit -m "Add authorization system: admin dashboard, developer assignments, and fee management"
```

### ✅ 3. Push to GitHub

```bash
git push origin main
# or your branch name
```

### ✅ 4. Vercel Will Auto-Deploy

If you have auto-deployment enabled, Vercel will automatically deploy when you push.

Otherwise, manually trigger deployment in Vercel dashboard.

## After Deployment

### ✅ 5. Verify Environment Variable

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Confirm `NEXT_PUBLIC_ADMIN_ADDRESSES` is listed
3. Check that it's enabled for Production

### ✅ 6. Test Admin Access

1. Visit your deployed site
2. Connect your wallet (the one you added as admin)
3. Look for the **lock icon** 🔒 with blue dot in the header
4. Click it or go to `/admin`
5. You should see the admin dashboard

### ✅ 7. Test Features

**Admin Dashboard:**
- [ ] Can access `/admin` page
- [ ] See "Overview", "Developer Authorization", and "Fee Management" tabs
- [ ] No "Access Denied" message

**Developer Authorization:**
- [ ] Can search for dApps
- [ ] Can assign a developer to a dApp
- [ ] Transaction completes successfully
- [ ] Can see assigned developers in the list
- [ ] Can revoke developers

**Fee Management:**
- [ ] Can view current Treasury distribution percentages
- [ ] Can update percentages (must sum to 100%)
- [ ] Can update distribution addresses
- [ ] Can update Kasparex fee percentage
- [ ] Can view Treasury balance
- [ ] Can create/update subscription plans for dApps

**User Profile:**
- [ ] Assigned developers can see "Assigned dApps" tab
- [ ] Assigned dApps show with "Assigned" badge
- [ ] Can click "Edit" on assigned dApps

## Troubleshooting

### Admin icon not showing
- Check Vercel environment variable is set correctly
- Verify you're connected with the exact wallet address
- Check browser console for errors
- Wait a few minutes after deployment (cache might need to clear)

### "Access Denied" on /admin
- Double-check the wallet address in Vercel matches your connected wallet
- Ensure environment variable is enabled for Production
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Contract calls failing
- Make sure contracts are deployed on the network you're using
- Check that AuthorizationRegistry address is set in contract addresses
- Verify you're on the correct network (Testnet/Mainnet)

## Important Notes

⚠️ **Remember:**
- `.env.local` is NOT deployed to Vercel
- You MUST set environment variables in Vercel dashboard
- Changes to environment variables require a redeploy
- The admin address must match exactly (case-insensitive, but format must be correct)

## Next Steps After Testing

1. Deploy AuthorizationRegistry contract (if not already deployed)
2. Update contract addresses in environment variables or code
3. Test full workflow: Assign developer → Developer edits dApp → Developer earns revenue

