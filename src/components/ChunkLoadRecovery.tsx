'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'kasparex_chunk_reload';

function isChunkLoadFailure(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('chunkloaderror') ||
    lower.includes('loading chunk') ||
    lower.includes('failed to fetch dynamically imported module')
  );
}

/**
 * After deploys, stale tabs may reference removed JS chunks. Reload once per session.
 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    const maybeReload = (message: string) => {
      if (!isChunkLoadFailure(message)) return;
      if (typeof sessionStorage === 'undefined') {
        window.location.reload();
        return;
      }
      if (sessionStorage.getItem(RELOAD_KEY)) return;
      sessionStorage.setItem(RELOAD_KEY, '1');
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      maybeReload(event.message || String(event.error ?? ''));
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : String(reason ?? '');
      maybeReload(message);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
