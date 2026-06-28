export const KASPA_TX_HIGH_MASS_MODE_KEY = 'kaspa-tx-high-mass-mode-v1';

/** UI copy for high-mass retry toggle tooltips (no em dash). */
export const KASPA_HIGH_MASS_MODE_HELP =
  "Use when the wallet shows 'Storage mass exceeds maximum'. Retries with larger KAS amounts so the wallet selects fewer inputs. If needed, compound in KasWare: Wallet > UTXO > Compound.";

export function isStorageMassErrorMessage(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes('storage mass exceeds maximum') || (m.includes('mass') && m.includes('maximum'));
}

export function retryKasCandidates(baseKas: number, highMassMode: boolean): number[] {
  const ladder = highMassMode ? [2, 5, 10, 20, 30] : [baseKas, 0.2, 0.5, 1, 2, 5, 10];
  const unique: number[] = [];
  for (const x of ladder) {
    const v = Number.isFinite(x) ? Number(x.toFixed(8)) : 0;
    if (v <= 0) continue;
    if (!unique.some((u) => Math.abs(u - v) < 1e-9)) unique.push(v);
  }
  return unique;
}

export function readHighMassMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      localStorage.getItem(KASPA_TX_HIGH_MASS_MODE_KEY) === '1' ||
      localStorage.getItem('chronicles-lb-high-mass-mode-v1') === '1'
    );
  } catch {
    return false;
  }
}

export function writeHighMassMode(enabled: boolean) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KASPA_TX_HIGH_MASS_MODE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}
