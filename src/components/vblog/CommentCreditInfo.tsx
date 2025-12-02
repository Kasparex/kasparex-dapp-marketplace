'use client';

import { useCommentCredits } from '@/hooks/useCommentCredits';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { Alert } from '@/components/Alert';

interface CommentCreditInfoProps {
  onPurchaseClick?: () => void;
}

export function CommentCreditInfo({ onPurchaseClick }: CommentCreditInfoProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  
  // Support both Kaspa and EVM wallets
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;
  
  const { credits, isLoading } = useCommentCredits(walletAddress);

  if (!isWalletConnected || !walletAddress) {
    return (
      <Alert type="info" title="Wallet Required">
        Connect your wallet (Kaspa or EVM) to view and use comment credits.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Alert type="info" compact>
        Loading credits...
      </Alert>
    );
  }

  const creditsRemaining = credits?.creditsRemaining || 0;
  const totalPurchased = credits?.totalPurchased || 0;
  const hasCredits = creditsRemaining > 0;

  return (
    <Alert 
      type={hasCredits ? 'success' : 'warning-violet'} 
      title="Comment Credits"
      action={onPurchaseClick ? { label: 'Purchase Credits', onClick: onPurchaseClick } : undefined}
    >
      <div className="space-y-2">
        <p className="text-sm">
          Comments use a paid credit model and are stored on the Kaspa BlockDAG (on-chain). This system prevents spam and encourages higher quality messages.
        </p>
        <p className="text-sm font-medium">
          {creditsRemaining} / {totalPurchased} credits remaining
        </p>
      </div>
    </Alert>
  );
}

