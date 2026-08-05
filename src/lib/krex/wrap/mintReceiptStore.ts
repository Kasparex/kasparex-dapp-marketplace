import { promises as fs } from 'fs';
import path from 'path';
import {
  MINT_RECEIPTS_TN10_PATH,
  emptyMintReceiptStore,
  normalizeMintReceiptStore,
  type KrexWrapMintReceiptStore,
} from './mintReceipts';

const githubPath = MINT_RECEIPTS_TN10_PATH;

function localPath(): string {
  return path.join(process.cwd(), MINT_RECEIPTS_TN10_PATH);
}

async function readLocalFile(): Promise<KrexWrapMintReceiptStore | null> {
  try {
    const raw = await fs.readFile(localPath(), 'utf8');
    return normalizeMintReceiptStore(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function fetchGithubFile(): Promise<{ store: KrexWrapMintReceiptStore; sha?: string } | null> {
  const githubToken = process.env.GITHUB_TOKEN?.trim();
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'Kasparex';
  const repoName = process.env.GITHUB_REPO_NAME || 'kasparex-dapp-marketplace';
  if (!githubToken) return null;

  const res = await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${githubPath}`,
    {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    },
  );
  if (res.status === 404) return { store: emptyMintReceiptStore(), sha: undefined };
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; encoding?: string; sha?: string };
  if (!data.content) return { store: emptyMintReceiptStore(), sha: data.sha };
  const decoded = Buffer.from(data.content, (data.encoding as BufferEncoding) || 'base64').toString(
    'utf8',
  );
  return { store: normalizeMintReceiptStore(JSON.parse(decoded)), sha: data.sha };
}

/** Prefer GitHub (live after watcher POST), else deployment file. */
export async function loadMintReceiptStore(): Promise<KrexWrapMintReceiptStore> {
  const fromGh = await fetchGithubFile();
  if (fromGh?.store) return fromGh.store;
  const local = await readLocalFile();
  return local || emptyMintReceiptStore();
}

export async function persistMintReceiptStore(store: KrexWrapMintReceiptStore): Promise<{
  ok: boolean;
  via: 'github' | 'local' | 'none';
  error?: string;
}> {
  const body = `${JSON.stringify(store, null, 2)}\n`;
  const githubToken = process.env.GITHUB_TOKEN?.trim();
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'Kasparex';
  const repoName = process.env.GITHUB_REPO_NAME || 'kasparex-dapp-marketplace';

  if (githubToken) {
    try {
      const current = await fetchGithubFile();
      const content = Buffer.from(body, 'utf8').toString('base64');
      const updateResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${githubPath}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `chore(bridge): upsert TN10 TKREX mint receipt (${store.updatedAt})`,
            content,
            sha: current?.sha,
          }),
        },
      );
      if (updateResponse.ok) return { ok: true, via: 'github' };
      const err = await updateResponse.text();
      return { ok: false, via: 'github', error: err.slice(0, 500) };
    } catch (e) {
      return {
        ok: false,
        via: 'github',
        error: e instanceof Error ? e.message : 'GitHub write failed',
      };
    }
  }

  if (process.env.VERCEL) {
    return {
      ok: false,
      via: 'none',
      error: 'GITHUB_TOKEN required on Vercel to persist mint receipts',
    };
  }

  try {
    await fs.mkdir(path.dirname(localPath()), { recursive: true });
    await fs.writeFile(localPath(), body, 'utf8');
    return { ok: true, via: 'local' };
  } catch (e) {
    return {
      ok: false,
      via: 'none',
      error: e instanceof Error ? e.message : 'Local write failed',
    };
  }
}
