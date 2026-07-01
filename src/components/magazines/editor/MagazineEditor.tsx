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

interface EditorBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'header';
  content: string;
}

const MAGAZINE_LISTING_FEE_KAS = 50;
const MAGAZINE_TREASURY = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';

export function MagazineEditor() {
  const { state: kaspa } = useKaspaWallet();
  const { balance: krexBalance } = useKREXBalance();
  const { uploadJSON, isUploading } = useIPFSUpload();

  const [title, setTitle] = useState('New Magazine Issue');
  const [price, setPrice] = useState(10);
  const [treasurySplit, setTreasurySplit] = useState(5);
  const [magazineSlug, setMagazineSlug] = useState('');
  const [magazineDisplayName, setMagazineDisplayName] = useState('');
  const [existingMagazineId, setExistingMagazineId] = useState<string | ''>('');
  const [blocks, setBlocks] = useState<EditorBlock[]>([
    { id: '1', type: 'header', content: 'Genesis Section' },
    { id: '2', type: 'text', content: 'Start writing your collaborative masterpiece here.' },
  ]);
  const [contributors, setContributors] = useState<ContributorShare[]>([
    { address: '', role: 'Author', sharePercentage: 95 },
  ]);
  const [publishNote, setPublishNote] = useState<string | null>(null);
  const [includedVblogSlugs, setIncludedVblogSlugs] = useState<string[]>([]);

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
      content: type === 'header' ? 'New Section' : '',
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
    const newContributor: ContributorShare = {
      address: '',
      role: 'Writer',
      sharePercentage: 0,
    };
    setContributors((contributors) => [...contributors, newContributor]);
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
        .map((b) => b.content)
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
      sections: [
        ...vblogSectionsFromSlugs(includedVblogSlugs),
        ...blocksToSections(blocks),
      ],
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
        amount: String(kasToSompis(MAGAZINE_LISTING_FEE_KAS)),
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
    <div className="flex flex-col lg:flex-row gap-8 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
      <div className="flex-1 space-y-6">
        <div className="flex flex-col gap-4 mb-8 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-black bg-transparent border-none focus:ring-0 text-zinc-900 dark:text-zinc-100 p-0"
            placeholder="Issue title"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => addBlock('text')}
              className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-bold hover:bg-cyan-500 hover:text-white transition-all"
            >
              + Text
            </button>
            <button
              type="button"
              onClick={() => addBlock('header')}
              className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-bold hover:bg-cyan-500 hover:text-white transition-all"
            >
              + Section
            </button>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={busyPublish || totalShare !== 100}
              className={`ml-auto px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg ${
                busyPublish || totalShare !== 100
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-cyan-500/20'
              }`}
            >
              {busyPublish ? 'Publishing…' : `Publish (${MAGAZINE_LISTING_FEE_KAS} KAS + IPFS)`}
            </button>
          </div>
          {publishNote ? (
            <p className="text-xs text-zinc-600 dark:text-zinc-400" role="status">
              {publishNote}
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          {includedVblogSlugs.length > 0 ? (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">vBlog articles in issue</div>
              {includedVblogSlugs.map((slug) => (
                <div key={slug} className="flex items-center justify-between gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <span className="truncate">{slug}</span>
                  <button type="button" onClick={() => removeVblogSlug(slug)} className="text-red-500 text-[10px] hover:underline shrink-0">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {blocks.map((block) => (
            <div
              key={block.id}
              className="group relative flex gap-4 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex-1">
                {block.type === 'header' ? (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    className="w-full text-xl font-black bg-transparent border-none focus:ring-0 text-zinc-900 dark:text-zinc-100"
                    placeholder="Section title"
                  />
                ) : (
                  <textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    className="w-full min-h-[100px] bg-transparent border-none focus:ring-0 text-zinc-600 dark:text-zinc-400 resize-none leading-relaxed"
                    placeholder="Type your content…"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                className="opacity-0 group-hover:opacity-100 px-2 text-zinc-400 hover:text-red-500 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-8 border-l border-zinc-100 dark:border-zinc-800 lg:pl-8">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Publication</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Existing magazine</label>
              <select
                value={existingMagazineId}
                onChange={(e) => setExistingMagazineId(e.target.value)}
                className="w-full text-xs font-bold bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-2"
              >
                <option value="">New magazine (use slug below)</option>
                {myMagazines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.slug})
                  </option>
                ))}
              </select>
            </div>
            {!existingMagazineId ? (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Magazine slug (URL key)</label>
                  <input
                    type="text"
                    value={magazineSlug}
                    onChange={(e) => setMagazineSlug(e.target.value)}
                    className="w-full text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-2"
                    placeholder="e.g. my-hub-zine"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Display name</label>
                  <input
                    type="text"
                    value={magazineDisplayName}
                    onChange={(e) => setMagazineDisplayName(e.target.value)}
                    className="w-full text-xs font-bold bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-2"
                    placeholder="Title shown on the hub"
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>

        <VBlogSubmissionsPanel
          magazineId={targetMagazine?.id ?? null}
          issueNumber={targetIssueNumber}
          includedSlugs={includedVblogSlugs}
          onAddArticle={addVblogArticle}
          onRemoveSlug={removeVblogSlug}
        />

        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Pricing & Access</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Issue price (KAS)</label>
              <input
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-bold"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Revenue split</h3>
          <div className="space-y-3">
            <div className="p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/20 flex items-center justify-between gap-2">
              <div className="text-[10px] font-bold text-cyan-600">Kasparex treasury (%)</div>
              <input
                type="number"
                min={0}
                max={100}
                value={treasurySplit}
                onChange={(e) => setTreasurySplit(Number(e.target.value))}
                className="w-14 text-[10px] font-black border border-cyan-500/40 rounded px-1 py-1 text-right bg-white dark:bg-zinc-950"
              />
            </div>

            {contributors.map((c, i) => (
              <div key={i} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                <input
                  type="text"
                  placeholder="kaspa:… wallet"
                  value={c.address}
                  onChange={(e) => updateContributor(i, { address: e.target.value })}
                  className="w-full text-[10px] font-mono bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={c.role}
                    onChange={(e) => updateContributor(i, { role: e.target.value as ContributorRole })}
                    className="flex-1 text-[10px] font-bold bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1"
                  >
                    <option>Author</option>
                    <option>Writer</option>
                    <option>Designer</option>
                    <option>Editor</option>
                  </select>
                  <div className="flex items-center gap-1 w-16">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={c.sharePercentage}
                      onChange={(e) => updateContributor(i, { sharePercentage: Number(e.target.value) })}
                      className="w-full text-[10px] font-bold bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-right"
                    />
                    <span className="text-[10px]">%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addContributor}
            className="w-full mt-4 py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-500 hover:border-cyan-500 hover:text-cyan-500 transition-all"
          >
            + Add contributor
          </button>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-zinc-500">Total split</span>
              <span className={totalShare === 100 ? 'text-green-500' : 'text-red-500'}>{totalShare}%</span>
            </div>
            {totalShare !== 100 ? (
              <p className="text-[9px] text-red-400 mt-1">Total split must equal 100%.</p>
            ) : null}
          </div>
        </div>

        <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Pin + bind</h4>
          <p className="text-[10px] text-zinc-500 leading-normal">
            Issue metadata is pinned to IPFS, then anchored with a Kaspa L1 treasury payment carrying a compact binding note.
            Matches the Kasparex store listing fee treasury by default so operators only configure one payouts address.
          </p>
        </div>
      </div>
    </div>
  );
}
