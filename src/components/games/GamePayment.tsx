'use client';

import { useState } from 'react';
import { Game } from '@/lib/games/games';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';

interface GamePaymentProps {
  game: Game;
  onPaymentSuccess?: () => void;
}

// Treasury address for game entry fees (this should be configurable)
const GAME_TREASURY_ADDRESS = process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS || '';

export function GamePayment({ game, onPaymentSuccess }: GamePaymentProps) {
  const { state, connect } = useKaspaWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handlePlay = async () => {
    if (!state.isConnected || !state.provider) {
      setError('Please connect your Kaspa wallet first');
      // Try to connect automatically
      try {
        const { detectKaspaWallets } = await import('@/lib/kaspa/wallet');
        const wallets = detectKaspaWallets();
        if (wallets.length > 0) {
          await connect(wallets[0].id);
        }
      } catch (err) {
        console.error('Auto-connect failed:', err);
      }
      return;
    }

    if (!state.address) {
      setError('Wallet address not available');
      return;
    }

    if (!GAME_TREASURY_ADDRESS || !isValidKaspaAddress(GAME_TREASURY_ADDRESS)) {
      setError('Game treasury address not configured');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    setTxHash(null);

    try {
      // Convert KAS to sompis
      const sompiAmount = kasToSompis(game.entryCostKAS);

      // Send payment transaction
      const transaction = {
        to: GAME_TREASURY_ADDRESS,
        amount: sompiAmount.toString(),
      };

      const result = await sendKaspaTransaction(state.provider, transaction);

      if (result.status === 'failed') {
        throw new Error(result.error || 'Transaction failed');
      }

      setTxHash(result.txHash);
      setSuccess(true);
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }

      // Record reward transaction
      try {
        const response = await fetch('/api/rewards/l1/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAddress: state.address,
            dappId: game.id,
            actionType: 'game_entry',
            actionValue: game.entryCostKAS,
            txHash: result.txHash,
            network: 'L1',
          }),
        });

        if (!response.ok) {
          console.warn('Failed to record reward transaction:', await response.text());
        }
      } catch (rewardError) {
        console.error('Error recording reward:', rewardError);
        // Don't fail the payment if reward recording fails
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
        setTxHash(null);
      }, 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
      setError(errorMessage);
      console.error('Game payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!state.isConnected) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🔌</div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Connect Wallet to Play
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Connect your Kaspa wallet to play {game.name} and earn rewards!
          </p>
          <button
            onClick={async () => {
              try {
                const { detectKaspaWallets } = await import('@/lib/kaspa/wallet');
                const wallets = detectKaspaWallets();
                if (wallets.length > 0) {
                  await connect(wallets[0].id);
                } else {
                  setError('No Kaspa wallet detected. Please install KasWare or Kastle.');
                }
              } catch (err) {
                setError('Failed to connect wallet');
                console.error(err);
              }
            }}
            className="px-6 py-3 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Ready to Play?
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Pay the entry fee to start playing and earn rewards!
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Entry Cost:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {game.entryCostKAS}
              </span>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">KAS</span>
            </div>
          </div>
          {game.rewardConfig && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
              {game.rewardConfig.gridReward && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">You&apos;ll earn:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {game.rewardConfig.gridReward} GRID
                  </span>
                </div>
              )}
              {game.rewardConfig.xpReward && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Plus:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {game.rewardConfig.xpReward} XP
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && txHash && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-300 mb-1">
              Payment successful! Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </p>
            <p className="text-xs text-green-700 dark:text-green-400">
              You can now play the game. Rewards will be processed automatically.
            </p>
          </div>
        )}

        <button
          onClick={handlePlay}
          disabled={isProcessing || success}
          className="w-full px-6 py-3 bg-[#02abb8] hover:bg-[#028a94] disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : success ? (
            'Payment Complete!'
          ) : (
            `Pay ${game.entryCostKAS} KAS to Play`
          )}
        </button>
      </div>
    </div>
  );
}
