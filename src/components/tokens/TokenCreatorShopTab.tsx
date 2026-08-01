'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Token } from '@/lib/tokens/types';
import { resolveTokenCreatorWallet } from '@/lib/tokens/creatorWallet';
import { getProductsBySeller } from '@/lib/store/products';
import type { Product } from '@/lib/store/types';
import { ProductCard } from '@/components/store/ProductCard';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { KxFormSelect } from '@/components/ui/KxFormSelect';
import { KX_SURFACE_INSET } from '@/lib/hub/shellTokens';

type SortKey = 'newest' | 'oldest' | 'title-asc' | 'title-desc';
type StatusFilter = 'all' | 'active';

export function TokenCreatorShopTab({ token }: { token: Token }) {
  const creatorWallet = resolveTokenCreatorWallet(token);
  const selectedIds = token.modulesConfig?.creatorShowcase?.productIds ?? [];
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  useEffect(() => {
    let cancelled = false;
    if (!creatorWallet) {
      setProducts([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getProductsBySeller(creatorWallet)
      .then((items) => {
        if (cancelled) return;
        setProducts(items.filter((p) => p.status === 'active'));
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [creatorWallet]);

  const visible = useMemo(() => {
    let list = [...products];
    if (selectedIds.length > 0) {
      const allow = new Set(selectedIds);
      list = list.filter((p) => allow.has(p.id));
    }
    if (statusFilter === 'active') {
      list = list.filter((p) => p.status === 'active');
    }
    switch (sort) {
      case 'oldest':
        list.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
        break;
      case 'title-asc':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        list.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'newest':
      default:
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        break;
    }
    return list;
  }, [products, selectedIds, sort, statusFilter]);

  return (
    <div className="space-y-6">
      <GameOverviewTitleBlock
        kicker="Creator"
        title="Shop"
        subtitle="Active Store listings from the verified token creator."
        as="h3"
        compact
      />

      <div className={`${KX_SURFACE_INSET} flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'active' as const, label: 'Active' },
              { id: 'all' as const, label: 'All' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setStatusFilter(opt.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === opt.id
                  ? 'border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] text-[color:var(--hub-accent)]'
                  : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-48">
          <KxFormSelect
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            ariaLabel="Sort shop products"
            options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
              { value: 'title-asc', label: 'Title A-Z' },
              { value: 'title-desc', label: 'Title Z-A' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[color:var(--hub-accent)]" />
        </div>
      ) : !creatorWallet ? (
        <p className="kx-body text-zinc-500">No verified creator wallet on this listing yet.</p>
      ) : visible.length === 0 ? (
        <p className="kx-body text-zinc-500">
          {selectedIds.length > 0
            ? 'No selected Shop products are live yet. The creator can update the Showcase module in the Tokens dashboard.'
            : 'No Shop products from this creator yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visible.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
    </div>
  );
}
