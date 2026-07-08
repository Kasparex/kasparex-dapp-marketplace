'use client';

import { useMemo, useState } from 'react';
import type { GenesisMessage } from '@/lib/vprogs/genesis-types';
import { GenesisMessageCard } from './GenesisMessageCard';
import { KX_FORM_ADD_BTN_CLASS } from '@/components/ui/KxLinkRowsEditor';

export type GenesisMessageFilter = 'all' | 'mine' | 'recent';

type GenesisMessageListProps = {
  messages: GenesisMessage[];
  isLoading?: boolean;
  walletAddress?: string | null;
  limit?: number;
  showFilters?: boolean;
  emptyLabel?: string;
  onSeeMore?: () => void;
};

export function GenesisMessageList({
  messages,
  isLoading = false,
  walletAddress,
  limit,
  showFilters = false,
  emptyLabel = 'No messages yet. Be the first to leave your mark.',
  onSeeMore,
}: GenesisMessageListProps) {
  const [filter, setFilter] = useState<GenesisMessageFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = [...messages];
    if (filter === 'mine' && walletAddress) {
      const mine = walletAddress.trim().toLowerCase();
      list = list.filter((m) => m.author.trim().toLowerCase() === mine);
    }
    if (filter === 'recent') {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((m) => m.timestamp >= weekAgo);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.message.toLowerCase().includes(q) ||
          m.author.toLowerCase().includes(q) ||
          String(m.id).includes(q),
      );
    }
    return list;
  }, [messages, filter, walletAddress, search]);

  const visible = limit != null ? filtered.slice(0, limit) : filtered;

  return (
    <div className="space-y-4">
      {showFilters ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'recent', 'mine'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                disabled={id === 'mine' && !walletAddress}
                className={`k-control-btn text-xs !h-9 px-3 ${
                  filter === id
                    ? '!border-[#02abb8] !text-[#02abb8]'
                    : '!border-zinc-300 dark:!border-zinc-700'
                }`}
              >
                {id === 'all' ? 'All' : id === 'recent' ? 'Last 7 days' : 'Mine'}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="k-input text-sm max-w-xs"
          />
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-center py-8 text-zinc-500">Loading messages...</p>
      ) : visible.length === 0 ? (
        <p className="text-center py-8 text-zinc-500">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          {visible.map((msg) => (
            <GenesisMessageCard key={msg.id} message={msg} />
          ))}
        </div>
      )}

      {onSeeMore && limit != null && filtered.length > limit ? (
        <div className="flex justify-center pt-2">
          <button type="button" onClick={onSeeMore} className={KX_FORM_ADD_BTN_CLASS}>
            See more ({filtered.length - limit} more)
          </button>
        </div>
      ) : null}
    </div>
  );
}
