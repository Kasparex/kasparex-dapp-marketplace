'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useGenesisDapp } from '@/hooks/useGenesisDapp';

export function GenesisDappWidget() {
  const { address, isConnected } = useAccount();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    messages,
    isLoading,
    error,
    leaveMessage,
    refreshMessages,
    state,
    messageCount,
  } = useGenesisDapp();

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    if (message.length > 280) {
      alert('Message must be 280 characters or less');
      return;
    }

    setIsSubmitting(true);
    try {
      await leaveMessage(message);
      setMessage('');
      alert('Message saved! You are now part of Kaspa history! 🎉');
    } catch (err) {
      console.error('Error leaving message:', err);
      alert(err instanceof Error ? err.message : 'Failed to leave message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="px-6 py-4 text-center">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Please connect your wallet to leave a message in the Genesis Dapp
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white dark:text-zinc-100 mb-2">
          🌱 Genesis Dapp
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Leave your mark in Kaspa history. Your message will be permanently stored on-chain.
        </p>
        {state && (
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
            Fee: {formatEther(BigInt(state.messageFee))} KAS • {messageCount} messages total
          </p>
        )}
      </div>

      {/* Leave Message Form */}
      <div className="bg-zinc-800 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-700 dark:border-zinc-700">
        <label className="block text-sm font-medium text-zinc-300 dark:text-zinc-300 mb-2">
          Your Message (max 280 characters)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Leave a message for future generations..."
          maxLength={280}
          rows={4}
          className="w-full px-3 py-2 bg-zinc-900 dark:bg-zinc-900 border border-zinc-700 dark:border-zinc-700 rounded-lg text-white dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-zinc-500">
            {message.length}/280 characters
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim() || message.length > 280}
            className="px-4 py-2 bg-[#02abb8] text-white rounded-lg hover:bg-[#028a94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Leave Message'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Messages List */}
      <div>
        <h3 className="text-xl font-semibold text-white dark:text-zinc-100 mb-4">
          Historical Messages ({messageCount})
        </h3>
        
        {isLoading ? (
          <div className="text-center py-8 text-zinc-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            No messages yet. Be the first to leave your mark!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-zinc-800 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-700 dark:border-zinc-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#02abb8]">
                      #{msg.id}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatAddress(msg.author)}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {formatDate(msg.timestamp)}
                  </span>
                </div>
                <p className="text-zinc-200 dark:text-zinc-200 whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
