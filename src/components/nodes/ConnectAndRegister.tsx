'use client';

import Link from 'next/link';
import type { NodeInfo } from '@/lib/nodes/types';

const CARD_CLASS =
  'bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6';

function statusLabel(status: NodeInfo['status']): string {
  switch (status) {
    case 'connected':
      return 'Registered';
    case 'disconnected':
    case 'syncing':
      return 'Registered (offline)';
    case 'not_registered':
    default:
      return 'Not registered';
  }
}

interface ConnectAndRegisterProps {
  nodeInfo: NodeInfo;
}

export function ConnectAndRegister({ nodeInfo }: ConnectAndRegisterProps) {
  const isRegistered = nodeInfo.status !== 'not_registered';

  return (
    <section id="connect-register" className="mb-8">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Connect & Register
      </h2>
      <div className={CARD_CLASS}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-zinc-600 dark:text-zinc-400 mb-2">
              Run a KREX Node on your machine to support the Kasparex ecosystem
              and earn rewards. Follow the guide to install, start, and register
              your node.
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Registration status:{' '}
              <span
                className={
                  isRegistered
                    ? 'font-medium text-[#02abb8]'
                    : 'font-medium text-zinc-700 dark:text-zinc-300'
                }
              >
                {statusLabel(nodeInfo.status)}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <Link
              href="/api/krex-node"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium bg-[#02abb8] hover:bg-[#028a94] text-white transition-colors"
            >
              Run a KREX Node
            </Link>
            <a
              href="https://github.com/Kasparex/kasparex-krex-node"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
