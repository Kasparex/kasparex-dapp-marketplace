# Timeline Admin Setup

## Enabling Timeline Editing

By default, the timeline editor buttons are **hidden** for all users. Only you (the admin) can enable them.

## How to Enable Editing

1. Go to your **Vercel Dashboard**
2. Select your project: `kasparex-dapp-marketplace`
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `NEXT_PUBLIC_ENABLE_TIMELINE_EDITING`
   - **Value**: `true`
   - **Environments**: Production, Preview, Development (or just Production if you only want it there)
5. Click **Save**
6. **Redeploy** your application:
   - Go to **Deployments** tab
   - Click **"..."** on the latest deployment
   - Select **"Redeploy"**

## After Enabling

Once enabled, you will see:
- **"Add Updates"**, **"Add Tasks to Do"**, **"Add Potential Ideas"**, and **"Add Bug Fixes"** buttons
- **Edit** buttons on each timeline entry
- Ability to add, edit, and delete entries

## For Regular Users

When `NEXT_PUBLIC_ENABLE_TIMELINE_EDITING` is not set or set to `false`:
- No editor buttons are shown
- Timeline is read-only
- Users can only view the timeline

## Security

- The environment variable is checked on the client side
- API routes still validate requests server-side
- Only entries added via the GitHub API will persist (requires `GITHUB_TOKEN`)
- Regular users cannot see or access the editor even if they try to manipulate the code

## Testing

1. Enable the environment variable in Vercel
2. Redeploy
3. Visit `/updates` page
4. You should see the "Add" buttons
5. Try adding an entry - it should appear immediately and persist to GitHub

