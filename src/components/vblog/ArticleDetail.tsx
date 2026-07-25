'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VBlogArticle } from '@/lib/vblog/types';
import { formatAddress, formatDate } from '@/lib/vblog/utils';
import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { useVBlog } from '@/hooks/useVBlog';
import { Avatar } from '@/components/Avatar';
import { ArticleSidebar } from './ArticleSidebar';
import { VBlogFeaturedImage } from '@/components/vblog/VBlogFeaturedImage';
import { VBlogAuthorCard } from '@/components/vblog/ArticleSidebar';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { AuthorArticlesTab } from '@/components/vblog/AuthorArticlesTab';
import { DAppTabs, type DAppTab } from '@/components/dapps/layout/DAppTabs';
import { IconArticle, IconAuthor, IconComments, IconModules } from '@/components/dapps/icons/DAppTabIcons';
import { HubPageRightPanelGrid, HubPageRightPanelToggle } from '@/components/hub/HubPageRightPanel';
import { DirectoryGalleryLightbox } from '@/components/dapps/DirectoryGalleryLightbox';
import { SidePanelCollapsedContentWrap } from '@/components/layout/SidePanelCollapsedContentWrap';
import { useVBlogRightPanelOpen } from '@/hooks/useVBlogRightPanelOpen';
import { getVBlogPlatformFeeBps, getVBlogTreasuryL1Address } from '@/lib/vblog/config';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { kasToSompi } from '@/lib/ads/config';
import { buildVBlogPremiumUnlockPayloadHex, buildVBlogPremiumUnlockPlainNote, utf8ToHex } from '@/lib/vblog/payloadHex';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { computeVBlogReaderPaymentSplit } from '@/lib/vblog/readerPricing';
import { resolvePremiumPayoutSplits, splitAuthorKasByPercent } from '@/lib/vblog/paymentSplit';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import type { EarnSource } from '@/lib/rewards/hub-ledger-types';
import {
  getPollVotes,
  getPollVoteForWallet,
  getReceiptStreakAndBadge,
  hasPollVote,
  hasReaderEntitlement,
  savePollVote,
  saveReaderEntitlement,
  saveReadingReceipt,
} from '@/lib/vblog/modules';
import { VBlogPremiumSectionGate } from '@/components/vblog/VBlogPremiumSectionGate';
import { VBlogPremiumPoll } from '@/components/vblog/VBlogPremiumPoll';
import { HubPointsEarnRow } from '@/components/hub/HubPointsEarnBadge';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
import { krexToKasAmount, isBuiltinStoreCurrency } from '@/lib/store/currencies';
import { toKasEq, formatKasEq, resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { mergePricingTickers } from '@/lib/pricing/registry';
import { transferKrc20 } from '@/lib/payments/krc20Payment';
import { useIntegratedTokens } from '@/hooks/useIntegratedToken';
import { buildIntegratedPaymentCurrencyIds } from '@/lib/payments/hubPaymentTypes';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';

export type ArticleContentTab = 'article' | 'author' | 'author-posts' | 'modules' | 'comments';

interface ArticleDetailProps {
  article: VBlogArticle;
  allArticles?: VBlogArticle[];
  onEdit?: (article: VBlogArticle) => void;
  contentTab?: ArticleContentTab;
  onContentTabChange?: (tab: ArticleContentTab) => void;
}

function HeaderCategoryIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function AuthorPostsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

export function ArticleDetail({
  article,
  allArticles = [],
  onEdit,
  contentTab: controlledTab,
  onContentTabChange,
}: ArticleDetailProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress } = useAccount();
  const { tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { deleteExistingArticle, getArticleComments } = useVBlog();
  const router = useRouter();
  const [internalTab, setInternalTab] = useState<ArticleContentTab>('article');
  const contentTab = controlledTab ?? internalTab;
  const setContentTab = onContentTabChange ?? setInternalTab;

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConnectWallet, setShowConnectWallet] = useState(false);
  const [customTipKas, setCustomTipKas] = useState('25');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedPollOption, setSelectedPollOption] = useState(0);
  const [featuredLightboxOpen, setFeaturedLightboxOpen] = useState(false);

  const rightPanelDefault = article.layoutPreferences?.rightPanelShownByDefault ?? true;
  const [rightOpen, setRightOpen] = useVBlogRightPanelOpen(true, rightPanelDefault);

  const commentCount = useMemo(() => getArticleComments(article.id).length, [article.id, getArticleComments, refreshTick]);

  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isAuthor = walletAddress && (
    article.author.toLowerCase() === walletAddress.toLowerCase() ||
    article.author.toLowerCase() === `evm:${evmAddress?.toLowerCase()}` ||
    (kaspaState.address && article.author.toLowerCase() === kaspaState.address.toLowerCase())
  );

  const authorDisplay = formatAddress(article.author);
  const featuredImageSrc = article.featuredImage?.trim() ?? '';
  const authorAddress = article.author.replace(/^(evm:|kaspa:)/, '');
  const authorProfileUrl = `/u/${encodeURIComponent(article.author)}?tab=creator-content&type=articles`;
  const premiumUnlockEntitled = useMemo(() => {
    const wallets = [walletAddress, kaspaState.address].filter(Boolean) as string[];
    return wallets.some((w) => hasReaderEntitlement(w, article.id, 'premium_unlock'));
  }, [walletAddress, kaspaState.address, article.id, refreshTick]);
  const tipRevealEntitled = useMemo(() => {
    const wallets = [walletAddress, kaspaState.address].filter(Boolean) as string[];
    return wallets.some((w) => hasReaderEntitlement(w, article.id, 'tip_to_reveal_unlock'));
  }, [walletAddress, kaspaState.address, article.id, refreshTick]);
  const canVotePoll = walletAddress ? premiumUnlockEntitled && !hasPollVote(article.id, walletAddress) : false;
  const hasVotedPoll = walletAddress ? hasPollVote(article.id, walletAddress) : false;
  const userPollVote = walletAddress ? getPollVoteForWallet(article.id, walletAddress) : undefined;
  const pollVotes = useMemo(() => getPollVotes(article.id), [article.id, refreshTick]);
  const receiptBadge = walletAddress ? getReceiptStreakAndBadge(walletAddress) : { streak: 0, badge: 'No badge' };

  const premiumListKas = Number(article.modules?.premiumSectionPriceKas ?? 0);
  const premiumPricing = useMemo(
    () => computeVBlogReaderPaymentSplit(premiumListKas, krexTier, nftStatus),
    [premiumListKas, krexTier, nftStatus],
  );

  const premiumPayoutSplits = useMemo(
    () => resolvePremiumPayoutSplits(article.modules, article.author),
    [article.modules, article.author],
  );

  const { tokens: integratedTipTokens } = useIntegratedTokens(article.author, 'vblog_tips');
  const integratedTipToken = integratedTipTokens[0] ?? null;

  const tipCurrencies = useMemo(() => {
    const set = new Set<string>(['KAS', 'KREX']);
    for (const c of article.modules?.tipBox?.currencies ?? []) {
      if (c) set.add(c.toUpperCase());
    }
    for (const token of integratedTipTokens) {
      set.add(token.tick);
    }
    return Array.from(set);
  }, [article.modules?.tipBox?.currencies, integratedTipTokens]);

  const premiumCurrencies = useMemo(
    () => buildIntegratedPaymentCurrencyIds(integratedTipToken, integratedTipTokens),
    [integratedTipToken, integratedTipTokens],
  );

  const [premiumCurrency, setPremiumCurrency] = useState('KAS');

  const { snapshot: pricingSnapshot } = usePricingSnapshot(
    mergePricingTickers([...tipCurrencies, ...premiumCurrencies, premiumCurrency]),
  );

  const integratedTokenDecimals = (currency: string) => {
    const match = integratedTipTokens.find((token) => token.tick === currency);
    return match?.decimals ?? 8;
  };

  const creditReaderEarn = (
    source: EarnSource,
    basePoints: number,
    idempotencyKey: string,
    meta?: Record<string, unknown>,
  ) => {
    if (!kaspaState.address) return;
    appendHubActivityEarn({
      walletRaw: kaspaState.address,
      source,
      redeemableDelta: basePoints,
      idempotencyKey,
      krexTier,
      meta,
    });
  };

  const articleTabs: readonly DAppTab<ArticleContentTab>[] = [
    { id: 'article', label: 'Article', icon: <IconArticle /> },
    { id: 'author', label: 'Author', icon: <IconAuthor /> },
    { id: 'author-posts', label: 'More from Author', icon: <AuthorPostsIcon /> },
    { id: 'modules', label: 'Modules', icon: <IconModules /> },
    {
      id: 'comments',
      label: 'Comments',
      icon: <IconComments />,
      rightAdornment: commentCount > 0 ? (
        <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#e30d1b]/15 px-1.5 py-0.5 text-[10px] font-black text-[#e30d1b]">
          {commentCount}
        </span>
      ) : null,
    },
  ];

  const performSplitPayment = async (
    moduleId: 'premium_unlock' | 'tip_to_reveal_unlock' | 'tip_box',
    listAmount: number,
    currency: string = 'KAS',
  ) => {
    if (!kaspaState.provider || !kaspaState.isConnected || !kaspaState.address) {
      throw new Error('Kaspa wallet required');
    }
    const payerAddress = normalizeKaspaAddress(kaspaState.address);
    const kasEquivalent =
      toKasEq(listAmount, currency, pricingSnapshot) ??
      (currency === 'KREX' ? krexToKasAmount(listAmount) : listAmount);
    const payment = computeVBlogReaderPaymentSplit(kasEquivalent, krexTier, nftStatus, getVBlogPlatformFeeBps());
    const payoutSplits =
      moduleId === 'premium_unlock'
        ? resolvePremiumPayoutSplits(article.modules, article.author)
        : resolvePremiumPayoutSplits({ premiumSectionPayoutSplits: [{ address: article.author, sharePercent: 100 }] }, article.author);
    if (payoutSplits.length === 0) {
      throw new Error('Author payout address is invalid');
    }
    const authorSplits = splitAuthorKasByPercent(payment.authorKas, payoutSplits);
    const authorShare = payment.totalKas > 0 ? payment.authorKas / payment.totalKas : 1;
    const platformShare = payment.totalKas > 0 ? payment.platformKas / payment.totalKas : 0;

    if (currency === 'KAS') {
      const note = buildVBlogPremiumUnlockPlainNote({
        articleId: article.id,
        moduleId,
        payerAddress,
        amountKas: payment.totalKas,
      });
      const payload = buildVBlogPremiumUnlockPayloadHex({
        articleId: article.id,
        moduleId,
        payerAddress,
        amountKas: payment.totalKas,
      });

      const authorTxHashes: string[] = [];
      for (const split of authorSplits) {
        const authorTx = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
          to: split.address,
          amount: String(kasToSompi(split.kas)),
          note,
          payload,
        });
        if (authorTx.status === 'failed' || !authorTx.txHash) {
          throw new Error(authorTx.error ?? 'Author payout transaction failed');
        }
        authorTxHashes.push(extractKaspaTransactionId(authorTx.txHash) ?? authorTx.txHash);
      }

      const platformTx = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
        to: getVBlogTreasuryL1Address(),
        amount: String(kasToSompi(payment.platformKas)),
        note: `${note}:fee`,
        payload,
      });
      if (platformTx.status === 'failed' || !platformTx.txHash) {
        throw new Error(platformTx.error ?? 'Platform fee transaction failed');
      }
      const platformTxHash = extractKaspaTransactionId(platformTx.txHash) ?? platformTx.txHash;

      const verifyRes = await fetch('/api/vblog/modules/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payerAddress,
          articleId: article.id,
          moduleId,
          expectedAuthorAddress: payoutSplits[0].address,
          expectedAuthorKas: payment.authorKas,
          expectedPlatformKas: payment.platformKas,
          authorTxHashes,
          authorRecipientAddresses: payoutSplits.map((s) => s.address),
          platformTxHash,
        }),
      });
      const verifyJson = (await verifyRes.json()) as { ok?: boolean; error?: string; points?: number };
      if (!verifyJson.ok) throw new Error(verifyJson.error ?? 'Verification failed');
      return { authorTxHashes, platformTxHash, payment, payerAddress };
    }

    if (!isBuiltinStoreCurrency(currency)) {
      const authorTxHashes: string[] = [];
      for (const split of authorSplits) {
        const portion =
          payment.authorKas > 0 ? listAmount * authorShare * (split.kas / payment.authorKas) : listAmount * authorShare;
        const hash = await transferKrc20(kaspaState.provider as KaspaWalletProvider, {
          tick: currency,
          amount: portion,
          to: split.address,
          decimals: integratedTokenDecimals(currency),
        });
        authorTxHashes.push(hash);
      }
      const platformToken = listAmount * platformShare;
      let platformTxHash = authorTxHashes[0] ?? '';
      if (platformToken > 1e-9) {
        platformTxHash = await transferKrc20(kaspaState.provider as KaspaWalletProvider, {
          tick: currency,
          amount: platformToken,
          to: getVBlogTreasuryL1Address(),
          decimals: integratedTokenDecimals(currency),
        });
      }
      return { authorTxHashes, platformTxHash, payment, payerAddress };
    }

    const tick = currency;
    const authorTxHashes: string[] = [];
    for (const split of authorSplits) {
      const portion =
        payment.authorKas > 0 ? listAmount * authorShare * (split.kas / payment.authorKas) : listAmount * authorShare;
      const hash = await transferKrc20(kaspaState.provider as KaspaWalletProvider, {
        tick,
        amount: portion,
        to: split.address,
      });
      authorTxHashes.push(hash);
    }
    const platformToken = listAmount * platformShare;
    let platformTxHash = authorTxHashes[0] ?? '';
    if (platformToken > 1e-9) {
      platformTxHash = await transferKrc20(kaspaState.provider as KaspaWalletProvider, {
        tick,
        amount: platformToken,
        to: getVBlogTreasuryL1Address(),
      });
    }
    return { authorTxHashes, platformTxHash, payment, payerAddress };
  };

  const handlePremiumUnlock = async () => {
    try {
      setActionError(null);
      setIsProcessingAction(true);
      const payAmount =
        premiumCurrency === 'KAS'
          ? premiumListKas
          : resolveTokenAmountFromKas(premiumListKas, premiumCurrency, pricingSnapshot);
      const txs = await performSplitPayment('premium_unlock', payAmount, premiumCurrency);
      const walletKey = txs.payerAddress;
      saveReaderEntitlement({
        wallet: walletKey,
        articleId: article.id,
        moduleId: 'premium_unlock',
        txHashes: [...txs.authorTxHashes, txs.platformTxHash],
        createdAt: new Date().toISOString(),
      });
      creditReaderEarn(
        'vblog_premium_unlock',
        HUB_EARN_POINTS.vblogPremiumUnlock,
        `vbu:premium:${txs.authorTxHashes[0]}`,
        { articleId: article.id },
      );
      setRefreshTick((x) => x + 1);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Unlock failed');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleTip = async (amount: number, currency: string = 'KAS') => {
    try {
      setActionError(null);
      setIsProcessingAction(true);
      const txs = await performSplitPayment('tip_box', amount, currency);
      const walletKey = txs.payerAddress;
      const amountKas = txs.payment.totalKas;
      saveReaderEntitlement({
        wallet: walletKey,
        articleId: article.id,
        moduleId: 'tip_box',
        txHashes: [...txs.authorTxHashes, txs.platformTxHash],
        createdAt: new Date().toISOString(),
      });
      if (article.modules?.tipToRevealEnabled && amountKas >= Number(article.modules.tipToRevealThresholdKas ?? 0)) {
        saveReaderEntitlement({
          wallet: walletKey,
          articleId: article.id,
          moduleId: 'tip_to_reveal_unlock',
          txHashes: [...txs.authorTxHashes, txs.platformTxHash],
          createdAt: new Date().toISOString(),
        });
      }
      creditReaderEarn('vblog_tip', HUB_EARN_POINTS.vblogTip, `vbu:tip:${txs.authorTxHashes[0]}`, {
        articleId: article.id,
        amountKas,
      });
      setRefreshTick((x) => x + 1);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Tip failed');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handlePollVote = async () => {
    if (!walletAddress || !canVotePoll) return;
    savePollVote({
      articleId: article.id,
      wallet: walletAddress,
      optionIndex: selectedPollOption,
      votedAt: new Date().toISOString(),
    });
    setRefreshTick((x) => x + 1);
  };

  const handleReadingReceipt = async () => {
    if (!kaspaState.address || !kaspaState.provider || !kaspaState.isConnected) return;
    try {
      setActionError(null);
      setIsProcessingAction(true);
      const payerAddress = normalizeKaspaAddress(kaspaState.address);
      const note = `kvb1:receipt:${article.id}:${payerAddress}:${Date.now()}`;
      const tx = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
        to: getVBlogTreasuryL1Address(),
        amount: String(kasToSompi(1)),
        note,
        payload: utf8ToHex(note),
      });
      if (tx.status === 'failed' || !tx.txHash) {
        throw new Error(tx.error ?? 'Reading receipt failed');
      }
      const txHash = extractKaspaTransactionId(tx.txHash) ?? tx.txHash;
      saveReadingReceipt({
        articleId: article.id,
        wallet: payerAddress,
        txHash,
        createdAt: new Date().toISOString(),
      });
      creditReaderEarn('vblog_reading_receipt', HUB_EARN_POINTS.vblogReadingReceipt, `vbu:receipt:${txHash}`, {
        articleId: article.id,
      });
      setRefreshTick((x) => x + 1);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Receipt failed');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExistingArticle(article.id);
      router.push('/vblog');
    } catch (error) {
      console.error('Error deleting article:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(article);
    } else {
      router.push(`/vblog/dashboard?edit=${article.id}`);
    }
  };

  return (
    <article className="w-full min-w-0 max-w-full font-sans">
      <div id="article-header" className="relative mb-10 rounded-2xl overflow-hidden bg-zinc-50/80 dark:bg-zinc-900/45 border border-zinc-200 dark:border-zinc-800 select-text">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e30d1b]/5 via-transparent to-transparent" />

        <div className="relative flex min-h-[360px] min-w-0 flex-col lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col justify-center p-8 sm:p-10 lg:p-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-6 leading-tight">
              {article.title}
            </h1>
            <p id="article-intro" className="kx-body max-w-2xl mb-8 select-text">
              {article.description}
            </p>

            <div className="flex min-w-0 flex-wrap items-end gap-6">
              <Link href={authorProfileUrl} className="group flex items-center gap-3">
                <Avatar address={authorAddress} size={44} className="ring-2 ring-[#e30d1b]/20" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">By</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[#e30d1b] transition-colors">
                    {authorDisplay}
                  </span>
                </div>
              </Link>

              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Published</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatDate(article.publishDate)}</span>
              </div>

              <div className="sm:ml-auto shrink-0">
                <KxListingCategoryChip
                  icon={<HeaderCategoryIcon />}
                  title={`Filter by ${article.category}`}
                  onClick={() => router.push(`/vblog?category=${encodeURIComponent(article.category)}`)}
                >
                  {article.category}
                </KxListingCategoryChip>
              </div>
            </div>
          </div>

          <div className="relative min-h-[260px] w-full min-w-0 shrink-0 bg-zinc-100 dark:bg-zinc-800 border-l border-zinc-200 dark:border-zinc-800 lg:min-h-full lg:w-[40%] lg:max-w-[45%]">
            <VBlogFeaturedImage
              src={article.featuredImage}
              title={article.title}
              variant="hero"
              className="absolute inset-0 h-full w-full"
              imgClassName="absolute inset-0 w-full h-full object-cover"
              onImageClick={featuredImageSrc ? () => setFeaturedLightboxOpen(true) : undefined}
            />
          </div>
        </div>

        {isAuthor ? (
          <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
            <button
              onClick={handleEdit}
              className="p-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-3 bg-red-500 text-white rounded-xl hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex w-full min-w-0 flex-col gap-6">
        <div className="mb-2 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          <div className="min-w-0 flex-1">
            <DAppTabs tabs={articleTabs} value={contentTab} onChange={setContentTab} />
          </div>
          <HubPageRightPanelToggle
            panelId="kasparex-vblog-side-panel"
            rightOpen={rightOpen}
            onToggle={() => setRightOpen(!rightOpen)}
          />
        </div>

        <HubPageRightPanelGrid
          panelId="kasparex-vblog-side-panel"
          panelTitle="Article panel"
          rightOpen={rightOpen}
          onToggle={() => setRightOpen(!rightOpen)}
          sidebar={
            <ArticleSidebar
              article={article}
              tipBoxEnabled={Boolean(article.modules?.tipBoxEnabled)}
              tipPresets={article.modules?.tipBox?.presets ?? [10, 50, 100]}
              tipCurrencies={tipCurrencies}
              customTipKas={customTipKas}
              onCustomTipChange={setCustomTipKas}
              onTip={(amount, currency) => void handleTip(amount, currency)}
              isProcessingAction={isProcessingAction}
              isWalletConnected={kaspaState.isConnected}
              tipHubPointsBase={HUB_EARN_POINTS.vblogTip}
              tipHubPointsTier={krexTier}
              pricingSnapshot={pricingSnapshot}
            />
          }
          mainColClass="lg:col-span-7"
          asideColClass="lg:col-span-5"
          gridClassName="grid grid-cols-1 gap-8 xl:gap-12"
          hideToggle
        >
          <SidePanelCollapsedContentWrap panelOpen={rightOpen}>
            <div className="flex min-w-0 flex-col space-y-6">
                {actionError ? (
                  <p className="text-sm text-red-600 dark:text-red-300">{actionError}</p>
                ) : null}

                {contentTab === 'article' ? (
                  <div className="space-y-6">
                    <DAppSectionHeader title="Article" className="mb-0" />
                    <KxRichTextContent
                      id="article-main"
                      html={article.content}
                      className="cursor-text"
                      onClick={(e) => {
                        const selection = window.getSelection()?.toString().trim();
                        if (!selection) return;
                        void navigator.clipboard.writeText(selection).catch(() => undefined);
                      }}
                    />

                    {article.modules?.premiumSectionEnabled ? (
                      <VBlogPremiumSectionGate
                        unlocked={premiumUnlockEntitled}
                        previewHtml={article.modules.premiumSectionContent ?? ''}
                        listPriceKas={premiumPricing.listKas}
                        effectivePriceKas={premiumPricing.totalKas}
                        discountPercent={premiumPricing.discountPercent}
                        hubPointsBase={HUB_EARN_POINTS.vblogPremiumUnlock}
                        tier={krexTier}
                        isProcessing={isProcessingAction}
                        isWalletConnected={kaspaState.isConnected}
                        payoutSplits={premiumPayoutSplits}
                        paymentCurrencies={premiumCurrencies}
                        selectedCurrency={premiumCurrency}
                        onCurrencyChange={setPremiumCurrency}
                        pricingSnapshot={pricingSnapshot}
                        onUnlock={() => {
                          if (!kaspaState.isConnected) {
                            setShowConnectWallet(true);
                            return;
                          }
                          void handlePremiumUnlock();
                        }}
                      />
                    ) : null}
                  </div>
                ) : null}

                {contentTab === 'author' ? (
                  <div id="article-author">
                    <DAppSectionHeader title="Author" className="mb-4" />
                    <VBlogAuthorCard article={article} />
                  </div>
                ) : null}

                {contentTab === 'author-posts' ? (
                  <div>
                    <DAppSectionHeader title="More from Author" className="mb-4" />
                    <AuthorArticlesTab article={article} allArticles={allArticles} />
                  </div>
                ) : null}

                {contentTab === 'modules' ? (
                  <div id="article-modules" className="space-y-6">
                    <DAppSectionHeader title="Modules" className="mb-2" />
                    {article.modules?.tipToRevealEnabled ? (
                      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 bg-zinc-50/80 dark:bg-zinc-900/40">
                        <DAppSectionHeader title="Tip-to-Reveal bonus" className="mb-0" />
                        {!tipRevealEntitled ? (
                          <p className="mt-3 kx-body">Tip at least {article.modules.tipToRevealThresholdKas} KAS to reveal bonus content.</p>
                        ) : (
                          <KxRichTextContent html={article.modules.tipToRevealContent ?? ''} className="mt-3" />
                        )}
                      </div>
                    ) : null}

                    {article.modules?.premiumPollEnabled ? (
                      <VBlogPremiumPoll
                        question={article.modules.premiumPoll?.question ?? ''}
                        options={article.modules.premiumPoll?.options ?? []}
                        votes={pollVotes}
                        selectedOption={selectedPollOption}
                        onSelectOption={setSelectedPollOption}
                        onSubmitVote={() => void handlePollVote()}
                        canVote={canVotePoll}
                        hasVoted={hasVotedPoll}
                        userVoteIndex={userPollVote?.optionIndex}
                        premiumUnlocked={premiumUnlockEntitled}
                        isProcessing={isProcessingAction}
                      />
                    ) : null}

                    {article.modules?.readingReceiptsEnabled ? (
                      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 bg-zinc-50/80 dark:bg-zinc-900/40">
                        <DAppSectionHeader title="Reading receipts + badges" className="mb-0" />
                        <p className="mt-2 kx-body">Current streak: {receiptBadge.streak} day(s) | Badge: {receiptBadge.badge}</p>
                        <p className="mt-1 text-xs text-zinc-500">On-chain receipt cost: 1 KAS</p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <button disabled={isProcessingAction || !kaspaState.isConnected} onClick={() => void handleReadingReceipt()} className="k-control-btn">
                            Record on-chain reading receipt
                          </button>
                          <HubPointsEarnRow
                            label="Earn:"
                            basePoints={HUB_EARN_POINTS.vblogReadingReceipt}
                            tier={krexTier}
                          />
                        </div>
                      </div>
                    ) : null}

                    {!article.modules?.tipToRevealEnabled &&
                    !article.modules?.premiumPollEnabled &&
                    !article.modules?.readingReceiptsEnabled ? (
                      <p className="kx-body text-zinc-500">No modules are enabled for this article.</p>
                    ) : null}
                  </div>
                ) : null}

                {contentTab === 'comments' ? (
                  <div id="article-comments">
                    <CommentsSection articleId={article.id} dappSectionHeader />
                  </div>
                ) : null}
              </div>
          </SidePanelCollapsedContentWrap>
        </HubPageRightPanelGrid>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl max-w-sm w-full border border-zinc-200 dark:border-zinc-800 p-8">
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-tight">Confirm Deletion</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium">Are you sure you want to delete this article? This action cannot be revoked from the chain.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {featuredLightboxOpen && featuredImageSrc ? (
        <DirectoryGalleryLightbox
          images={[{ url: featuredImageSrc, alt: article.title }]}
          index={0}
          onClose={() => setFeaturedLightboxOpen(false)}
          onNavigate={() => {}}
        />
      ) : null}

      {showConnectWallet ? (
        <HubWalletGateModal
          isOpen
          onClose={() => setShowConnectWallet(false)}
          title="Wallet required"
          name="Premium content"
          message="Connect your Kaspa L1 wallet to unlock this premium content."
          networkBadge={{ layer: 'L1', label: 'Kaspa' }}
          showL1Connect
          showEvmConnect={false}
        />
      ) : null}
    </article>
  );
}
