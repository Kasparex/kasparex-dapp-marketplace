'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useChainId, useSwitchChain, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CrowdKASSidebar } from '@/components/donations/CrowdKASSidebar';
import { CrowdKASRightPanel } from '@/components/donations/CrowdKASRightPanel';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_ABI } from '@/lib/contracts/abis';
import { getIPFSClient } from '@/lib/ipfs/client';
import { VDONATIONS_MIN_VERIFY_WEI } from '@/lib/donations/config';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import { getErrorMessage } from '@/lib/utils';
import { getChainById } from '@/lib/wagmi';
import { CHAIN_IDS } from '@/lib/wagmi';
import { fetchCampaignMetadata } from '@/hooks/useDonationCampaign';
import type { Address } from 'viem';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { detectKaspaWallets, KASPA_WALLET_PROVIDERS } from '@/lib/kaspa/wallet';

const ZERO = '0x0000000000000000000000000000000000000000';

// readContract returns tuple: [creator, targetWei, deadline, raisedWei, donorCount, ipfsHash, l1Address, active]
type CampaignTuple = readonly [Address, bigint, bigint, bigint, bigint, string, string, boolean];

function parseCampaignTuple(data: unknown): { creator: Address; targetWei: bigint; deadline: bigint; raisedWei: bigint; donorCount: bigint; ipfsHash: string; l1Address: string; active: boolean } | null {
  const t = data as unknown as CampaignTuple | undefined;
  if (!t || t[0] === ZERO) return null;
  return { creator: t[0], targetWei: t[1], deadline: t[2], raisedWei: t[3], donorCount: t[4], ipfsHash: t[5], l1Address: t[6], active: t[7] };
}

const VDONATIONS_CHAIN_ID = CHAIN_IDS.IGRA_MAINNET; // 38833

