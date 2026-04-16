'use client';

import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VBlogCard } from '@/components/vblog/VBlogCard';
import { useVBlog } from '@/hooks/useVBlog';
import { formatAddress } from '@/lib/vblog/utils';
import { Alert } from '@/components/Alert';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createKnsClient } from '@/lib/kns/client';
import { isValidKaspaAddress, normalizeKaspaAddress } from '@/lib/kaspa/sdk';

export function AuthorPageContent() {
  const params = useParams();
  const rawAddress = params?.address as string | undefined;
  const addressParam = rawAddress ? decodeURIComponent(rawAddress) : undefined;
  const { getAuthorArticles } = useVBlog();

  const [resolvedOwner, setResolvedOwner] = useState<string | null>(null);
  const [resolvedLabel, setResolvedLabel] = useState<string | null>(null);

  const normalizedOwner = useMemo(() => {
    if (!resolvedOwner) return null;
    try {
      return normalizeKaspaAddress(resolvedOwner).toLowerCase();
    } catch {
      return resolvedOwner.toLowerCase();
    }
  }, [resolvedOwner]);

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      setResolvedOwner(null);
      setResolvedLabel(null);
      const v = String(addressParam || '').trim();
      if (!v) return;

      // Accept `.kas` name or Kaspa address.
      if (v.toLowerCase().endsWith('.kas')) {
        const kns = createKnsClient();
        try {
          const owner = await kns.getDomainOwner(v.toLowerCase());
          const addr =
            (owner.ownerAddress as string | undefined) ||
            (owner.owner_address as string | undefined) ||
            (owner.owner as string | undefined) ||
            null;
          if (!cancelled && addr) {
            setResolvedOwner(addr);
            setResolvedLabel(v.toLowerCase());
          }
          return;
        } catch {
          // fall through
        }
      }

      if (isValidKaspaAddress(v)) {
        setResolvedOwner(v);
        setResolvedLabel(v);
      } else {
        // Still allow raw string; author articles are currently keyed by the stored author string.
        setResolvedOwner(v);
        setResolvedLabel(v);
      }
    }
    resolve();
    return () => {
      cancelled = true;
    };
  }, [addressParam]);

  const authorArticles = normalizedOwner ? getAuthorArticles(normalizedOwner) : (resolvedOwner ? getAuthorArticles(resolvedOwner) : []);

  if (!addressParam) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <Alert type="error">Invalid author address</Alert>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 text-base sm:text-[17px]">
        <div className="p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Link
                href="/vblog"
                className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Go back to vBlog
              </Link>
              <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">
                Author: {formatAddress(resolvedLabel || addressParam)}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                {authorArticles.length} article{authorArticles.length !== 1 ? 's' : ''} published
              </p>
            </div>

            {authorArticles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {authorArticles.map((article) => (
                  <VBlogCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-base text-zinc-600 dark:text-zinc-400">
                  This author hasn&apos;t published any articles yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

