# Vercel Webhook Setup for Automatic Deployment Tracking

## Overview

The timeline page now automatically tracks deployments via Vercel webhooks. Each time you deploy to Vercel, a new entry is automatically added to the timeline.

## Setup Instructions

### Step 1: Get Your Webhook URL

Your webhook endpoint is:
```
https://your-domain.vercel.app/api/webhooks/vercel
```

Replace `your-domain.vercel.app` with your actual Vercel deployment URL.

### Step 2: Configure Webhook in Vercel

1. Go to your Vercel Dashboard: https://vercel.com
2. Select your project: `kasparex-dapp-marketplace`
3. Go to **Settings** → **Webhooks**
4. Click **Add Webhook**
5. Configure the webhook:
   - **Name**: `Deployment Tracker` (or any name you prefer)
   - **URL**: `https://your-domain.vercel.app/api/webhooks/vercel`
   - **Events**: Select **Deployment Succeeded**
   - **Secret** (optional but recommended): Generate a random secret string
6. Click **Create Webhook**

### Step 3: Add Webhook Secret to Environment Variables (Optional but Recommended)

If you set a secret in Step 2, add it to your Vercel environment variables:

1. Go to **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name**: `VERCEL_WEBHOOK_SECRET`
   - **Value**: The secret you generated in Step 2
   - **Environments**: Production, Preview, Development
3. Click **Save**

### Step 4: Test the Webhook

1. Make a small change to your code
2. Push to GitHub (this will trigger a Vercel deployment)
3. Once deployment succeeds, check your `/updates` page
4. You should see a new entry automatically added!

## How It Works

- When Vercel successfully deploys your site, it sends a POST request to the webhook endpoint
- The webhook handler extracts deployment information (URL, branch, commit message, etc.)
- A new timeline entry is automatically created in the "Updates" category
- The entry includes:
  - Deployment URL
  - Branch name
  - Commit message (if available)
  - Timestamp

## Security

The webhook endpoint verifies the request signature if `VERCEL_WEBHOOK_SECRET` is set. This ensures only legitimate Vercel requests are processed.

## Manual Entries

You can still manually add entries for:
- Tasks to Do
- Potential Ideas
- Bug Fixes
- Other updates that aren't deployments

Use the "Add" buttons on the timeline page to create manual entries.

## Troubleshooting

### Webhook Not Working

1. **Check Vercel Dashboard**: Go to your project → Settings → Webhooks and verify the webhook is active
2. **Check Webhook Logs**: In Vercel, click on your webhook to see delivery logs
3. **Verify URL**: Make sure the webhook URL is correct and accessible
4. **Check Environment Variables**: If using a secret, ensure `VERCEL_WEBHOOK_SECRET` is set correctly

### No Entries Appearing

1. **Check API Route**: Visit `https://your-domain.vercel.app/api/webhooks/vercel` (GET request) to verify the endpoint is active
2. **Check Console**: Look for errors in Vercel function logs
3. **Verify File Permissions**: Ensure the `data/updates.json` file is writable

### Testing Locally

For local development, you can test the webhook by:

1. Using a tool like ngrok to expose your local server
2. Or manually calling the API endpoint with a test payload

Example test payload:
```json
{
  "type": "deployment.succeeded",
  "payload": {
    "deployment": {
      "id": "test-123",
      "url": "https://test.vercel.app",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "meta": {
        "githubCommitRef": "main",
        "githubCommitMessage": "Test deployment"
      }
    }
  }
}
```

## Next Steps

After setting up the webhook:
1. Make a test deployment
2. Verify the entry appears on `/updates`
3. All future deployments will be automatically tracked!

