/**
 * Best-effort wake of the TN10 migrate attestor workflow when a burn is
 * Kasplex-accepted but still missing a MigrateTicket.
 */

let lastWakeAt = 0;
const WAKE_COOLDOWN_MS = 90_000;

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
    process.env.KCC20_MIGRATE_ATTESTOR_WORKFLOW?.trim() || 'tn10-migrate-attestor.yml';
  const ref = process.env.KCC20_MIGRATE_ATTESTOR_REF?.trim() || 'main';

  lastWakeAt = now;
  try {
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
    console.warn('[krex-wrap] attestor wake failed', res.status, text.slice(0, 200));
    return { ok: false, skipped: `http ${res.status}` };
  } catch (err) {
    console.warn('[krex-wrap] attestor wake error', err instanceof Error ? err.message : err);
    return { ok: false, skipped: 'error' };
  }
}
