import { isStorageMassErrorMessage } from '@/lib/kaspa/tx-mass-mode';

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === 'unknown error') return null;
  return trimmed;
}

function rpcDisconnectHelp(text: string): string | null {
  const lower = text.toLowerCase();
  // Keep real reject reasons (orphan, double-spend, etc.) visible.
  if (lower.includes('rejected') || lower.includes('orphan') || lower.includes('already spent')) {
    return null;
  }
  if (
    lower.includes('websocket disconnected') ||
    (lower.includes('websocket') && lower.includes('disconnect')) ||
    (lower.includes('rpc server') && lower.includes('remote error') && !lower.includes('->'))
  ) {
    return (
      'Your wallet lost its Kaspa RPC connection (WebSocket disconnected). ' +
      'Open KasWare or Kastle, unlock the wallet, reconnect if prompted, or switch the RPC node in wallet settings, then retry.'
    );
  }
  return null;
}

function orphanTxHelp(text: string): string | null {
  if (!/orphan/i.test(text)) return null;
  return (
    'Claim rejected as orphan: an input is not ready on your wallet RPC yet ' +
    '(ticket or recent fee change). Wait about 15 seconds, then tap Claim again.'
  );
}

/**
 * Normalize wallet / RPC errors into user-readable messages.
 */
export function formatKaspaWalletError(err: unknown): string {
  if (err instanceof SyntaxError) {
    return 'Received an invalid or empty response from the server or wallet. Check KasWare for pending transactions, then retry.';
  }

  if (err instanceof Error) {
    const direct = pickString(err.message);
    if (direct) {
      if (isStorageMassErrorMessage(direct)) return storageMassHelp();
      const orphanHelp = orphanTxHelp(direct);
      if (orphanHelp) return orphanHelp;
      const rpcHelp = rpcDisconnectHelp(direct);
      if (rpcHelp) return rpcHelp;
      if (direct.toLowerCase().includes('json')) {
        return 'Received an invalid or empty response from the server or wallet. Check KasWare for pending transactions, then retry.';
      }
      return direct;
    }
  }

  if (typeof err === 'string') {
    const direct = pickString(err);
    if (direct) {
      if (isStorageMassErrorMessage(direct)) return storageMassHelp();
      const orphanHelp = orphanTxHelp(direct);
      if (orphanHelp) return orphanHelp;
      const rpcHelp = rpcDisconnectHelp(direct);
      if (rpcHelp) return rpcHelp;
      return direct;
    }
  }

  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>;
    for (const key of ['message', 'error', 'reason', 'details', 'data']) {
      const nested = o[key];
      const text = pickString(nested);
      if (text) {
        if (isStorageMassErrorMessage(text)) return storageMassHelp();
        const orphanHelp = orphanTxHelp(text);
        if (orphanHelp) return orphanHelp;
        const rpcHelp = rpcDisconnectHelp(text);
        if (rpcHelp) return rpcHelp;
        return text;
      }
      if (nested && typeof nested === 'object') {
        const inner = formatKaspaWalletError(nested);
        if (inner !== 'Wallet transaction failed. Reconnect your wallet or try again.') return inner;
      }
    }
  }

  return 'Wallet transaction failed. Reconnect your wallet or try again.';
}

function storageMassHelp(): string {
  return (
    'Storage mass exceeds maximum. This often happens when your wallet has many small UTXOs (common after a KREX transfer), or when a payment output is very small. ' +
    'Compound UTXOs in KasWare (Wallet > UTXO > Compound), then retry. ' +
    'If High-mass mode is available in KPX Tools, enable it before retrying.'
  );
}
