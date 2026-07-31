'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getGenesisDappSimulator } from '@/lib/vprogs/genesis-simulator';
import { computeGenesisMessageQuote } from '@/lib/genesis/pricing';
import { sendKaspaCapsulePayment } from '@/lib/genesis/payment';
import { awardDAppHubPoints } from '@/lib/rewards/awardDAppHubPoints';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { usePaymentAmount } from '@/lib/dapps/PaymentAmountContext';
import { useHubPayWithCatalog } from '@/hooks/useHubPayWithCatalog';
import { resolveCatalogPaymentOption } from '@/lib/payments/currencyCatalog';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import type { DApp } from '@/lib/dapps';
import type { GenesisMessage, GenesisDappState } from '@/lib/vprogs/genesis-types';

interface UseGenesisDappReturn {
  messages: GenesisMessage[];
  isLoading: boolean;
  error: string | null;
  leaveMessage: (contentHtml: string, dapp: DApp) => Promise<GenesisMessage>;
  deleteMessage: (messageId: number) => Promise<void>;
  refreshMessages: () => Promise<void>;
  state: GenesisDappState | null;
  messageCount: number;
}

export function useGenesisDapp(): UseGenesisDappReturn {
  const { state: kaspaState } = useKaspaWallet();
  const address = kaspaState.address;
  const isConnected = kaspaState.isConnected;
  const provider = kaspaState.provider;
  const { tier, balance: krexBalance } = useKREXBalance();
  const { payCurrencyId } = usePaymentAmount();
  const [messages, setMessages] = useState<GenesisMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<GenesisDappState | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [quoteKasHint, setQuoteKasHint] = useState<number | undefined>(undefined);

  const { catalogEntries, pricingSnapshot } = useHubPayWithCatalog({
    amountKas: quoteKasHint,
  });
  const paymentOption = useMemo(
    () => resolveCatalogPaymentOption(catalogEntries, payCurrencyId),
    [catalogEntries, payCurrencyId],
  );

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
      if (!isConnected || !address || !provider) {
        throw new Error('Please connect your wallet');
      }

      setIsLoading(true);
      setError(null);

      try {
        const quote = computeGenesisMessageQuote(contentHtml, address, tier);
        setQuoteKasHint(quote.totalKas);
        const payment = await sendKaspaCapsulePayment({
          provider: provider as KaspaWalletProvider,
          author: address,
          contentHtml,
          totalKas: quote.totalKas,
          currency: paymentOption,
          pricingSnapshot,
          krexBalance: krexBalance ?? 0,
        });

        const newMessage = await simulator.saveMessage({
          contentHtml,
          author: address,
          feeKas: quote.totalKas,
          payloadBytes: payment.payloadBytes,
          chunkCount: payment.chunkCount,
          txHash: payment.txHash,
          messageId: payment.messageId,
        });

        awardDAppHubPoints({
          walletRaw: address,
          dapp,
          actionId: 'leave-message',
          txHash: payment.txHash,
          krexTier: tier,
          krexBalance: krexBalance ?? 0,
          baseSpendKas: quote.subtotalKas,
        });

        await loadMessages();
        const updatedState = simulator.getState();
        setState(updatedState);
        setMessageCount(simulator.getMessageCount());
        return newMessage;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to leave message';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [
      isConnected,
      address,
      provider,
      simulator,
      loadMessages,
      tier,
      krexBalance,
      paymentOption,
      pricingSnapshot,
    ],
  );

  const deleteMessage = useCallback(
    async (messageId: number) => {
      if (!address) throw new Error('Please connect your wallet');

      setError(null);
      try {
        await simulator.deleteMessage(messageId, address);
        await loadMessages();
        setMessageCount(simulator.getMessageCount());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
        setError(errorMessage);
        throw err;
      }
    },
    [address, simulator, loadMessages],
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
    deleteMessage,
    refreshMessages,
    state,
    messageCount,
  };
}
