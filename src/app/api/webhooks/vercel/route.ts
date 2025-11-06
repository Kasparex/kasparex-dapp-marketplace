import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { UpdatesData, TimelineEntry } from '@/lib/updates';
import { generateId } from '@/lib/updates';
import crypto from 'crypto';

const updatesFilePath = path.join(process.cwd(), 'data', 'updates.json');

async function readUpdatesFile(): Promise<UpdatesData> {
  try {
    const fileContents = await fs.readFile(updatesFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    return {
      updates: [],
      tasks: [],
      ideas: [],
      bugFixes: [],
    };
  }
}

async function writeUpdatesFile(data: UpdatesData): Promise<void> {
  const dir = path.dirname(updatesFilePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(updatesFilePath, JSON.stringify(data, null, 2), 'utf8');
}

// Verify webhook signature (optional but recommended)
function verifySignature(body: string, signature: string | null, secret: string | undefined): boolean {
  if (!secret || !signature) {
    // If no secret is configured, allow the request (for development)
    // In production, you should set VERCEL_WEBHOOK_SECRET
    return true;
  }

  const hmac = crypto.createHmac('sha1', secret);
  const digest = 'sha1=' + hmac.update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-vercel-signature');
    const webhookSecret = process.env.VERCEL_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret && !verifySignature(body, signature, webhookSecret)) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);
    const { type, payload: deploymentData } = payload;

    // Only process successful deployments
    if (type === 'deployment.succeeded' && deploymentData) {
      const deployment = deploymentData.deployment || deploymentData;
      
      // Extract deployment information
      const deploymentUrl = deployment.url || deploymentData.url || 'N/A';
      const deploymentId = deployment.id || deploymentData.id || 'unknown';
      const createdAt = deployment.createdAt || deploymentData.createdAt || new Date().toISOString();
      const branch = deployment.meta?.githubCommitRef || deployment.meta?.gitlabBranch || deployment.meta?.bitbucketBranch || 'main';
      const commitMessage = deployment.meta?.githubCommitMessage || deployment.meta?.gitlabCommitMessage || deployment.meta?.bitbucketCommitMessage || 'Deployment';
      
      // Create timeline entry
      const entry: TimelineEntry = {
        id: generateId(),
        title: `Deployment to ${branch}`,
        description: `Website deployed successfully to ${deploymentUrl}. ${commitMessage ? `Commit: ${commitMessage}` : ''}`,
        date: createdAt,
        type: 'deployment',
      };

      // Add to updates
      const data = await readUpdatesFile();
      data.updates.push(entry);
      await writeUpdatesFile(data);

      return NextResponse.json({
        success: true,
        message: 'Deployment recorded in timeline',
        entry,
      });
    }

    // Handle other event types if needed
    if (type === 'deployment.created') {
      // Optional: Track when deployment starts
      return NextResponse.json({
        success: true,
        message: 'Deployment started (not tracked)',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook received but event type not processed',
      type,
    });
  } catch (error: any) {
    console.error('Error processing Vercel webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process webhook',
      },
      { status: 500 }
    );
  }
}

// Allow GET for testing/verification
export async function GET() {
  return NextResponse.json({
    message: 'Vercel webhook endpoint is active',
    instructions: 'Configure this URL in Vercel project settings → Webhooks',
    url: '/api/webhooks/vercel',
  });
}

