'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAllArticles,
  getArticleBySlug,
  getArticlesByAuthor,
  createArticle,
  updateArticle,
  deleteArticle,
  getCommentsForArticle,
  addComment,
} from '@/lib/vblog/data';
import { VBlogArticle, VBlogComment } from '@/lib/vblog/types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { kasToSompi } from '@/lib/ads/config';
import { getVBlogTreasuryL1Address } from '@/lib/vblog/config';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import {
  buildCanonicalArticlePayload,
  fnv1aHex,
  VBLOG_DELETE_BASE_FEE_KAS,
  VBLOG_CHUNK_SIZE_BYTES,
} from '@/lib/vblog/pricing';
import {
  splitPayloadToHexChunks,
  buildVBlogCommitPayloadHex,
  buildVBlogCommitPlainNote,
  buildVBlogDeletePayloadHex,
  buildVBlogDeletePlainNote,
  computeVBlogRootHash,
} from '@/lib/vblog/payloadHex';
import { getRestTransactionById } from '@/lib/kaspa/api';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { getEnabledVBlogModuleIds, getArticlePaidModuleIds } from '@/lib/vblog/modules';
import {
  bootstrapHubContent,
  syncHubContentItem,
  onHubContentVisibilityRefresh,
} from '@/lib/hub/contentSync';
import { markHubContentDeleted } from '@/lib/hub/deletedContent';
import { collectVblogMediaCids, requestIpfsUnpin } from '@/lib/ipfs/cidUtils';

/**
 * Hook for managing vBlog data
 */
