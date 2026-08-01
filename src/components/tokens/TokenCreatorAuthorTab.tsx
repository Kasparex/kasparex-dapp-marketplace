'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Token } from '@/lib/tokens/types';
import { resolveTokenCreatorWallet } from '@/lib/tokens/creatorWallet';
import { getArticlesByAuthor, getAllArticles } from '@/lib/vblog/data';
import type { VBlogArticle } from '@/lib/vblog/types';
import { VBlogCard } from '@/components/vblog/VBlogCard';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { KxFormSelect } from '@/components/ui/KxFormSelect';
import { KX_SURFACE_INSET } from '@/lib/hub/shellTokens';
import { bootstrapHubContent } from '@/lib/hub/contentSync';

type SortKey = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export function TokenCreatorAuthorTab({ token }: { token: Token }) {
  const creatorWallet = resolveTokenCreatorWallet(token);
  const selectedIds = token.modulesConfig?.creatorShowcase?.articleIds ?? [];
  const [articles, setArticles] = useState<VBlogArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('newest');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    void (async () => {
      try {
        await bootstrapHubContent(['vblog']);
        if (cancelled) return;
        if (creatorWallet) {
          setArticles(getArticlesByAuthor(creatorWallet));
        } else {
          setArticles(getAllArticles().filter(() => false));
        }
      } catch {
        if (!cancelled) setArticles([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [creatorWallet]);

  const visible = useMemo(() => {
    let list = [...articles];
    if (selectedIds.length > 0) {
      const allow = new Set(selectedIds);
      list = list.filter((a) => allow.has(a.id));
    }
    switch (sort) {
      case 'oldest':
        list.sort((a, b) => (a.publishDate > b.publishDate ? 1 : -1));
        break;
      case 'title-asc':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        list.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'newest':
      default:
        list.sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));
        break;
    }
    return list;
  }, [articles, selectedIds, sort]);

  return (
    <div className="space-y-6">
      <GameOverviewTitleBlock
        kicker="Creator"
        title="vBlog Author"
        subtitle="Articles from the verified token creator / deployer."
        as="h2"
      />

      <div className={`${KX_SURFACE_INSET} flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between`}>
        <p className="kx-body text-zinc-500 dark:text-zinc-400">
          {visible.length} {visible.length === 1 ? 'article' : 'articles'}
        </p>
        <div className="w-full sm:w-48">
          <KxFormSelect
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            ariaLabel="Sort author articles"
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
            ? 'No selected articles are published yet. The creator can update the Showcase module in the Tokens dashboard.'
            : 'No vBlog articles from this creator yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visible.map((item) => (
            <VBlogCard key={item.id} article={item} />
          ))}
        </div>
      )}
    </div>
  );
}
