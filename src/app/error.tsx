'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/error]', error);
  }, [error]);

  const message = error?.message ?? 'Something went wrong';
  const isChunk =
    message.toLowerCase().includes('chunkloaderror') ||
    message.toLowerCase().includes('loading chunk');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-zinc-950">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {isChunk ? 'A new version is available' : 'Something went wrong'}
      </h1>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        {isChunk
          ? 'The app was updated while this tab was open. Reload to load the latest version.'
          : 'Try again. If the problem continues, reload the page.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-[#02abb8] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