export default function DonationsStudioPage() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const escrowAddress = getContractAddress(chainId, 'DonationEscrow');
  const currentChain = chainId ? getChainById(chainId) : null;
  const { state: kaspaState, connect: connectKaspa } = useKaspaWallet();
  const [isConnectingKaspa, setIsConnectingKaspa] = useState(false);

  const handleConnectKaspa = async (provider: 'kasware' | 'kastle') => {
    const detected = detectKaspaWallets();
    const installed = detected.some((w) => w.id === provider && w.isInstalled);
    if (!installed) {
      const url =
        provider === 'kasware'
          ? KASPA_WALLET_PROVIDERS.kasware.downloadUrl
          : KASPA_WALLET_PROVIDERS.kastle.documentationUrl;
      if (url) window.open(url, '_blank');
      return;
    }
    setIsConnectingKaspa(true);
    try {
      await connectKaspa(provider, { enableSIWK: true, siwkParams: { appName: 'Kasparex CrowdKAS' } });
    } finally {
      setIsConnectingKaspa(false);
    }
  };

  const { data: isVerified } = useReadContract({
    address: (escrowAddress || undefined) as Address | undefined,
    abi: DONATION_ESCROW_ABI,
    functionName: 'verified',
    args: address ? [address] : undefined,
  });

  const { data: campaignOnChain, refetch: refetchCampaign } = useReadContract({
    address: (escrowAddress || undefined) as Address | undefined,
    abi: DONATION_ESCROW_ABI,
    functionName: 'campaigns',
    args: address ? [address] : undefined,
  });

  const campaign = parseCampaignTuple(campaignOnChain);
  const hasCampaign = campaign !== null;

  const { writeContract, data: txHash, isPending: isTxPending, error: txError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  useEffect(() => {
    if (isTxSuccess && txHash) {
      refetchCampaign();
    }
  }, [isTxSuccess, txHash, refetchCampaign]);
  const isVerifyPending = isTxPending || isTxConfirming;
  const isCreatePending = isTxPending || isTxConfirming;
  const isClaimPending = isTxPending || isTxConfirming;
  const isUpdatePending = isTxPending || isTxConfirming;
  const verifyError = txError;
  const createError = txError;
  const claimError = txError;
  const updateError = txError;
  const [createForm, setCreateForm] = useState<DonationCampaignMetadata & { targetKAS: string; endDate: string }>({
    title: '',
    description: '',
    goals: [],
    socialLinks: {},
    l1KaspaAddress: '',
    targetKAS: '1000',
    endDate: '',
  });
  const [goalInput, setGoalInput] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createErrorMsg, setCreateErrorMsg] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<DonationCampaignMetadata & { targetKAS: string; endDate: string }>({
    title: '',
    description: '',
    goals: [],
    socialLinks: {},
    l1KaspaAddress: '',
    targetKAS: '1000',
    endDate: '',
  });
  const [editGoalInput, setEditGoalInput] = useState('');
  const [editLoadingMeta, setEditLoadingMeta] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const handleVerify = () => {
    if (!escrowAddress) return;
    writeContract({
      address: escrowAddress as Address,
      abi: DONATION_ESCROW_ABI,
      functionName: 'verify',
      value: VDONATIONS_MIN_VERIFY_WEI,
    });
  };

  const addGoal = () => {
    if (!goalInput.trim()) return;
    setCreateForm((f) => ({ ...f, goals: [...(f.goals || []), goalInput.trim()] }));
    setGoalInput('');
  };

  const removeGoal = (i: number) => {
    setCreateForm((f) => ({ ...f, goals: (f.goals || []).filter((_, j) => j !== i) }));
  };

  const handleCreateCampaign = async () => {
    if (!address || !escrowAddress || !createForm.title.trim() || !createForm.l1KaspaAddress?.trim()) {
      setCreateErrorMsg('Please fill title and L1 Kaspa address.');
      return;
    }
    const targetNum = parseFloat(createForm.targetKAS);
    if (isNaN(targetNum) || targetNum < 100) {
      setCreateErrorMsg('Target must be at least 100 iKAS.');
      return;
    }
    const endDate = new Date(createForm.endDate);
    if (isNaN(endDate.getTime()) || endDate.getTime() <= Date.now()) {
      setCreateErrorMsg('Please set a valid future end date.');
      return;
    }
    setCreateSubmitting(true);
    setCreateErrorMsg(null);
    try {
      const metadata: DonationCampaignMetadata = {
        title: createForm.title,
        description: createForm.description || '',
        goals: createForm.goals?.length ? createForm.goals : undefined,
        socialLinks: Object.keys(createForm.socialLinks || {}).length ? createForm.socialLinks : undefined,
        l1KaspaAddress: createForm.l1KaspaAddress.trim(),
      };
      const client = getIPFSClient();
      const ipfsHash = await client.uploadJSON(metadata as unknown as Record<string, unknown>);
      const targetWei = parseEther(createForm.targetKAS);
      const deadline = BigInt(Math.floor(endDate.getTime() / 1000));
      const l1Address = createForm.l1KaspaAddress.trim();
      writeContract({
        address: escrowAddress as Address,
        abi: DONATION_ESCROW_ABI,
        functionName: 'createCampaign',
        args: [ipfsHash, targetWei, deadline, l1Address],
      });
    } catch (e) {
      setCreateErrorMsg(getErrorMessage(e, 'Failed to create campaign'));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleClaim = () => {
    if (!escrowAddress) return;
    writeContract({
      address: escrowAddress as Address,
      abi: DONATION_ESCROW_ABI,
      functionName: 'claim',
    });
  };

  const loadEditForm = async () => {
    if (!campaign?.ipfsHash) return;
    setEditLoadingMeta(true);
    setEditErrorMsg(null);
    try {
      const meta = await fetchCampaignMetadata(campaign.ipfsHash);
      const endDate = campaign.deadline ? new Date(Number(campaign.deadline) * 1000).toISOString().slice(0, 16) : '';
      setEditForm({
        title: meta?.title ?? '',
        description: meta?.description ?? '',
        goals: meta?.goals ?? [],
        socialLinks: meta?.socialLinks ?? {},
        l1KaspaAddress: campaign.l1Address?.trim() ?? meta?.l1KaspaAddress ?? '',
        targetKAS: campaign.targetWei ? formatEther(campaign.targetWei) : '1000',
        endDate,
      });
      setShowEditForm(true);
    } catch (e) {
      setEditErrorMsg(getErrorMessage(e, 'Failed to load campaign data'));
    } finally {
      setEditLoadingMeta(false);
    }
  };

  const addEditGoal = () => {
    if (!editGoalInput.trim()) return;
    setEditForm((f) => ({ ...f, goals: [...(f.goals || []), editGoalInput.trim()] }));
    setEditGoalInput('');
  };

  const removeEditGoal = (i: number) => {
    setEditForm((f) => ({ ...f, goals: (f.goals || []).filter((_, j) => j !== i) }));
  };

  const handleUpdateCampaign = async () => {
    if (!address || !escrowAddress || !campaign) return;
    if (!editForm.title.trim() || !editForm.l1KaspaAddress?.trim()) {
      setEditErrorMsg('Please fill title and L1 Kaspa address.');
      return;
    }
    const targetNum = parseFloat(editForm.targetKAS);
    if (isNaN(targetNum) || targetNum < 100) {
      setEditErrorMsg('Target must be at least 100 iKAS.');
      return;
    }
    const endDate = new Date(editForm.endDate);
    if (isNaN(endDate.getTime()) || endDate.getTime() <= Date.now()) {
      setEditErrorMsg('Please set a valid future end date.');
      return;
    }
    setEditSubmitting(true);
    setEditErrorMsg(null);
    try {
      const metadata: DonationCampaignMetadata = {
        title: editForm.title,
        description: editForm.description || '',
        goals: editForm.goals?.length ? editForm.goals : undefined,
        socialLinks: Object.keys(editForm.socialLinks || {}).length ? editForm.socialLinks : undefined,
        l1KaspaAddress: editForm.l1KaspaAddress.trim(),
      };
      const client = getIPFSClient();
      const ipfsHash = await client.uploadJSON(metadata as unknown as Record<string, unknown>);
      const targetWei = parseEther(editForm.targetKAS);
      const deadline = BigInt(Math.floor(endDate.getTime() / 1000));
      const l1Address = editForm.l1KaspaAddress.trim();
      writeContract({
        address: escrowAddress as Address,
        abi: DONATION_ESCROW_ABI,
        functionName: 'updateCampaign',
        args: [ipfsHash, targetWei, deadline, l1Address],
      });
      setShowEditForm(false);
    } catch (e) {
      setEditErrorMsg(getErrorMessage(e, 'Failed to update campaign'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const targetReached = campaign && campaign.raisedWei >= campaign.targetWei;
  const deadlinePassed = campaign && BigInt(Math.floor(Date.now() / 1000)) >= campaign.deadline;
  const canClaim = campaign && targetReached && deadlinePassed;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row h-full">
          <CrowdKASSidebar
            kaspaAddress={kaspaState.address}
            kaspaConnected={kaspaState.isConnected}
            onConnectKaspa={(p) => void handleConnectKaspa(p)}
            isConnectingKaspa={isConnectingKaspa}
          />
          <div className="flex-1 min-w-0 p-4 sm:p-8 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 text-base sm:text-lg">
            <div className="max-w-6xl mx-auto">
              <div className="mb-10">
                <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Crowdfunding studio</p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
                  Crowd<span className="text-orange-500">KAS</span> Studio
                </h1>
                <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                  Verify your wallet and create or manage your crowdfunding campaign.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 xl:gap-10 items-start">
                <div className="space-y-8">
                  {!isConnected && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-10 text-center shadow-2xl shadow-orange-500/5">
                      <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-3">EVM Wallet Required</h2>
                      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto font-medium">
                        Connect your L2 (EVM) wallet to verify and manage your campaign.
                      </p>
                    </div>
                  )}

                  {isConnected && !escrowAddress && (
                    <div className="rounded-2xl border border-amber-200 dark:border-amber-800 p-5 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100 space-y-3">
                      <p className="font-semibold">
                        CrowdKAS runs on <strong>Igra Mainnet</strong>. You are currently on{' '}
                        <strong>{currentChain?.name ?? `chain ${chainId}`}</strong>.
                      </p>
                      <p className="text-sm">Switch your wallet to Igra Mainnet to verify and create campaigns.</p>
                      <button
                        type="button"
                        onClick={() => switchChain?.({ chainId: VDONATIONS_CHAIN_ID })}
                        disabled={isSwitchPending}
                        className="k-control-btn !bg-amber-600 hover:!bg-amber-700 !text-white !border-amber-500/30"
                      >
                        {isSwitchPending ? 'Switching…' : 'Switch to Igra Mainnet'}
                      </button>
                    </div>
                  )}

                  {isConnected && escrowAddress && (
                    <div className="space-y-8">
            {/* Verify */}
            <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Verify your wallet</h2>
              {isVerified ? (
                <p className="text-emerald-600 dark:text-emerald-400">Verified</p>
              ) : (
                <>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    Pay 1 wei to verify. Only verified wallets can create a campaign.
                  </p>
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifyPending}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isVerifyPending ? 'Confirming…' : 'Verify (1 wei)'}
                  </button>
                  {verifyError && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">{getErrorMessage(verifyError, 'Verify failed')}</p>
                  )}
                </>
              )}
            </section>

            {/* Create campaign (only if verified and no campaign) */}
            {isVerified && !hasCampaign && (
              <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Create campaign</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Title</label>
                    <input
                      type="text"
                      value={createForm.title}
                      onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      placeholder="Campaign title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      placeholder="What is this campaign for?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Goals (optional)</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={goalInput}
                        onChange={(e) => setGoalInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                        className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        placeholder="Add a goal"
                      />
                      <button type="button" onClick={addGoal} className="px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100">
                        Add
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {(createForm.goals || []).map((g, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-zinc-700 dark:text-zinc-300">{g}</span>
                          <button type="button" onClick={() => removeGoal(i)} className="text-red-600 dark:text-red-400 text-xs">
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">L1 Kaspa address (for direct KAS donations)</label>
                      {kaspaState.isConnected && kaspaState.address && (
                        <button
                          type="button"
                          onClick={() => setCreateForm((f) => ({ ...f, l1KaspaAddress: kaspaState.address || '' }))}
                          className="text-xs font-semibold text-[#02abb8] hover:underline"
                        >
                          Use connected wallet
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={createForm.l1KaspaAddress}
                      onChange={(e) => setCreateForm((f) => ({ ...f, l1KaspaAddress: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                      placeholder="kaspa:..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target (iKAS)</label>
                    <input
                      type="number"
                      value={createForm.targetKAS}
                      onChange={(e) => setCreateForm((f) => ({ ...f, targetKAS: e.target.value }))}
                      min="100"
                      step="1"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">End date</label>
                    <input
                      type="datetime-local"
                      value={createForm.endDate}
                      onChange={(e) => setCreateForm((f) => ({ ...f, endDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  {createErrorMsg && <p className="text-sm text-red-600 dark:text-red-400">{createErrorMsg}</p>}
                  {createError && <p className="text-sm text-red-600 dark:text-red-400">{getErrorMessage(createError, 'Create failed')}</p>}
                  <button
                    type="button"
                    onClick={handleCreateCampaign}
                    disabled={createSubmitting || isCreatePending}
                    className="w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {createSubmitting || isCreatePending ? 'Creating…' : 'Create campaign'}
                  </button>
                </div>
              </section>
            )}

            {/* My campaign */}
            {hasCampaign && campaign && (
              <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">My campaign</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">Raised</p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatEther(campaign.raisedWei)} iKAS</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">Target</p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatEther(campaign.targetWei)} iKAS</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">Donors</p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{campaign.donorCount.toString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">Ends</p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {new Date(Number(campaign.deadline) * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Link
                    href={`/donations/${address}`}
                    className="inline-block text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    View public page →
                  </Link>
                  <button
                    type="button"
                    onClick={loadEditForm}
                    disabled={editLoadingMeta}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                  >
                    {editLoadingMeta ? 'Loading…' : 'Edit campaign'}
                  </button>
                </div>
                {showEditForm && (
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 mb-4 bg-zinc-50 dark:bg-zinc-800/50">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Edit campaign</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Title</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Description</label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Goals</label>
                        <div className="flex gap-2 mb-1">
                          <input
                            type="text"
                            value={editGoalInput}
                            onChange={(e) => setEditGoalInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEditGoal())}
                            className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                            placeholder="Add goal"
                          />
                          <button type="button" onClick={addEditGoal} className="px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-sm">Add</button>
                        </div>
                        <ul className="space-y-1">
                          {(editForm.goals || []).map((g, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <span className="text-zinc-700 dark:text-zinc-300">{g}</span>
                              <button type="button" onClick={() => removeEditGoal(i)} className="text-red-600 dark:text-red-400 text-xs">Remove</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Social links (optional)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={editForm.socialLinks?.website ?? ''}
                            onChange={(e) => setEditForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, website: e.target.value || undefined } }))}
                            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                            placeholder="Website"
                          />
                          <input
                            type="text"
                            value={editForm.socialLinks?.twitter ?? ''}
                            onChange={(e) => setEditForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, twitter: e.target.value || undefined } }))}
                            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                            placeholder="Twitter"
                          />
                          <input
                            type="text"
                            value={editForm.socialLinks?.discord ?? ''}
                            onChange={(e) => setEditForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, discord: e.target.value || undefined } }))}
                            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                            placeholder="Discord"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">L1 Kaspa address</label>
                          {kaspaState.isConnected && kaspaState.address && (
                            <button
                              type="button"
                              onClick={() => setEditForm((f) => ({ ...f, l1KaspaAddress: kaspaState.address || '' }))}
                              className="text-[11px] font-semibold text-[#02abb8] hover:underline"
                            >
                              Use connected wallet
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={editForm.l1KaspaAddress}
                          onChange={(e) => setEditForm((f) => ({ ...f, l1KaspaAddress: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Target (iKAS)</label>
                          <input
                            type="number"
                            value={editForm.targetKAS}
                            onChange={(e) => setEditForm((f) => ({ ...f, targetKAS: e.target.value }))}
                            min="100"
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">End date</label>
                          <input
                            type="datetime-local"
                            value={editForm.endDate}
                            onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                          />
                        </div>
                      </div>
                      {editErrorMsg && <p className="text-sm text-red-600 dark:text-red-400">{editErrorMsg}</p>}
                      {updateError && <p className="text-sm text-red-600 dark:text-red-400">{getErrorMessage(updateError, 'Update failed')}</p>}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleUpdateCampaign}
                          disabled={editSubmitting || isUpdatePending}
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {editSubmitting || isUpdatePending ? 'Updating…' : 'Save changes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEditForm(false)}
                          className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {canClaim && (
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={handleClaim}
                      disabled={isClaimPending}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isClaimPending ? 'Claiming…' : 'Claim funds'}
                    </button>
                    {claimError && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">{getErrorMessage(claimError, 'Claim failed')}</p>
                    )}
                  </div>
                )}
              </section>
            )}
                    </div>
                  )}
                </div>

                <CrowdKASRightPanel requiredChainId={VDONATIONS_CHAIN_ID} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
