'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ContributorRole,
  ContributorShare,
  Magazine,
  MagazineIssue,
} from '@/lib/magazines/types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { kasToSompis } from '@/lib/kaspa/api';
import { normalizeKaspaAddress, isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import {
  buildMagazineBindingPayloadHex,
  buildMagazineBindingPlainNote,
} from '@/lib/magazines/payloadHex';
import {
  getMagazinesByOwner,
  savePublishedMagazineIssue,
  nextIssueNumberForMagazine,
  buildMagazineStubForSlug,
} from '@/lib/magazines/data';
import { blocksToSections, buildManifestV2Payload } from '@/lib/magazines/manifest';
import {
  VBlogSubmissionsPanel,
  vblogSectionsFromSlugs,
} from '@/components/magazines/editor/VBlogSubmissionsPanel';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { HubFlowProgress } from '@/components/hub/HubFlowProgress';
import { getHubFlowPreset } from '@/lib/hub/hubFlowProgress';
import {
  KX_FORM_GRID,
  KX_FORM_PANEL,
  KX_FORM_STICKY_RAIL,
  KX_CALCULATION_ASIDE,
  KX_PREMIUM_MODULE_CARD,
} from '@/lib/hub/shellTokens';
import {
  estimateHubListingQuote,
  type HubListingModuleLine,
} from '@/lib/hub/listingPricing';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { HubListingCalculationBreakdown } from '@/components/hub/HubListingCalculationBreakdown';
import { htmlToPlainText } from '@/lib/richText/html';

interface EditorBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'header';
  content: string;
}

const MAGAZINE_LISTING_FEE_KAS = 50;
const MAGAZINE_TREASURY = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';
const MAGAZINE_PREMIUM_MODULE_FEE_KAS = 12;

