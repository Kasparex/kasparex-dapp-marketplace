'use client';

import { useState, useEffect, useCallback } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getGenesisDappSimulator } from '@/lib/vprogs/genesis-simulator';
import { computeGenesisMessageQuote } from '@/lib/genesis/pricing';
import { awardDAppHubPoints } from '@/lib/rewards/awardDAppHubPoints';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import type { DApp } from '@/lib/dapps';
import type { GenesisMessage, GenesisDappState } from '@/lib/vprogs/genesis-types';

interface UseGenesisDappReturn {
  messages: GenesisMessage[];
  isLoading: boolean;
  error: string | null;
  leaveMessage: (contentHtml: string, dapp: DApp) => Promise<GenesisMessage>;
  refreshMessages: () => Promise<void>;
  state: GenesisDappState | null;
  messageCount: number;
}

export function useGenesisDapp(): UseGenesisDappReturn {
  const { state: kaspaState } = useKaspaWallet();
  const address = kaspaState.address;
  const isConnected = kaspaState.isConnected;
  const { tier, balance: krexBalance } = useKREXBalance();
  const [messages, setMessages] = useState<GenesisMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<GenesisDappState | null>(null);
  const [messageCount, setMessageCount] = useState(0);

  const simulator = getGenesisDappSimulator();

  useEffect(() => {
    const currentState = simulator.getState();
    setState(currentState);
    setMessageCount(simulator.getMessageCount());
  }, [simulator]);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedMessages = await simulator.getMessages(0, 200);
      setMessages(loadedMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [simulator]);

  const leaveMessage = useCallback(
    async (contentHtml: string, dapp: DApp) => {
      if (!isConnected || !address) {
        throw new Error('Please connect your wallet');
      }

      setIsLoading(true);
      setError(null);

      try {
        const quote = computeGenesisMessageQuote(contentHtml, address, tier);
        const newMessage = await simulator.leaveMessage({
          contentHtml,
          author: address,
          feeKas: quote.totalKas,
          payloadBytes: quote.payloadBytes,
          chunkCount: quote.chunkCount,
        });

        if (newMessage.txRef) {
          awardDAppHubPoints({
            walletRaw: address,
            dapp,
            actionId: 'leave-message',
            txHash: newMessage.txRef,
            krexTier: tier,
            krexBalance: krexBalance ?? 0,
            baseSpendKas: quote.subtotalKas,
          });
        }

        await loadMessages();
        const updatedState = simulator.getState();
        setState(updatedState);
        setMessageCount(updatedState.messageCount);
        return newMessage;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to leave message';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address, simulator, loadMessages, tier, krexBalance],
  );

  const refreshMessages = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  return {
    messages,
    isLoading,
    error,
    leaveMessage,
    refreshMessages,
    state,
    messageCount,
  };
}
