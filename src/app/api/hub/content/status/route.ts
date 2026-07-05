import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Lightweight health check for hub content persistence (GITHUB_TOKEN, etc.). */
export async function GET() {
  const githubToken = Boolean(process.env.GITHUB_TOKEN?.trim());
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'Kasparex';
  const repoName = process.env.GITHUB_REPO_NAME || 'kasparex-dapp-marketplace';
  const ipfsArchive = Boolean(process.env.NEXT_PUBLIC_HUB_CONTENT_REGISTRY_CID?.trim());

  return NextResponse.json({
    ok: true,
    persistence: {
      githubTokenConfigured: githubToken,
      githubRepo: `${repoOwner}/${repoName}`,
      hubContentFile: 'data/hub-content.json',
      ipfsArchiveConfigured: ipfsArchive,
      recommended: githubToken
        ? 'GITHUB_TOKEN is set. Hub content should persist across Vercel cold starts.'
        : 'Set GITHUB_TOKEN on Vercel (repo scope: contents read/write) so data/hub-content.json syncs to GitHub.',
    },
  });
}