export function MagazineEditor() {
  const { state: kaspa } = useKaspaWallet();
  const { tier: krexTier, balance: krexBalance } = useKREXBalance();
  const { uploadJSON, isUploading } = useIPFSUpload();

  const [title, setTitle] = useState('New Magazine Issue');
  const [price, setPrice] = useState(10);
  const [treasurySplit, setTreasurySplit] = useState(5);
  const [magazineSlug, setMagazineSlug] = useState('');
  const [magazineDisplayName, setMagazineDisplayName] = useState('');
  const [existingMagazineId, setExistingMagazineId] = useState<string | ''>('');
  const [blocks, setBlocks] = useState<EditorBlock[]>([
    { id: '1', type: 'header', content: 'Genesis Section' },
    { id: '2', type: 'text', content: '<p>Start writing your collaborative masterpiece here.</p>' },
  ]);
  const [contributors, setContributors] = useState<ContributorShare[]>([
    { address: '', role: 'Author', sharePercentage: 95 },
  ]);
  const [publishNote, setPublishNote] = useState<string | null>(null);
  const [includedVblogSlugs, setIncludedVblogSlugs] = useState<string[]>([]);
  const [spotlightEnabled, setSpotlightEnabled] = useState(false);
  const [collectibleCoverEnabled, setCollectibleCoverEnabled] = useState(false);

  const myMagazines = useMemo(() => {
    if (!kaspa.isConnected || !kaspa.address) return [];
    return getMagazinesByOwner(kaspa.address);
  }, [kaspa.isConnected, kaspa.address]);

  useEffect(() => {
    if (!kaspa.isConnected || !kaspa.address) return;
    try {
      normalizeKaspaAddress(kaspa.address);
      setContributors((prev) => {
        if (prev.length === 0)
          return [{ address: kaspa.address!, role: 'Author', sharePercentage: 95 }] as ContributorShare[];
        const first = prev[0];
        if (first!.address.trim()) return prev;
        const next = [...prev];
        next[0] = { ...first!, address: kaspa.address! };
        return next;
      });
    } catch {
      /* ignore */
    }
  }, [kaspa.isConnected, kaspa.address]);

  useEffect(() => {
    setPublishNote(null);
  }, [existingMagazineId, magazineSlug, title]);

  const addBlock = (type: EditorBlock['type']) => {
    const newBlock: EditorBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'header' ? 'New Section' : '<p></p>',
    };
    setBlocks((blocks) => [...blocks, newBlock]);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks((blocks) => blocks.map((b) => (b.id === id ? { ...b, content } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocks((blocks) => {
      if (blocks.length <= 1) return blocks;
      return blocks.filter((b) => b.id !== id);
    });
  };

  const addContributor = () => {
    setContributors((contributors) => [
      ...contributors,
      { address: '', role: 'Writer', sharePercentage: 0 },
    ]);
  };

  const updateContributor = (index: number, updates: Partial<ContributorShare>) => {
    setContributors((contributors) => {
      const next = [...contributors];
      next[index] = { ...next[index]!, ...updates };
      return next;
    });
  };

  const totalContributorShare = contributors.reduce((sum, c) => sum + (Number(c.sharePercentage) || 0), 0);
  const totalShare = totalContributorShare + treasurySplit;
  const moduleLines = useMemo((): HubListingModuleLine[] => {
    const lines: HubListingModuleLine[] = [];
    if (spotlightEnabled) {
      lines.push({ id: 'spotlight', title: 'Issue spotlight placement', kas: MAGAZINE_PREMIUM_MODULE_FEE_KAS });
    }
    if (collectibleCoverEnabled) {
      lines.push({
        id: 'collectible-cover',
        title: 'Collectible cover metadata',
        kas: MAGAZINE_PREMIUM_MODULE_FEE_KAS,
      });
    }
    return lines;
  }, [spotlightEnabled, collectibleCoverEnabled]);

  const formQuote = useMemo(
    () =>
      estimateHubListingQuote({
        action: 'create',
        baseFeeKas: MAGAZINE_LISTING_FEE_KAS,
        discountPercent: krexTierDiscountPercent(krexTier),
        moduleLines,
        fields: {
          kind: 'magazine-issue',
          title: title.trim(),
          blocks: blocks.map((b) => ({
            type: b.type,
            content: b.type === 'text' ? htmlToPlainText(b.content).trim() : b.content.trim(),
          })),
          contributors: contributors.map((c) => ({
            address: c.address.trim(),
            role: c.role,
            sharePercentage: c.sharePercentage,
          })),
          includedVblogSlugs,
          spotlightEnabled,
          collectibleCoverEnabled,
          priceKAS: price,
          treasurySplitPct: treasurySplit,
        },
      }),
    [
      krexTier,
      moduleLines,
      title,
      blocks,
      contributors,
      includedVblogSlugs,
      spotlightEnabled,
      collectibleCoverEnabled,
      price,
      treasurySplit,
    ],
  );

  const resolveMagazineHeading = useCallback((): Magazine | null => {
    if (!kaspa.address) return null;
    if (existingMagazineId) {
      const found = myMagazines.find((m) => m.id === existingMagazineId);
      return found ?? null;
    }
    const slug = magazineSlug.trim();
    const name = magazineDisplayName.trim();
    if (!slug && !name) return null;
    const stubSlug = slug || name.replace(/\s+/g, '-').toLowerCase().slice(0, 48);
    let ownerNorm: string;
    try {
      ownerNorm = normalizeKaspaAddress(kaspa.address);
    } catch {
      return null;
    }
    return buildMagazineStubForSlug({ slug: stubSlug, displayName: name || slug || 'Magazine', ownerNorm });
  }, [kaspa.address, existingMagazineId, magazineDisplayName, magazineSlug, myMagazines]);

  const targetMagazine = useMemo(() => resolveMagazineHeading(), [resolveMagazineHeading]);
  const targetIssueNumber = targetMagazine ? nextIssueNumberForMagazine(targetMagazine.id) : null;

  const addVblogArticle = (article: { slug: string }) => {
    setIncludedVblogSlugs((prev) => (prev.includes(article.slug) ? prev : [...prev, article.slug]));
  };

  const removeVblogSlug = (slug: string) => {
    setIncludedVblogSlugs((prev) => prev.filter((s) => s !== slug));
  };

  const handlePublish = async () => {
    setPublishNote(null);
    if (totalShare !== 100) {
      setPublishNote('Total share (contributors + treasury) must equal 100%.');
      return;
    }
    if (!kaspa.isConnected || !kaspa.provider || !kaspa.address) {
      setPublishNote('Connect your Kaspa wallet.');
      return;
    }
    if (!MAGAZINE_TREASURY) {
      setPublishNote('Publishing treasury is not configured (NEXT_PUBLIC_STORE_TREASURY_ADDRESS).');
      return;
    }
    const payer = normalizeKaspaAddress(kaspa.address);

    const mag = resolveMagazineHeading();
    if (!mag) {
      setPublishNote('Pick an existing magazine or enter a slug for a new one.');
      return;
    }

    for (const c of contributors) {
      const addr = c.address.trim();
      if (!addr || !isValidKaspaAddress(addr)) {
        setPublishNote('Every contributor row needs a valid Kaspa address.');
        return;
      }
    }

    const issueNumber = nextIssueNumberForMagazine(mag.id);
    const snippet =
      blocks
        .filter((b) => b.type === 'text')
        .map((b) => b.content.replace(/<[^>]+>/g, ' '))
        .join(' ')
        .slice(0, 280) || title;

    const payloadJson = buildManifestV2Payload({
      magazineId: mag.id,
      magazineSlug: mag.slug,
      issueNumber,
      title: title.trim(),
      priceKAS: price,
      treasurySplitPct: treasurySplit,
      contributors,
      sections: [...vblogSectionsFromSlugs(includedVblogSlugs), ...blocksToSections(blocks)],
      authoredBy: payer,
    });

    try {
      const cid = await uploadJSON(payloadJson as unknown as Record<string, unknown>);
      if (!cid) {
        setPublishNote('Could not publish metadata to IPFS.');
        return;
      }

      const plainNote = buildMagazineBindingPlainNote({ cid, magazineSlug: mag.slug, issueNumber });
      const payloadHex = buildMagazineBindingPayloadHex({ cid, magazineSlug: mag.slug, issueNumber });

      const txRes = await sendKaspaTransaction(kaspa.provider as KaspaWalletProvider, {
        to: MAGAZINE_TREASURY,
        amount: String(kasToSompis(formQuote.totalKas)),
        note: plainNote,
        payload: payloadHex,
      });
      if (txRes.status === 'failed' || !txRes.txHash) {
        setPublishNote(txRes.error ?? 'Publishing transaction failed.');
        return;
      }
      const txHash = extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash;

      const issue: MagazineIssue = {
        id: `${mag.id}-${issueNumber}`,
        issueNumber,
        title: title.trim(),
        description: snippet,
        priceKAS: price,
        publishDate: new Date().toISOString(),
        coverImage: '/img/magazines/kaspa-insider-cover.jpg',
        previewImages: ['/img/magazines/kaspa-insider-cover.jpg'],
        cid,
        bindingTxHash: txHash,
        contributors,
        status: 'published',
        tags: ['hub', mag.slug],
        category: mag.category,
        treasuryPercentage: treasurySplit,
      };

      savePublishedMagazineIssue({ ...mag, totalIssues: Math.max(mag.totalIssues, issueNumber) }, issue);

      appendHubActivityEarn({
        walletRaw: payer,
        source: 'magazine_issue_publish',
        redeemableDelta: HUB_EARN_POINTS.magazineIssuePublish,
        krexBalance,
        idempotencyKey: `mag:publish:${txHash}`,
        meta: { cid, slug: mag.slug, issueNumber, magazineId: mag.id },
      });

      setPublishNote(`Published. Issue bound on-chain (${txHash.slice(0, 12)}…). Redeemable points update on your Rewards hub.`);
      setIncludedVblogSlugs([]);
    } catch (e) {
      setPublishNote(e instanceof Error ? e.message : 'Publishing failed.');
    }
  };

  const busyPublish = isUploading;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handlePublish();
      }}
      className={`${KX_FORM_GRID} items-start`}
    >
      <div className="flex min-w-0 flex-col gap-6">
        <div className={`${KX_FORM_PANEL} space-y-6`}>
          <div>
            <DAppSectionHeader title="Main content" className="mb-3" />
            <h3 className="mb-4 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Create New Issue
            </h3>
            <p className="kx-body">
              Compose issue content, attach vBlog submissions, and publish with an on-chain binding payment. Estimated
              cost: {formQuote.totalKas} KAS ({formQuote.chunkCount} chunks, {formQuote.payloadBytes} bytes)
              {formQuote.discountKas > 0 ? ' (KREX holder discount)' : ''}.
            </p>
          </div>

          <div>
            <KxFormFieldLabel required>Issue title</KxFormFieldLabel>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="k-input text-base"
              placeholder="Issue title"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addBlock('text')} className="k-control-btn text-xs">
              + Text block
            </button>
            <button type="button" onClick={() => addBlock('header')} className="k-control-btn text-xs">
              + Section
            </button>
          </div>

          {includedVblogSlugs.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">vBlog articles in issue</div>
              {includedVblogSlugs.map((slug) => (
                <div key={slug} className="flex items-center justify-between gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <span className="truncate">{slug}</span>
                  <button type="button" onClick={() => removeVblogSlug(slug)} className="shrink-0 text-[10px] text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="space-y-4">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="group relative flex gap-4 rounded-xl border border-dashed border-zinc-200 p-4 transition-colors hover:border-[#02abb8]/50 dark:border-zinc-800"
              >
                <div className="min-w-0 flex-1">
                  {block.type === 'header' ? (
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, e.target.value)}
                      className="k-input text-xl font-black"
                      placeholder="Section title"
                    />
                  ) : (
                    <KxRichTextEditor
                      value={block.content}
                      onChange={(next) => updateBlock(block.id, next)}
                      minRows={8}
                      placeholder="Type your content..."
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="shrink-0 self-start p-2 text-zinc-400 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                  aria-label="Remove block"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <KxFormFieldLabel>Existing magazine</KxFormFieldLabel>
              <select
                value={existingMagazineId}
                onChange={(e) => setExistingMagazineId(e.target.value)}
                className="k-select"
              >
                <option value="">New magazine (use slug below)</option>
                {myMagazines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.slug})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <KxFormFieldLabel>Issue price (KAS)</KxFormFieldLabel>
              <input
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="k-input"
              />
            </div>
          </div>

          {!existingMagazineId ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <KxFormFieldLabel>Magazine slug</KxFormFieldLabel>
                <input
                  type="text"
                  value={magazineSlug}
                  onChange={(e) => setMagazineSlug(e.target.value)}
                  className="k-input font-mono text-sm"
                  placeholder="e.g. my-hub-zine"
                />
              </div>
              <div>
                <KxFormFieldLabel>Display name</KxFormFieldLabel>
                <input
                  type="text"
                  value={magazineDisplayName}
                  onChange={(e) => setMagazineDisplayName(e.target.value)}
                  className="k-input"
                  placeholder="Title shown on the hub"
                />
              </div>
            </div>
          ) : null}

          <VBlogSubmissionsPanel
            magazineId={targetMagazine?.id ?? null}
            issueNumber={targetIssueNumber}
            includedSlugs={includedVblogSlugs}
            onAddArticle={addVblogArticle}
            onRemoveSlug={removeVblogSlug}
          />
        </div>

        <div className={`${KX_FORM_PANEL} space-y-4`}>
          <DAppSectionHeader title="Revenue split" className="mb-0" />
          <div className="flex items-center justify-between gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
            <div className="text-xs font-bold text-cyan-700 dark:text-cyan-300">Kasparex treasury (%)</div>
            <input
              type="number"
              min={0}
              max={100}
              value={treasurySplit}
              onChange={(e) => setTreasurySplit(Number(e.target.value))}
              className="k-input w-20 text-right"
            />
          </div>
          {contributors.map((c, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
              <input
                type="text"
                placeholder="kaspa:… wallet"
                value={c.address}
                onChange={(e) => updateContributor(i, { address: e.target.value })}
                className="k-input font-mono text-xs"
              />
              <div className="flex items-center gap-2">
                <select
                  value={c.role}
                  onChange={(e) => updateContributor(i, { role: e.target.value as ContributorRole })}
                  className="k-select flex-1"
                >
                  <option>Author</option>
                  <option>Writer</option>
                  <option>Designer</option>
                  <option>Editor</option>
                </select>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={c.sharePercentage}
                  onChange={(e) => updateContributor(i, { sharePercentage: Number(e.target.value) })}
                  className="k-input w-20 text-right"
                />
                <span className="text-xs">%</span>
              </div>
            </div>
          ))}
          <button type="button" onClick={addContributor} className="w-full k-control-btn border-dashed">
            + Add contributor
          </button>
          <div className="flex items-center justify-between text-xs font-black">
            <span className="text-zinc-500">Total split</span>
            <span className={totalShare === 100 ? 'text-green-500' : 'text-red-500'}>{totalShare}%</span>
          </div>
        </div>

        <div id="magazines-dashboard-modules" className={`${KX_FORM_PANEL} my-2 scroll-mt-24 space-y-6 py-10 sm:py-12`}>
          <div className="space-y-2">
            <DAppSectionHeader title="Premium modules" className="mb-0" />
            <h4 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Optional premium features
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Toggle modules on to add them to your total. They activate when you pay and publish.
            </p>
          </div>

          <div className={KX_PREMIUM_MODULE_CARD}>
            <KxInFormPremiumRow
              flat
              accent="hub"
              title="Issue spotlight placement"
              description="Feature this issue in highlighted discovery placements."
              priceLabel={`+${MAGAZINE_PREMIUM_MODULE_FEE_KAS} KAS`}
              checked={spotlightEnabled}
              onToggle={() => setSpotlightEnabled((v) => !v)}
            />
            {spotlightEnabled ? (
              <div className="mt-5 border-t border-zinc-200 pt-5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                Spotlight settings expand inside this module container and feed the calculation breakdown.
              </div>
            ) : null}
          </div>

          <div className={KX_PREMIUM_MODULE_CARD}>
            <KxInFormPremiumRow
              flat
              accent="hub"
              title="Collectible cover metadata"
              description="Enable collectible-ready cover metadata in the issue payload."
              priceLabel={`+${MAGAZINE_PREMIUM_MODULE_FEE_KAS} KAS`}
              checked={collectibleCoverEnabled}
              onToggle={() => setCollectibleCoverEnabled((v) => !v)}
            />
            {collectibleCoverEnabled ? (
              <div className="mt-5 border-t border-zinc-200 pt-5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                Collectible metadata is configured inside this module and included in the publish total.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={KX_FORM_STICKY_RAIL}>
        <HubBenefitsPanel variant="panel" scope="magazines" />
        <aside className={KX_CALCULATION_ASIDE}>
          <HubListingCalculationBreakdown
            quote={formQuote}
            hubPoints={HUB_EARN_POINTS.magazineIssuePublish}
            footerNote="One Kaspa L1 payment anchors the issue metadata (IPFS CID) on-chain."
          />
          {publishNote ? (
            <p className="text-xs text-zinc-600 dark:text-zinc-400" role="status">
              {publishNote}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busyPublish || totalShare !== 100}
            className="hub-cta-btn w-full k-control-btn !text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busyPublish ? 'Publishing...' : `Publish Issue (${formQuote.totalKas} KAS)`}
          </button>
          <HubFlowProgress steps={getHubFlowPreset('hubPublish')} busy={busyPublish} />
        </aside>
      </div>
    </form>
  );
}
