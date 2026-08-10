/**
 * Best-effort wake of the TN10 migrate ticket workflow when a burn is
 * Kasplex-accepted but still missing a MigrateTicket.
 *
 * Prefers the fast workflow (no Rust/silverc; uses Hub tip.ticketTemplate).
 */

let lastWakeAt = 0;
const WAKE_COOLDOWN_MS = 15_000;

async function dispatchWorkflow(opts: {
  token: string;
  repo: string;
  workflow: string;
  ref: string;
  reason: string;
}): Promise<{ ok: boolean; skipped?: string }> {
  const { token, repo, workflow, ref, reason } = opts;
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref,
        inputs: {},
      }),
      signal: AbortSignal.timeout(12_000),
    },
  );
  if (res.status === 204 || res.ok) {
    console.info('[krex-wrap] woke migrate attestor', { reason, repo, workflow });
    return { ok: true };
  }
  const text = await res.text().catch(() => '');
  console.warn('[krex-wrap] attestor wake failed', workflow, res.status, text.slice(0, 200));
  return { ok: false, skipped: `http ${res.status}` };
}

async function repositoryDispatch(opts: {
  token: string;
  repo: string;
  reason: string;
}): Promise<{ ok: boolean; skipped?: string }> {
  const { token, repo, reason } = opts;
  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: 'kcc20-ticket-needed',
      client_payload: { reason },
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (res.status === 204 || res.ok) {
    console.info('[krex-wrap] repository_dispatch kcc20-ticket-needed', { reason, repo });
    return { ok: true };
  }
  const text = await res.text().catch(() => '');
  console.warn('[krex-wrap] repository_dispatch failed', res.status, text.slice(0, 200));
  return { ok: false, skipped: `http ${res.status}` };
}

export async function wakeMigrateAttestor(reason: string): Promise<{ ok: boolean; skipped?: string }> {
  const now = Date.now();
  if (now - lastWakeAt < WAKE_COOLDOWN_MS) {
    return { ok: false, skipped: 'cooldown' };
  }
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return { ok: false, skipped: 'no GITHUB_TOKEN' };

  const repo =
    process.env.KCC20_MIGRATE_ATTESTOR_REPO?.trim() ||
    process.env.GITHUB_REPOSITORY?.trim() ||
    'Kasparex/kasparex-dapp-marketplace';
  const workflow =
    process.env.KCC20_MIGRATE_ATTESTOR_WORKFLOW?.trim() || 'tn10-migrate-ticket-fast.yml';
  const ref = process.env.KCC20_MIGRATE_ATTESTOR_REF?.trim() || 'main';

  lastWakeAt = now;
  try {
    const primary = await dispatchWorkflow({ token, repo, workflow, ref, reason });
    if (primary.ok) return primary;

    // Fallback: repository_dispatch (same fast workflow listens for kcc20-ticket-needed).
    const viaEvent = await repositoryDispatch({ token, repo, reason });
    if (viaEvent.ok) return viaEvent;

    // Last resort: full attestor (Rust path) if fast workflow file is missing on the branch.
    if (workflow !== 'tn10-migrate-attestor.yml') {
      return dispatchWorkflow({
        token,
        repo,
        workflow: 'tn10-migrate-attestor.yml',
        ref,
        reason: `${reason}:fallback-full`,
      });
    }
    return viaEvent.ok ? viaEvent : primary;
  } catch (err) {
    console.warn('[krex-wrap] attestor wake error', err instanceof Error ? err.message : err);
    return { ok: false, skipped: 'error' };
  }
}