export function useVBlog() {
  const [articles, setArticles] = useState<VBlogArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { state: kaspaState } = useKaspaWallet();
  const pricing = useVBlogPricing();
  const { balance: krexBalance } = useKREXBalance();

  const loadArticles = useCallback(() => {
    setIsLoading(true);
    try {
      const allArticles = getAllArticles();
      setArticles(allArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load articles on mount - only on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const bootstrap = async () => {
      await bootstrapHubContent();
      if (!cancelled) loadArticles();
    };

    void bootstrap();
    const onUpdate = () => loadArticles();
    window.addEventListener('vblog-articles-updated', onUpdate);
    const stopVisibility = onHubContentVisibilityRefresh(() => loadArticles());
    return () => {
      cancelled = true;
      window.removeEventListener('vblog-articles-updated', onUpdate);
      stopVisibility();
    };
  }, [loadArticles]);

  /**
   * Get article by slug
   */
  const getArticle = useCallback((slug: string): VBlogArticle | null => {
    return getArticleBySlug(slug);
  }, []);

  /**
   * Get articles by author
   */
  const getAuthorArticles = useCallback((authorAddress: string): VBlogArticle[] => {
    return getArticlesByAuthor(authorAddress);
  }, []);

  const sendVBlogTxBundle = useCallback(async (args: {
    articleId: string;
    op: 'create' | 'edit';
    author: string;
    payload: string;
    totalKas: number;
    contentHash: string;
  }) => {
    if (!kaspaState.isConnected || !kaspaState.provider || !kaspaState.address) {
      throw new Error('Kaspa wallet must be connected to pay for article transactions.');
    }
    const chunkHexList = splitPayloadToHexChunks(args.payload, VBLOG_CHUNK_SIZE_BYTES);
    const chunkCount = chunkHexList.length;
    const rootHash = computeVBlogRootHash(chunkHexList);
    const treasury = getVBlogTreasuryL1Address();
    const paymentKas = Math.max(0.01, Math.ceil(args.totalKas * 100) / 100);
    const commitNote = buildVBlogCommitPlainNote({
      articleId: args.articleId,
      op: args.op,
      chunkTotal: chunkCount,
      rootHash,
      contentHash: args.contentHash,
      version: 1,
    });
    const commitPayload = buildVBlogCommitPayloadHex({
      articleId: args.articleId,
      op: args.op,
      chunkTotal: chunkCount,
      rootHash,
      contentHash: args.contentHash,
      version: 1,
    });
    const commitTx = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
      to: treasury,
      amount: String(kasToSompi(paymentKas)),
      note: commitNote,
      payload: commitPayload,
    });
    if (commitTx.status === 'failed' || !commitTx.txHash) {
      throw new Error(commitTx.error ?? 'Commit transaction failed');
    }
    const commitTxHash = extractKaspaTransactionId(commitTx.txHash) ?? commitTx.txHash;

    let verified = false;
    let lastError = 'Verification failed.';
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const verifyRes = await fetch('/api/vblog/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleId: args.articleId,
            op: args.op,
            payerAddress: args.author,
            commitTxHash,
            chunkHexList,
            contentHash: args.contentHash,
            rootHash,
            requiredTotalKas: args.totalKas,
          }),
        });
        const verifyJson = (await verifyRes.json()) as {
          ok?: boolean;
          error?: string;
          ptsIngest?: string;
          ptsIngestError?: string;
        };
        if (verifyJson.ok) {
          verified = true;
          if (verifyJson.ptsIngest === 'failed') {
            console.warn(
              '[vBlog] On-chain verify ok but server pts did not credit. Check Vercel PTS_INGEST_SECRET matches Cloudflare and REDEPLOY. Reason:',
              verifyJson.ptsIngestError ?? 'unknown',
            );
          }
          break;
        }
        lastError = verifyJson.error ?? lastError;
      } catch {
        lastError = 'Verification endpoint unavailable.';
      }
      if (attempt < 9) {
        await new Promise((r) => setTimeout(r, 1400 + attempt * 450));
      }
    }

    return {
      chunkTxHashes: [commitTxHash],
      commitTxHash,
      chunkHexList,
      rootHash,
      verified,
      lastError,
    };
  }, [kaspaState.address, kaspaState.isConnected, kaspaState.provider]);

  const createNewArticle = useCallback(async (
    articleData: Omit<VBlogArticle, 'id' | 'slug' | 'publishDate' | 'cid' | 'articleId' | 'txHash' | 'status'>
  ): Promise<VBlogArticle> => {
    const articleId = `vba-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const canonicalPayload = buildCanonicalArticlePayload({
      title: articleData.title,
      description: articleData.description,
      content: articleData.content,
      category: articleData.category,
      tags: articleData.tags,
      featuredImage: articleData.featuredImage,
      linkedMagazineId: articleData.linkedMagazineId,
      linkedIssueNumber: articleData.linkedIssueNumber,
      author: articleData.author,
      primaryLink: articleData.primaryLink,
      socialLinks: articleData.socialLinks,
      modules: articleData.modules,
    }, 'create');
    const contentHash = fnv1aHex(canonicalPayload);
    const magazineIntegrationEnabled = Boolean(articleData.linkedMagazineId && articleData.linkedIssueNumber);
    const quote = pricing.estimateQuote({
      title: articleData.title,
      description: articleData.description,
      content: articleData.content,
      category: articleData.category,
      tags: articleData.tags,
      featuredImage: articleData.featuredImage,
      linkedMagazineId: articleData.linkedMagazineId,
      linkedIssueNumber: articleData.linkedIssueNumber,
      author: articleData.author,
      primaryLink: articleData.primaryLink,
      socialLinks: articleData.socialLinks,
      modules: articleData.modules,
      magazineIntegrationEnabled,
    }, 'create');
    const bundle = await sendVBlogTxBundle({
      articleId,
      op: 'create',
      author: articleData.author,
      payload: canonicalPayload,
      totalKas: quote.totalKas,
      contentHash,
    });
    const enabledModuleIds = getEnabledVBlogModuleIds(articleData.modules, magazineIntegrationEnabled);
    const newArticle = createArticle(
      { ...articleData, paidModuleIds: enabledModuleIds },
      {
        articleId,
        txHash: bundle.commitTxHash,
        status: bundle.verified ? 'verified' : 'verification_pending',
        chunkTxHashes: bundle.chunkTxHashes,
        commitTxHash: bundle.commitTxHash,
        contentHash,
        pricingSnapshot: {
          payloadBytes: quote.payloadBytes,
          chunkCount: quote.chunkCount,
          baseFeeKas: quote.baseFeeKas,
          sizeFeeKas: quote.sizeFeeKas,
          networkFeeBufferKas: quote.networkFeeBufferKas,
          totalKas: quote.totalKas,
        },
      },
    );
    if (!bundle.verified) {
      console.warn('Article created with pending verification:', bundle.lastError);
    } else if (bundle.commitTxHash && articleData.author) {
      appendHubActivityEarn({
        walletRaw: articleData.author,
        source: 'vblog_article_create',
        redeemableDelta: HUB_EARN_POINTS.vblogArticleCreate,
        krexBalance,
        idempotencyKey: `vba:create:${bundle.commitTxHash}`,
        meta: { articleId, contentHash },
      });
    }
    void syncHubContentItem('vblog', 'upsert', { item: newArticle, commitTxHash: bundle.commitTxHash });
    loadArticles(); // Reload articles
    return newArticle;
  }, [loadArticles, pricing, sendVBlogTxBundle, kaspaState.address, krexBalance]);

  /**
   * Update an existing article
   * TODO: Replace with actual smart contract call
   */
  const updateExistingArticle = useCallback(async (
    articleId: string,
    updates: Partial<Omit<VBlogArticle, 'id' | 'author' | 'publishDate'>>
  ): Promise<VBlogArticle | null> => {
    const existing = getAllArticles().find((a) => a.id === articleId);
    if (!existing) {
      throw new Error('Article not found');
    }
    if (!kaspaState.isConnected || !kaspaState.provider || !kaspaState.address) {
      throw new Error('Kaspa wallet must be connected to update an article.');
    }

    // Best-effort: derive canonical author from the last verified commit tx input.
    // This prevents localStorage tampering from reassigning ownership in the editor UX.
    let canonicalAuthor = existing.author;
    const commitHash = existing.commitTxHash ?? existing.txHash ?? '';
    if (commitHash) {
      const tx = await getRestTransactionById(commitHash, { maxAttempts: 2, delayMs: 400 });
      const firstInputAddr =
        (tx?.inputs ?? [])[0]?.previous_outpoint_address ?? (tx?.inputs ?? [])[0]?.previousOutpointAddress;
      if (typeof firstInputAddr === 'string' && firstInputAddr.trim()) {
        try {
          canonicalAuthor = normalizeKaspaAddress(firstInputAddr).toLowerCase();
        } catch {
          // ignore
        }
      }
    }
    try {
      const connected = normalizeKaspaAddress(kaspaState.address).toLowerCase();
      const required = normalizeKaspaAddress(canonicalAuthor).toLowerCase();
      if (connected !== required) {
        throw new Error('Only the original author wallet can update this article.');
      }
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : 'Unauthorized');
    }

    const merged: VBlogArticle = { ...existing, ...updates };
    const canonicalPayload = buildCanonicalArticlePayload({
      title: merged.title,
      description: merged.description,
      content: merged.content,
      category: merged.category,
      tags: merged.tags,
      featuredImage: merged.featuredImage,
      linkedMagazineId: merged.linkedMagazineId,
      linkedIssueNumber: merged.linkedIssueNumber,
      author: canonicalAuthor,
      primaryLink: merged.primaryLink,
      socialLinks: merged.socialLinks,
      modules: merged.modules,
    }, 'edit');
    const contentHash = fnv1aHex(canonicalPayload);
    const magazineIntegrationEnabled = Boolean(merged.linkedMagazineId && merged.linkedIssueNumber);
    const previouslyPaidModuleIds = getArticlePaidModuleIds(existing);
    const priorPricingSnapshot =
      existing.pricingSnapshot?.payloadBytes != null && existing.pricingSnapshot?.chunkCount != null
        ? {
            payloadBytes: existing.pricingSnapshot.payloadBytes,
            chunkCount: existing.pricingSnapshot.chunkCount,
          }
        : undefined;
    const quote = pricing.estimateQuote({
      title: merged.title,
      description: merged.description,
      content: merged.content,
      category: merged.category,
      tags: merged.tags,
      featuredImage: merged.featuredImage,
      linkedMagazineId: merged.linkedMagazineId,
      linkedIssueNumber: merged.linkedIssueNumber,
      author: canonicalAuthor,
      primaryLink: merged.primaryLink,
      socialLinks: merged.socialLinks,
      modules: merged.modules,
      magazineIntegrationEnabled,
      excludeModuleIds: previouslyPaidModuleIds,
      priorPricingSnapshot,
    }, 'edit');

    const enabledModuleIds = getEnabledVBlogModuleIds(merged.modules, magazineIntegrationEnabled);
    const nextPaidModuleIds = [
      ...new Set([
        ...previouslyPaidModuleIds,
        ...enabledModuleIds.filter((id) => !previouslyPaidModuleIds.includes(id)),
      ]),
    ];

    if (quote.totalKas <= 0) {
      const updated = updateArticle(articleId, {
        ...updates,
        paidModuleIds: nextPaidModuleIds,
      });
      loadArticles();
      return updated;
    }

    const chainArticleId = existing.articleId ?? `vba-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const bundle = await sendVBlogTxBundle({
      articleId: chainArticleId,
      op: 'edit',
      author: canonicalAuthor,
      payload: canonicalPayload,
      totalKas: quote.totalKas,
      contentHash,
    });
    const updated = updateArticle(
      articleId,
      {
        ...updates,
        paidModuleIds: nextPaidModuleIds,
      },
      {
        articleId: chainArticleId,
        txHash: bundle.commitTxHash,
        status: bundle.verified ? 'verified' : 'verification_pending',
        chunkTxHashes: bundle.chunkTxHashes,
        commitTxHash: bundle.commitTxHash,
        contentHash,
        pricingSnapshot: {
          payloadBytes: quote.payloadBytes,
          chunkCount: quote.chunkCount,
          baseFeeKas: quote.baseFeeKas,
          sizeFeeKas: quote.sizeFeeKas,
          networkFeeBufferKas: quote.networkFeeBufferKas,
          totalKas: quote.totalKas,
        },
      },
    );
    if (!bundle.verified) {
      console.warn('Article updated with pending verification:', bundle.lastError);
    } else if (bundle.commitTxHash && canonicalAuthor) {
      appendHubActivityEarn({
        walletRaw: canonicalAuthor,
        source: 'vblog_article_update',
        redeemableDelta: HUB_EARN_POINTS.vblogArticleUpdate,
        krexBalance,
        idempotencyKey: `vba:update:${bundle.commitTxHash}`,
        meta: { articleId: chainArticleId, contentHash },
      });
    }
    if (updated) {
      void syncHubContentItem('vblog', 'upsert', { item: updated, commitTxHash: bundle.commitTxHash });
    }
    loadArticles();
    return updated;
  }, [loadArticles, pricing, sendVBlogTxBundle, kaspaState.address, kaspaState.isConnected, kaspaState.provider, krexBalance]);

  /**
   * Get comments for an article
   */
  const getArticleComments = useCallback((articleId: string): VBlogComment[] => {
    return getCommentsForArticle(articleId);
  }, []);

  /**
   * Add a comment to an article
   * TODO: Replace with actual smart contract call for credit checking
   */
  const addArticleComment = useCallback(async (
    commentData: Omit<VBlogComment, 'id' | 'timestamp'>
  ): Promise<VBlogComment> => {
    // Mock credit checking - in real implementation, this would check smart contract
    // TODO: Replace with actual smart contract call for credit checking
    const newComment = addComment(commentData);
    return newComment;
  }, []);

  /**
   * Delete an article
   * TODO: Replace with actual smart contract call
   */
  const deleteExistingArticle = useCallback(async (articleId: string): Promise<boolean> => {
    const existing = getAllArticles().find((a) => a.id === articleId);
    if (!existing) {
      return false;
    }
    if (!kaspaState.isConnected || !kaspaState.provider || !kaspaState.address) {
      throw new Error('Kaspa wallet must be connected to delete an article.');
    }
    const treasury = getVBlogTreasuryL1Address();
    const note = buildVBlogDeletePlainNote(existing.articleId ?? articleId, kaspaState.address);
    const payload = buildVBlogDeletePayloadHex(existing.articleId ?? articleId, kaspaState.address);
    const tx = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
      to: treasury,
      amount: String(kasToSompi(VBLOG_DELETE_BASE_FEE_KAS)),
      note,
      payload,
    });
    if (tx.status === 'failed' || !tx.txHash) {
      throw new Error(tx.error ?? 'Delete transaction failed');
    }
    markHubContentDeleted('vblog', articleId);
    const deleted = deleteArticle(articleId);
    if (deleted) {
      const synced = await syncHubContentItem('vblog', 'delete', { id: articleId });
      if (!synced) {
        console.warn('[vBlog] Local delete ok but hub registry sync failed. Content may reappear until server sync succeeds.');
      }
      void requestIpfsUnpin(collectVblogMediaCids(existing));
      loadArticles();
    }
    return deleted;
  }, [kaspaState.address, kaspaState.isConnected, kaspaState.provider, loadArticles]);

  return {
    articles,
    isLoading,
    loadArticles,
    getArticle,
    getAuthorArticles,
    createNewArticle,
    updateExistingArticle,
    deleteExistingArticle,
    getArticleComments,
    addArticleComment,
  };
}

