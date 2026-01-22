'use client';

import { useState, useEffect, useCallback } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getGenesisDappSimulator } from '@/lib/vprogs/genesis-simulator';
import type { GenesisMessage, GenesisDappState } from '@/lib/vprogs/genesis-types';

interface UseGenesisDappReturn {
  messages: GenesisMessage[];
  isLoading: boolean;
  error: string | null;
  leaveMessage: (message: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
  state: GenesisDappState | null;
  messageCount: number;
}

export function useGenesisDapp(): UseGenesisDappReturn {
  const { state: kaspaState } = useKaspaWallet();
  const address = kaspaState.address;
  const isConnected = kaspaState.isConnected;
  const [messages, setMessages] = useState<GenesisMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<GenesisDappState | null>(null);
  const [messageCount, setMessageCount] = useState(0);

  const simulator = getGenesisDappSimulator();

  // Load initial state
  useEffect(() => {
    const loadState = () => {
      const currentState = simulator.getState();
      const count = simulator.getMessageCount();
      setState(currentState);
      setMessageCount(count);
    };

    loadState();
  }, [simulator]);

  // Load messages
  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedMessages = await simulator.getMessages(0, 100);
      setMessages(loadedMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [simulator]);

  // Leave a message
  const leaveMessage = useCallback(async (message: string) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet');
    }

    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentState = simulator.getState();
      const newMessage = await simulator.leaveMessage({
        message,
        author: address,
        fee: currentState.messageFee,
      });

      // Refresh messages
      await loadMessages();
      
      // Update state
      const updatedState = simulator.getState();
      setState(updatedState);
      setMessageCount(updatedState.messageCount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave message';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, simulator, loadMessages]);

  // Refresh messages
  const refreshMessages = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  // Initial load
  useEffect(() => {
    loadMessages();
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
