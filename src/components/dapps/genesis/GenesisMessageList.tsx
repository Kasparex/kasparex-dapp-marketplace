'use client';

import { useMemo, useState } from 'react';
import type { GenesisMessage } from '@/lib/vprogs/genesis-types';
import { GenesisMessageCard } from './GenesisMessageCard';
import { GenesisDeleteMessageModal } from './GenesisDeleteMessageModal';
import { KX_FORM_ADD_BTN_CLASS } from '@/components/ui/KxLinkRowsEditor';

export type GenesisMessageFilter = 'all' | 'mine' | 'recent';

const FILTER_OPTIONS: { id: GenesisMessageFilter; label: string }[] = [
  { id: 'all', label: 'All messages' },
  { id: 'recent', label: 'Last 7 days' },
  { id: 'mine', label: 'My messages' },
];

type GenesisMessageListProps = {
  messages: GenesisMessage[];
  isLoading?: boolean;
  walletAddress?: string | null;
  limit?: number;
  showFilters?: boolean;
  emptyLabel?: string;
  onSeeMore?: () => void;
  onDeleteMessage?: (messageId: number) => Promise<void>;
};

export function GenesisMessageList({
  messages,
  isLoading = false,
  walletAddress,
  limit,
  showFilters = false,
  emptyLabel = 'No messages yet. Be the first to leave your mark.',
  onSeeMore,
  onDeleteMessage,
}: GenesisMessageListProps) {
  const [filter, setFilter] = useState<GenesisMessageFilter>('all');
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<GenesisMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
          String(m.id).includes(q) ||
          (m.txHash ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [messages, filter, walletAddress, search]);

  const visible = limit != null ? filtered.slice(0, limit) : filtered;

  const handleConfirmDelete = async () => {
    if (!pendingDelete || !onDeleteMessage) return;
    setIsDeleting(true);
    try {
      await onDeleteMessage(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      // parent hook surfaces error
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {showFilters ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label htmlFor="capsule-message-filter" className="text-xs font-medium text-zinc-500 shrink-0">
              Filter
            </label>
            <select
              id="capsule-message-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as GenesisMessageFilter)}
              className="k-input text-sm min-w-[10rem]"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} disabled={opt.id === 'mine' && !walletAddress}>
                  {opt.label}
                </option>
              ))}
            </select>
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
            <GenesisMessageCard
              key={msg.id}
              message={msg}
              walletAddress={walletAddress}
              onDelete={onDeleteMessage ? (m) => setPendingDelete(m) : undefined}
            />
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

      <GenesisDeleteMessageModal
        isOpen={Boolean(pendingDelete)}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
