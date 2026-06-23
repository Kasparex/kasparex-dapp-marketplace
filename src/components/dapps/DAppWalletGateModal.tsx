'use client';

import { useEffect } from 'react';
import type { DApp } from '@/lib/dapps';
import { useDAppAccess } from '@/hooks/useDAppAccess';
import type { DAppGateReason } from '@/lib/dapps/access';
import { DAppIcon } from './DAppIcon';
import { useDAppNetworkBadge } from '@/hooks/useDAppNetworkBadge';
import { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';

interface DAppWalletGateModalProps {
  dapp: DApp;
  isOpen: boolean;
  onClose: () => void;
  selectedNetwork?: 'all' | 'L1' | 'L2';
}

function gateTitle(reason: DAppGateReason): string {
  switch (reason) {
    case 'l1_wallet_required':
      return 'Wallet required';
    case 'filter_mismatch':
      return 'Network filter';
    default:
      return 'Connect to continue';
  }
}

/** L1-only wallet gate modal for dApps. L2 uses RainbowKit connect/chain modals via useDAppWalletGate. */
export function DAppWalletGateModal({
  dapp,
  isOpen,
  onClose,
  selectedNetwork = 'all',
}: DAppWalletGateModalProps) {
  const access = useDAppAccess({ dapp, selectedNetwork });
  const { networkType, badgeNetworkLabel } = useDAppNetworkBadge(dapp, { preferRequired: true });

  useEffect(() => {
    if (isOpen && access.isOpenable) {
      onClose();
    }
  }, [isOpen, access.isOpenable, onClose]);

  if (!isOpen) return null;

  const { gateReason, message } = access;
  const showL1Connect = gateReason === 'l1_wallet_required';

  return (
    <HubWalletGateModal
      isOpen={isOpen}
      onClose={onClose}
      title={gateTitle(gateReason)}
      name={dapp.name}
      message={message}
      networkBadge={{
        layer: networkType,
        label: badgeNetworkLabel,
      }}
      showL1Connect={showL1Connect}
      showEvmConnect={false}
      icon={<DAppIcon dAppName={dapp.name} category={dapp.category} size={40} className="rounded-lg" />}
    />
  );
}
