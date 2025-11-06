'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DApp, type DAppStatus } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { DAppWidget } from './DAppWidget';
import { NetworkCompatibilityModal } from './NetworkCompatibilityModal';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';
import { generateDAppSlug } from '@/lib/utils';

const statusColors: Record<DAppStatus, string> = {
  Mainnet: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
  Testnet: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  Concept: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
  Prototype: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  'U/C': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  Suspended: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
  Devnet: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
};

const statusEmojis: Record<DAppStatus, string> = {
  Concept: '⚪',
  Prototype: '🟠',
  Testnet: '🟡',
  Mainnet: '🟢',
  Devnet: '🟣',
  'U/C': '🔵',
  Suspended: '🔴',
};

interface DAppDetailProps {
  dapp: DApp;
}

export function DAppDetail({ dapp }: DAppDetailProps) {
  const router = useRouter();
  const category = getCategoryById(dapp.category);
  const slug = dapp.slug || generateDAppSlug(dapp.name);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const compatibility = useNetworkCompatibility(dapp);

  return (
    <div className="space-y-6">
      <NetworkCompatibilityModal
        dapp={dapp}
        isOpen={showCompatibilityModal}
        onClose={() => setShowCompatibilityModal(false)}
      />

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span
          className={`
            px-3 py-1 text-sm font-medium rounded border
            flex items-center gap-2
            ${statusColors[dapp.status] || statusColors.Concept}
          `}
        >
          {statusEmojis[dapp.status] && <span>{statusEmojis[dapp.status]}</span>}
          <span>{dapp.status}</span>
        </span>
      </div>

      {/* dApp Widget */}
      <div className="mt-6">
        <DAppWidget dapp={dapp} />
      </div>
    </div>
  );
}

