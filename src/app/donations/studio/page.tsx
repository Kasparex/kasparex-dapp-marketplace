'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAccount, useChainId, useSwitchChain, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DonationsSidebar } from '@/components/donations/DonationsSidebar';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_ABI, DONATION_ESCROW_V2_ABI } from '@/lib/contracts/abis';
import { getIPFSClient } from '@/lib/ipfs/client';
import { VDONATIONS_MIN_VERIFY_WEI } from '@/lib/donations/config';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import { getErrorMessage } from '@/lib/utils';
import { getChainById } from '@/lib/wagmi';
import { CHAIN_IDS } from '@/lib/wagmi';
import { fetchCampaignMetadata } from '@/hooks/useDonationCampaign';
import { totalDonorCount, totalRaisedWei } from '@/lib/donations/totals';
import type { Address } from 'viem';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { DONATION_CATEGORIES, isDonationCategory, normalizeTags } from '@/lib/donations/categories';
import { useMyDonationCampaignsV2 } from '@/hooks/useMyDonationCampaigns';
import { DONATION_MODULE_IDS } from '@/lib/donations/modules';

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
  /** CrowdKAS escrow on Igra Mainnet - used for all reads so studio state works even when the wallet is on another chain. */
  const igraEscrowAddress = getContractAddress(VDONATIONS_CHAIN_ID, 'DonationEscrow');
  const writeEscrowAddress = getContractAddress(chainId, 'DonationEscrow');
  /** CrowdKAS V2 escrow on Igra Mainnet - multi-campaign + explicit donation method. */
  const igraEscrowV2Address = getContractAddress(VDONATIONS_CHAIN_ID, 'DonationEscrowV2');
  const writeEscrowV2Address = getContractAddress(chainId, 'DonationEscrowV2');
  const currentChain = chainId ? getChainById(chainId) : null;
  const { state: kaspaState } = useKaspaWallet();

  const onRequiredChain = chainId === VDONATIONS_CHAIN_ID;
  const hasEscrowConfigured = Boolean(igraEscrowAddress);
  const hasEscrowV2Configured = Boolean(igraEscrowV2Address);
  const showWrongChainNudge = isConnected && !onRequiredChain;
  const showMissingConfigNudge = isConnected && onRequiredChain && !writeEscrowAddress;
  const showMissingV2ConfigNudge = isConnected && onRequiredChain && hasEscrowV2Configured && !writeEscrowV2Address;

  const { data: isVerifiedV2, refetch: refetchVerifiedV2 } = useReadContract({
    chainId: VDONATIONS_CHAIN_ID,
    address: (igraEscrowV2Address || undefined) as Address | undefined,
    abi: DONATION_ESCROW_V2_ABI,
    functionName: 'verified',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && igraEscrowV2Address) },
  });

  const {
    campaigns: myCampaignsV2,
    isLoading: myCampaignsV2Loading,
    error: myCampaignsV2Error,
    refetch: refetchMyCampaignsV2,
  } = useMyDonationCampaignsV2(address as Address | undefined);

  const moduleUnlockReads = useMemo(() => {
    if (!igraEscrowV2Address || myCampaignsV2.length === 0) return [];
    const addr = igraEscrowV2Address as Address;
    const fe = DONATION_MODULE_IDS.featured;
    const l1 = DONATION_MODULE_IDS.l1Tips;
    return myCampaignsV2.flatMap((c) => [
      {
        chainId: VDONATIONS_CHAIN_ID,
        address: addr,
        abi: DONATION_ESCROW_V2_ABI,
        functionName: 'moduleUnlocked' as const,
        args: [c.campaignId, fe] as const,
      },
      {
        chainId: VDONATIONS_CHAIN_ID,
        address: addr,
        abi: DONATION_ESCROW_V2_ABI,
        functionName: 'moduleUnlocked' as const,
        args: [c.campaignId, l1] as const,
      },
    ]);
  }, [myCampaignsV2, igraEscrowV2Address]);

  const { data: moduleUnlockResults, refetch: refetchModuleUnlocks } = useReadContracts({
    contracts: moduleUnlockReads,
    allowFailure: true,
    query: { enabled: moduleUnlockReads.length > 0 },
  });

  const unlockByCampaignId = useMemo(() => {
    const m = new Map<string, { featured: boolean; l1Tips: boolean }>();
    if (!moduleUnlockResults?.length || !myCampaignsV2.length) return m;
    myCampaignsV2.forEach((c, i) => {
      const fr = moduleUnlockResults[i * 2];
      const l1r = moduleUnlockResults[i * 2 + 1];
      m.set(c.campaignId.toString(), {
        featured: fr?.status === 'success' && Boolean(fr.result),
        l1Tips: l1r?.status === 'success' && Boolean(l1r.result),
      });
    });
    return m;
  }, [moduleUnlockResults, myCampaignsV2]);

  const { data: isVerified, refetch: refetchVerified } = useReadContract({
    chainId: VDONATIONS_CHAIN_ID,
    address: (igraEscrowAddress || undefined) as Address | undefined,
    abi: DONATION_ESCROW_ABI,
    functionName: 'verified',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && igraEscrowAddress) },
  });

  const { data: campaignOnChain, refetch: refetchCampaign } = useReadContract({
    chainId: VDONATIONS_CHAIN_ID,
    address: (igraEscrowAddress || undefined) as Address | undefined,
    abi: DONATION_ESCROW_ABI,
    functionName: 'campaigns',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && igraEscrowAddress) },
  });

  const { data: l1RecordedTotalWeiData, refetch: refetchL1Total } = useReadContract({
    chainId: VDONATIONS_CHAIN_ID,
    address: (igraEscrowAddress || undefined) as Address | undefined,
    abi: DONATION_ESCROW_ABI,
    functionName: 'l1RecordedTotalWei',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && igraEscrowAddress) },
  });

  const { data: l1RecordedDonationCountData, refetch: refetchL1Count } = useReadContract({
    chainId: VDONATIONS_CHAIN_ID,
    address: (igraEscrowAddress || undefined) as Address | undefined,
    abi: DONATION_ESCROW_ABI,
    functionName: 'l1RecordedDonationCount',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && igraEscrowAddress) },
  });

  const campaign = parseCampaignTuple(campaignOnChain);
  const hasCampaign = campaign !== null;

  const { writeContract, data: txHash, isPending: isTxPending, error: txError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const isVerifyPending = isTxPending || isTxConfirming;
  const isCreatePending = isTxPending || isTxConfirming;
  const isClaimPending = isTxPending || isTxConfirming;
  const isUpdatePending = isTxPending || isTxConfirming;
  const verifyError = txError;
  const createError = txError;
  const claimError = txError;
  const updateError = txError;
  type FeaturedImageMode = 'url' | 'ipfs';
  type StudioCampaignForm = DonationCampaignMetadata & {
    targetKAS: string;
    endDate: string;
    featuredImageMode: FeaturedImageMode;
    featuredImageValue: string;
    l1TipGiftEnabled: boolean;
    l1TipGiftType: 'text' | 'url' | 'ipfs';
    l1TipGiftLabel: string;
    l1TipGiftValue: string;
  };

  const [createForm, setCreateForm] = useState<StudioCampaignForm>({
    title: '',
    description: '',
    category: undefined,
    tags: [],
    goals: [],
    socialLinks: {},
    l1KaspaAddress: '',
    targetKAS: '1000',
    endDate: '',
    featuredImageMode: 'ipfs',
    featuredImageValue: '',
    l1TipGiftEnabled: false,
    l1TipGiftType: 'text',
    l1TipGiftLabel: '',
    l1TipGiftValue: '',
  });
  const [goalInput, setGoalInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createErrorMsg, setCreateErrorMsg] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<StudioCampaignForm>({
    title: '',
    description: '',
    category: undefined,
    tags: [],
    goals: [],
    socialLinks: {},
    l1KaspaAddress: '',
    targetKAS: '1000',
    endDate: '',
    featuredImageMode: 'ipfs',
    featuredImageValue: '',
    l1TipGiftEnabled: false,
    l1TipGiftType: 'text',
    l1TipGiftLabel: '',
    l1TipGiftValue: '',
  });
  const [editGoalInput, setEditGoalInput] = useState('');
  const [editTagInput, setEditTagInput] = useState('');
  const [editingV2CampaignId, setEditingV2CampaignId] = useState<bigint | null>(null);
  const [editLoadingMeta, setEditLoadingMeta] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteCampaignId, setDeleteCampaignId] = useState<bigint | null>(null);

  const l1TipsUnlockedV2 =
    editingV2CampaignId != null ? (unlockByCampaignId.get(editingV2CampaignId.toString())?.l1Tips ?? false) : false;

  useEffect(() => {
    if (isTxSuccess && txHash) {
      void refetchCampaign();
      void refetchL1Total();
      void refetchL1Count();
      void refetchVerified();
      void refetchVerifiedV2();
      void refetchMyCampaignsV2();
      void refetchModuleUnlocks();
    }
  }, [
    isTxSuccess,
    txHash,
    refetchCampaign,
    refetchL1Total,
    refetchL1Count,
    refetchVerified,
    refetchVerifiedV2,
    refetchMyCampaignsV2,
    refetchModuleUnlocks,
  ]);

  const handleVerify = () => {
    if (!writeEscrowAddress) return;
    writeContract({
      address: writeEscrowAddress as Address,
      abi: DONATION_ESCROW_ABI,
      functionName: 'verify',
      value: VDONATIONS_MIN_VERIFY_WEI,
    });
  };

  const handleVerifyV2 = () => {
    if (!writeEscrowV2Address) return;
    writeContract({
      address: writeEscrowV2Address as Address,
      abi: DONATION_ESCROW_V2_ABI,
      functionName: 'verify',
      value: VDONATIONS_MIN_VERIFY_WEI,
    });
  };

  const addGoal = () => {
    if (!goalInput.trim()) return;
    setCreateForm((f) => ({ ...f, goals: [...(f.goals || []), goalInput.trim()] }));
    setGoalInput('');
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    const next = normalizeTags([...(createForm.tags ?? []), tagInput]);
    setCreateForm((f) => ({ ...f, tags: next }));
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setCreateForm((f) => ({ ...f, tags: (f.tags ?? []).filter((t) => t !== tag) }));
  };

  const removeGoal = (i: number) => {
    setCreateForm((f) => ({ ...f, goals: (f.goals || []).filter((_, j) => j !== i) }));
  };

  const handleCreateCampaignV2 = async () => {
    if (!address || !writeEscrowV2Address || !createForm.title.trim()) {
      setCreateErrorMsg('Please fill title.');
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
      const featuredImageMode = createForm.featuredImageMode;
      const featuredImageValue = createForm.featuredImageValue.trim();
      const category = createForm.category && isDonationCategory(createForm.category) ? createForm.category : undefined;
      const tags = normalizeTags(createForm.tags ?? []);

      const metadata: DonationCampaignMetadata = {
        title: createForm.title,
        description: createForm.description || '',
        category,
        tags: tags.length ? tags : undefined,
        goals: createForm.goals?.length ? createForm.goals : undefined,
        socialLinks: Object.keys(createForm.socialLinks || {}).length ? createForm.socialLinks : undefined,
        imageUrl: featuredImageMode === 'url' && featuredImageValue ? featuredImageValue : undefined,
        imageHash: featuredImageMode === 'ipfs' && featuredImageValue ? featuredImageValue : undefined,
      };
      const client = getIPFSClient();
      const ipfsHash = await client.uploadJSON(metadata as unknown as Record<string, unknown>);
      const targetWei = parseEther(createForm.targetKAS);
      const deadline = BigInt(Math.floor(endDate.getTime() / 1000));
      const method = 0 as const;
      const l1Address = '';

      writeContract({
        address: writeEscrowV2Address as Address,
        abi: DONATION_ESCROW_V2_ABI,
        functionName: 'createCampaign',
        args: [method, ipfsHash, targetWei, deadline, l1Address],
      });
    } catch (e) {
      setCreateErrorMsg(getErrorMessage(e, 'Failed to create campaign'));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!address || !writeEscrowAddress || !createForm.title.trim() || !createForm.l1KaspaAddress?.trim()) {
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
      const featuredImageMode = createForm.featuredImageMode;
      const featuredImageValue = createForm.featuredImageValue.trim();
      const category = createForm.category && isDonationCategory(createForm.category) ? createForm.category : undefined;
      const tags = normalizeTags(createForm.tags ?? []);

      const metadata: DonationCampaignMetadata = {
        title: createForm.title,
        description: createForm.description || '',
        category,
        tags: tags.length ? tags : undefined,
        goals: createForm.goals?.length ? createForm.goals : undefined,
        socialLinks: Object.keys(createForm.socialLinks || {}).length ? createForm.socialLinks : undefined,
        l1KaspaAddress: createForm.l1KaspaAddress.trim(),
        imageUrl: featuredImageMode === 'url' && featuredImageValue ? featuredImageValue : undefined,
        imageHash: featuredImageMode === 'ipfs' && featuredImageValue ? featuredImageValue : undefined,
      };
      const client = getIPFSClient();
      const ipfsHash = await client.uploadJSON(metadata as unknown as Record<string, unknown>);
      const targetWei = parseEther(createForm.targetKAS);
      const deadline = BigInt(Math.floor(endDate.getTime() / 1000));
      const l1Address = createForm.l1KaspaAddress.trim();
      writeContract({
        address: writeEscrowAddress as Address,
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
    if (!writeEscrowAddress) return;
    writeContract({
      address: writeEscrowAddress as Address,
      abi: DONATION_ESCROW_ABI,
      functionName: 'claim',
    });
  };

  const handleClaimV2 = (campaignId: bigint) => {
    if (!writeEscrowV2Address) return;
    writeContract({
      address: writeEscrowV2Address as Address,
      abi: DONATION_ESCROW_V2_ABI,
      functionName: 'claim',
      args: [campaignId],
    });
  };

  const confirmDeleteCampaign = () => {
    if (!writeEscrowV2Address || deleteCampaignId == null) return;
    writeContract({
      address: writeEscrowV2Address as Address,
      abi: DONATION_ESCROW_V2_ABI,
      functionName: 'cancelCampaign',
      args: [deleteCampaignId],
    });
    setDeleteCampaignId(null);
  };

  const loadEditFormV2 = async (campaignId: bigint, ipfsHash: string, l1Address: string, targetWei: bigint, deadline: bigint) => {
    if (!ipfsHash) return;
    setEditingV2CampaignId(campaignId);
    setEditLoadingMeta(true);
    setEditErrorMsg(null);
    try {
      const meta = await fetchCampaignMetadata(ipfsHash);
      const endDate = deadline ? new Date(Number(deadline) * 1000).toISOString().slice(0, 16) : '';
      const featuredImageMode: FeaturedImageMode = meta?.imageUrl ? 'url' : 'ipfs';
      const featuredImageValue = (meta?.imageUrl || meta?.imageHash || '').trim();
      const g = meta?.l1TipGift;
      setEditForm({
        title: meta?.title ?? '',
        description: meta?.description ?? '',
        category: meta?.category && isDonationCategory(meta.category) ? meta.category : undefined,
        tags: normalizeTags(meta?.tags ?? []),
        goals: meta?.goals ?? [],
        socialLinks: meta?.socialLinks ?? {},
        l1KaspaAddress: l1Address?.trim() ?? meta?.l1KaspaAddress ?? '',
        targetKAS: targetWei ? formatEther(targetWei) : '1000',
        endDate,
        featuredImageMode,
        featuredImageValue,
        l1TipGiftEnabled: Boolean(g?.enabled && g?.value?.trim()),
        l1TipGiftType: g?.type ?? 'text',
        l1TipGiftLabel: g?.label ?? '',
        l1TipGiftValue: g?.value ?? '',
      });
      setShowEditForm(true);
    } catch (e) {
      setEditErrorMsg(getErrorMessage(e, 'Failed to load campaign data'));
    } finally {
      setEditLoadingMeta(false);
    }
  };

  const loadEditForm = async () => {
    if (!campaign?.ipfsHash) return;
    setEditLoadingMeta(true);
    setEditErrorMsg(null);
    try {
      const meta = await fetchCampaignMetadata(campaign.ipfsHash);
      const endDate = campaign.deadline ? new Date(Number(campaign.deadline) * 1000).toISOString().slice(0, 16) : '';
      const featuredImageMode: FeaturedImageMode = meta?.imageUrl ? 'url' : 'ipfs';
      const featuredImageValue = (meta?.imageUrl || meta?.imageHash || '').trim();
      const g1 = meta?.l1TipGift;
      setEditForm({
        title: meta?.title ?? '',
        description: meta?.description ?? '',
        category: meta?.category && isDonationCategory(meta.category) ? meta.category : undefined,
        tags: normalizeTags(meta?.tags ?? []),
        goals: meta?.goals ?? [],
        socialLinks: meta?.socialLinks ?? {},
        l1KaspaAddress: campaign.l1Address?.trim() ?? meta?.l1KaspaAddress ?? '',
        targetKAS: campaign.targetWei ? formatEther(campaign.targetWei) : '1000',
        endDate,
        featuredImageMode,
        featuredImageValue,
        l1TipGiftEnabled: Boolean(g1?.enabled && g1?.value?.trim()),
        l1TipGiftType: g1?.type ?? 'text',
        l1TipGiftLabel: g1?.label ?? '',
        l1TipGiftValue: g1?.value ?? '',
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

  const addEditTag = () => {
    if (!editTagInput.trim()) return;
    const next = normalizeTags([...(editForm.tags ?? []), editTagInput]);
    setEditForm((f) => ({ ...f, tags: next }));
    setEditTagInput('');
  };

  const removeEditTag = (tag: string) => {
    setEditForm((f) => ({ ...f, tags: (f.tags ?? []).filter((t) => t !== tag) }));
  };

  const removeEditGoal = (i: number) => {
    setEditForm((f) => ({ ...f, goals: (f.goals || []).filter((_, j) => j !== i) }));
  };

  const handleUpdateCampaignV2 = async () => {
    if (!address || !writeEscrowV2Address || editingV2CampaignId == null) return;
    if (!editForm.title.trim()) {
      setEditErrorMsg('Please fill title.');
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
      const featuredImageMode = editForm.featuredImageMode;
      const featuredImageValue = editForm.featuredImageValue.trim();
      const category = editForm.category && isDonationCategory(editForm.category) ? editForm.category : undefined;
      const tags = normalizeTags(editForm.tags ?? []);
      const l1TipsOn = Boolean(l1TipsUnlockedV2);
      const l1OnChain = l1TipsOn && editForm.l1KaspaAddress?.trim() ? editForm.l1KaspaAddress.trim() : '';
      const l1Gift =
        l1TipsOn && editForm.l1TipGiftEnabled && editForm.l1TipGiftValue.trim()
          ? {
              enabled: true as const,
              type: editForm.l1TipGiftType,
              label: editForm.l1TipGiftLabel.trim() || undefined,
              value: editForm.l1TipGiftValue.trim(),
            }
          : { enabled: false as const };
      const metadata: DonationCampaignMetadata = {
        title: editForm.title,
        description: editForm.description || '',
        category,
        tags: tags.length ? tags : undefined,
        goals: editForm.goals?.length ? editForm.goals : undefined,
        socialLinks: Object.keys(editForm.socialLinks || {}).length ? editForm.socialLinks : undefined,
        l1KaspaAddress: l1OnChain || undefined,
        imageUrl: featuredImageMode === 'url' && featuredImageValue ? featuredImageValue : undefined,
        imageHash: featuredImageMode === 'ipfs' && featuredImageValue ? featuredImageValue : undefined,
        l1TipGift: l1Gift,
      };
      const client = getIPFSClient();
      const ipfsHash = await client.uploadJSON(metadata as unknown as Record<string, unknown>);
      const targetWei = parseEther(editForm.targetKAS);
      const deadline = BigInt(Math.floor(endDate.getTime() / 1000));
      const l1Address = l1OnChain;

      writeContract({
        address: writeEscrowV2Address as Address,
        abi: DONATION_ESCROW_V2_ABI,
        functionName: 'updateCampaign',
        args: [editingV2CampaignId, ipfsHash, targetWei, deadline, l1Address],
      });
      setShowEditForm(false);
      setEditingV2CampaignId(null);
    } catch (e) {
      setEditErrorMsg(getErrorMessage(e, 'Failed to update campaign'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleUpdateCampaign = async () => {
    if (!address || !writeEscrowAddress || !campaign) return;
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
      const featuredImageMode = editForm.featuredImageMode;
      const featuredImageValue = editForm.featuredImageValue.trim();
      const category = editForm.category && isDonationCategory(editForm.category) ? editForm.category : undefined;
      const tags = normalizeTags(editForm.tags ?? []);
      const metadata: DonationCampaignMetadata = {
        title: editForm.title,
        description: editForm.description || '',
        category,
        tags: tags.length ? tags : undefined,
        goals: editForm.goals?.length ? editForm.goals : undefined,
        socialLinks: Object.keys(editForm.socialLinks || {}).length ? editForm.socialLinks : undefined,
        l1KaspaAddress: editForm.l1KaspaAddress.trim(),
        imageUrl: featuredImageMode === 'url' && featuredImageValue ? featuredImageValue : undefined,
        imageHash: featuredImageMode === 'ipfs' && featuredImageValue ? featuredImageValue : undefined,
      };
      const client = getIPFSClient();
      const ipfsHash = await client.uploadJSON(metadata as unknown as Record<string, unknown>);
      const targetWei = parseEther(editForm.targetKAS);
      const deadline = BigInt(Math.floor(endDate.getTime() / 1000));
      const l1Address = editForm.l1KaspaAddress.trim();
      writeContract({
        address: writeEscrowAddress as Address,
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

  const l1RecordedTotalWei = typeof l1RecordedTotalWeiData === 'bigint' ? l1RecordedTotalWeiData : 0n;
  const l1RecordedDonationCount = typeof l1RecordedDonationCountData === 'bigint' ? l1RecordedDonationCountData : 0n;
  const studioTotals =
    campaign != null
      ? {
          raisedWei: campaign.raisedWei,
          donorCount: campaign.donorCount,
          l1RecordedTotalWei,
          l1RecordedDonationCount,
        }
      : null;
  const targetReached =
    studioTotals != null && campaign != null && totalRaisedWei(studioTotals) >= campaign.targetWei;
  const deadlinePassed = campaign && BigInt(Math.floor(Date.now() / 1000)) >= campaign.deadline;
  const canClaim = campaign && targetReached && deadlinePassed;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      {deleteCampaignId != null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-campaign-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close dialog"
            onClick={() => setDeleteCampaignId(null)}
          />
          <div className="relative z-[1] max-w-md w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <h3 id="delete-campaign-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Delete this campaign?
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3">
              This action is <strong className="text-red-700 dark:text-red-400">irreversible</strong>. On-chain campaign #
              {deleteCampaignId.toString()} will be cancelled and will no longer appear in your studio list. You can only delete
              campaigns that have received no donations and have no recorded L1 activity.
            </p>
            <div className="flex flex-wrap justify-end gap-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium"
                onClick={() => setDeleteCampaignId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                onClick={confirmDeleteCampaign}
                disabled={!writeEscrowV2Address}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="hidden lg:block flex-shrink-0">
            <DonationsSidebar variant="minimal" backLink={{ href: '/donations', label: 'All campaigns' }} />
          </div>
          <div className="lg:hidden flex-shrink-0">
            <DonationsSidebar variant="minimal" backLink={{ href: '/donations', label: 'All campaigns' }} />
          </div>

          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:px-8 lg:py-8">
            <Link href="/donations" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline mb-4 inline-block">
              ← All campaigns
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-start">
              <div className="lg:col-span-3 space-y-6">
                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8">
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">
                      CrowdKAS Studio
                    </p>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                      Create and manage your campaign
                    </h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      Your EVM wallet is used for on-chain actions. Your Kaspa L1 wallet (optional) helps fill your L1 donation address.
                    </p>
                  </div>

                  {!isConnected && (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 text-center text-zinc-500 dark:text-zinc-400">
                      Connect your L2 (EVM) wallet to continue.
                    </div>
                  )}

                  {showWrongChainNudge && (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800 p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100 space-y-3">
                      <p>
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

                  {showMissingConfigNudge && (
                    <div className="rounded-xl border border-red-200 dark:border-red-800 p-4 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100 space-y-2">
                      <p className="font-semibold">CrowdKAS contracts are not configured for Igra Mainnet yet.</p>
                      <p className="text-sm">
                        You are on <strong>Igra Mainnet</strong>, but `DonationEscrow` address is missing for chain {VDONATIONS_CHAIN_ID}.
                        Set `NEXT_PUBLIC_DONATION_ESCROW_ADDRESS_IGRA_MAINNET` (or `NEXT_PUBLIC_DONATION_ESCROW_ADDRESS_38833`) in Vercel and redeploy.
                      </p>
                    </div>
                  )}

                  {showMissingV2ConfigNudge && (
                    <div className="rounded-xl border border-red-200 dark:border-red-800 p-4 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100 space-y-2">
                      <p className="font-semibold">CrowdKAS V2 contracts are not configured for Igra Mainnet yet.</p>
                      <p className="text-sm">
                        You are on <strong>Igra Mainnet</strong>, but `DonationEscrowV2` address is missing for chain {VDONATIONS_CHAIN_ID}.
                        Set `NEXT_PUBLIC_DONATION_ESCROW_V2_ADDRESS_IGRA_MAINNET` (or `NEXT_PUBLIC_DONATION_ESCROW_V2_ADDRESS_38833`) in Vercel and redeploy.
                      </p>
                    </div>
                  )}

                  {isConnected && onRequiredChain && (writeEscrowV2Address || writeEscrowAddress) && (
                    <div className="space-y-8">
                      {/* CrowdKAS V2 */}
                      {writeEscrowV2Address && hasEscrowV2Configured && (
                        <>
                          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Verify your wallet (V2)</h2>
                            {isVerifiedV2 ? (
                              <p className="text-emerald-600 dark:text-emerald-400">Verified</p>
                            ) : (
                              <>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                  Pay 1 wei to verify. Only verified wallets can create campaigns.
                                </p>
                                <button
                                  type="button"
                                  onClick={handleVerifyV2}
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

                          {isVerifiedV2 && (
                            <section id="create" className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900 scroll-mt-24">
                              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Create campaign (V2)</h2>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                New campaigns use <strong>L2 escrow</strong> on Igra for the funding goal. Optional Kaspa L1 tips (separate from the goal) can be added later in edit after you unlock the L1 tip jar module.
                              </p>
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
                                  <div className="flex items-center justify-between gap-3 mb-2">
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Cover image</label>
                                    <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                                      <button
                                        type="button"
                                        onClick={() => setCreateForm((f) => ({ ...f, featuredImageMode: 'url' }))}
                                        className={`px-3 py-1.5 text-xs font-bold ${createForm.featuredImageMode === 'url' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
                                      >
                                        URL
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setCreateForm((f) => ({ ...f, featuredImageMode: 'ipfs' }))}
                                        className={`px-3 py-1.5 text-xs font-bold ${createForm.featuredImageMode === 'ipfs' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
                                      >
                                        IPFS
                                      </button>
                                    </div>
                                  </div>
                                  <ImageUpload
                                    label=""
                                    value={createForm.featuredImageValue}
                                    onChange={(v) => setCreateForm((f) => ({ ...f, featuredImageValue: v }))}
                                    onFileSelect={async (file) => {
                                      const client = getIPFSClient();
                                      return await client.uploadFile(file, { filename: (file as File).name });
                                    }}
                                    placeholder={createForm.featuredImageMode === 'url' ? 'https://…' : 'CID (or upload a file)'}
                                    aspectRatio="video"
                                    showUrlInput={true}
                                    showFileUpload={createForm.featuredImageMode === 'ipfs'}
                                  />
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                                    URL is fastest. IPFS keeps your campaign image permanent (recommended).
                                  </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                                    <select
                                      value={createForm.category ?? ''}
                                      onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value ? e.target.value : undefined }))}
                                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                    >
                                      <option value="">Select category…</option>
                                      {DONATION_CATEGORIES.map((c) => (
                                        <option key={c} value={c}>
                                          {c}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tags (optional)</label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                        placeholder="e.g. wallet, nft, open-source"
                                      />
                                      <button
                                        type="button"
                                        onClick={addTag}
                                        className="px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                                      >
                                        Add
                                      </button>
                                    </div>
                                    {(createForm.tags ?? []).length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {(createForm.tags ?? []).map((t) => (
                                          <button
                                            key={t}
                                            type="button"
                                            onClick={() => removeTag(t)}
                                            className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-red-400"
                                            title="Remove tag"
                                          >
                                            #{t} ×
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                </div>
                                {createErrorMsg && <p className="text-sm text-red-600 dark:text-red-400">{createErrorMsg}</p>}
                                {createError && <p className="text-sm text-red-600 dark:text-red-400">{getErrorMessage(createError, 'Create failed')}</p>}
                                <button
                                  type="button"
                                  onClick={handleCreateCampaignV2}
                                  disabled={createSubmitting || isCreatePending}
                                  className="w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {createSubmitting || isCreatePending ? 'Creating…' : 'Create campaign'}
                                </button>
                              </div>
                            </section>
                          )}

                          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900">
                            <div className="flex items-center justify-between gap-4 mb-4">
                              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">My campaigns (V2)</h2>
                              <button type="button" className="k-control-btn" onClick={refetchMyCampaignsV2}>
                                Refresh
                              </button>
                            </div>

                            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] dark:bg-emerald-950/25 p-4 mb-4">
                              <p className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 mb-2">Premium modules</p>
                              <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
                                Unlock featured placement on the campaign listing, the Kaspa L1 tip jar, and other upgrades - pay with Kaspa (L1), then confirm one transaction on Igra.
                                All unlocks are managed from the Modules page.
                              </p>
                              <Link
                                href="/donations/modules"
                                className="k-control-btn inline-flex !border-emerald-500/35 !bg-emerald-500/15 !text-emerald-900 dark:!text-emerald-200"
                              >
                                Open modules
                              </Link>
                            </div>

                            {myCampaignsV2Error && (
                              <div className="rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 mb-4">
                                {myCampaignsV2Error.message}
                              </div>
                            )}

                            {myCampaignsV2Loading && <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading campaigns…</div>}

                            {!myCampaignsV2Loading && myCampaignsV2.length === 0 && (
                              <div className="text-sm text-zinc-500 dark:text-zinc-400">No campaigns yet.</div>
                            )}

                            {!myCampaignsV2Loading && myCampaignsV2.length > 0 && (
                              <div className="space-y-3">
                                {myCampaignsV2.map((c) => {
                                  const deadlinePassed = BigInt(Math.floor(Date.now() / 1000)) >= c.deadline;
                                  const targetReachedEscrowOnly = c.method === 'L2_ESCROW' && c.raisedWei >= c.targetWei;
                                  const isRowCreator =
                                    Boolean(address) &&
                                    c.creatorAddress.toLowerCase() === (address as string).toLowerCase();
                                  const canClaimV2 =
                                    isRowCreator && c.method === 'L2_ESCROW' && targetReachedEscrowOnly && deadlinePassed;
                                  const canDeleteCampaign =
                                    c.active &&
                                    c.raisedWei === 0n &&
                                    c.donorCount === 0n &&
                                    (c.l1RecordedTotalWei ?? 0n) === 0n &&
                                    (c.l1RecordedDonationCount ?? 0n) === 0n;
                                  return (
                                    <div key={c.campaignId.toString()} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                              {c.method === 'L1_DIRECT' ? 'L1 Direct' : 'L2 Escrow'}
                                            </span>
                                            {c.active && (
                                              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                                Active
                                              </span>
                                            )}
                                            {!c.active && (
                                              <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                                                Inactive
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                                            Campaign #{c.campaignId.toString()}
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          <Link href={`/donations/${address}?campaignId=${c.campaignId.toString()}`} className="k-control-btn">
                                            View public
                                          </Link>
                                          <button
                                            type="button"
                                            className="k-control-btn"
                                            onClick={() =>
                                              void loadEditFormV2(c.campaignId, c.ipfsHash, c.l1Address, c.targetWei, c.deadline)
                                            }
                                            disabled={editLoadingMeta}
                                          >
                                            {editLoadingMeta && editingV2CampaignId === c.campaignId ? 'Loading…' : 'Edit'}
                                          </button>
                                          {canClaimV2 && (
                                            <button type="button" className="k-control-btn !bg-emerald-600 !text-white" onClick={() => handleClaimV2(c.campaignId)}>
                                              Claim
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            className="k-control-btn !border-red-300 dark:!border-red-800 !text-red-700 dark:!text-red-300"
                                            disabled={!canDeleteCampaign}
                                            title={
                                              canDeleteCampaign
                                                ? 'Delete this empty campaign on-chain'
                                                : 'Only campaigns with no donations or recorded L1 activity can be deleted.'
                                            }
                                            onClick={() => setDeleteCampaignId(c.campaignId)}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </section>
                        </>
                      )}

                      {/* Legacy V1 (fallback when V2 not configured) */}
                      {(!writeEscrowV2Address || !hasEscrowV2Configured) && (
                        <>
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

            {/* Create / update campaign (V1 supports only 1 campaign per creator) */}
            {isVerified && (
              <section id="create" className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900 scroll-mt-24">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Create campaign</h2>
                {hasCampaign && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-900 dark:text-amber-100 mb-4">
                    You already have a V1 campaign. V1 only supports <strong>one campaign per creator</strong>. To create multiple campaigns you need CrowdKAS V2
                    (set <code className="font-mono">NEXT_PUBLIC_DONATION_ESCROW_V2_ADDRESS_IGRA_MAINNET</code> in Vercel).
                  </div>
                )}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                      <select
                        value={createForm.category ?? ''}
                        onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value ? e.target.value : undefined }))}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      >
                        <option value="">Select category…</option>
                        {DONATION_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tags (optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                          placeholder="e.g. wallet, nft, open-source"
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          className="px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                        >
                          Add
                        </button>
                      </div>
                      {(createForm.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(createForm.tags ?? []).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => removeTag(t)}
                              className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-red-400"
                              title="Remove tag"
                            >
                              #{t} ×
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Featured image</label>
                      <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setCreateForm((f) => ({ ...f, featuredImageMode: 'url' }))}
                          className={`px-3 py-1.5 text-xs font-bold ${createForm.featuredImageMode === 'url' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
                        >
                          URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateForm((f) => ({ ...f, featuredImageMode: 'ipfs' }))}
                          className={`px-3 py-1.5 text-xs font-bold ${createForm.featuredImageMode === 'ipfs' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
                        >
                          IPFS
                        </button>
                      </div>
                    </div>
                    <ImageUpload
                      label=""
                      value={createForm.featuredImageValue}
                      onChange={(v) => setCreateForm((f) => ({ ...f, featuredImageValue: v }))}
                      onFileSelect={async (file) => {
                        const client = getIPFSClient();
                        return await client.uploadFile(file, { filename: (file as File).name });
                      }}
                      placeholder={createForm.featuredImageMode === 'url' ? 'https://…' : 'CID (or upload a file)'}
                      aspectRatio="video"
                      showUrlInput={true}
                      showFileUpload={createForm.featuredImageMode === 'ipfs'}
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                      URL is fastest. IPFS keeps your campaign image permanent (recommended).
                    </p>
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
                    onClick={() => {
                      if (hasCampaign) {
                        void loadEditForm();
                        return;
                      }
                      handleCreateCampaign();
                    }}
                    disabled={createSubmitting || isCreatePending}
                    className="w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {hasCampaign ? (editLoadingMeta ? 'Loading…' : 'Edit existing campaign') : createSubmitting || isCreatePending ? 'Creating…' : 'Create campaign'}
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
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatEther(studioTotals ? totalRaisedWei(studioTotals) : campaign.raisedWei)} iKAS
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">Target</p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatEther(campaign.targetWei)} iKAS</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">Donors</p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {(studioTotals ? totalDonorCount(studioTotals) : campaign.donorCount).toString()}
                    </p>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Category</label>
                          <select
                            value={editForm.category ?? ''}
                            onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value ? e.target.value : undefined }))}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                          >
                            <option value="">Select category…</option>
                            {DONATION_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Tags</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editTagInput}
                              onChange={(e) => setEditTagInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEditTag())}
                              className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                              placeholder="Add tag…"
                            />
                            <button type="button" onClick={addEditTag} className="px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-sm">
                              Add
                            </button>
                          </div>
                          {(editForm.tags ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {(editForm.tags ?? []).map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => removeEditTag(t)}
                                  className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-red-400"
                                  title="Remove tag"
                                >
                                  #{t} ×
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
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
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">Featured image</label>
                          <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setEditForm((f) => ({ ...f, featuredImageMode: 'url' }))}
                              className={`px-3 py-1.5 text-[11px] font-bold ${editForm.featuredImageMode === 'url' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
                            >
                              URL
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditForm((f) => ({ ...f, featuredImageMode: 'ipfs' }))}
                              className={`px-3 py-1.5 text-[11px] font-bold ${editForm.featuredImageMode === 'ipfs' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
                            >
                              IPFS
                            </button>
                          </div>
                        </div>
                        <ImageUpload
                          label=""
                          value={editForm.featuredImageValue}
                          onChange={(v) => setEditForm((f) => ({ ...f, featuredImageValue: v }))}
                          onFileSelect={async (file) => {
                            const client = getIPFSClient();
                            return await client.uploadFile(file, { filename: (file as File).name });
                          }}
                          placeholder={editForm.featuredImageMode === 'url' ? 'https://…' : 'CID (or upload a file)'}
                          aspectRatio="video"
                          showUrlInput={true}
                          showFileUpload={editForm.featuredImageMode === 'ipfs'}
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
                      {editingV2CampaignId != null && !l1TipsUnlockedV2 ? (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          <strong>L1 tip jar:</strong> unlock the premium module below to set a Kaspa address for optional L1 tips (they do not count toward the L2 goal).
                        </p>
                      ) : null}
                      {editingV2CampaignId != null && l1TipsUnlockedV2 ? (
                        <>
                          <div>
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">L1 Kaspa tip address</label>
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
                              placeholder="kaspa:..."
                            />
                          </div>
                          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
                            <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              <input
                                type="checkbox"
                                checked={editForm.l1TipGiftEnabled}
                                onChange={(e) => setEditForm((f) => ({ ...f, l1TipGiftEnabled: e.target.checked }))}
                                className="rounded border-zinc-300"
                              />
                              Offer a thank-you gift for L1 tippers (text, URL, or IPFS)
                            </label>
                            {editForm.l1TipGiftEnabled && (
                              <div className="space-y-2 pt-1">
                                <select
                                  value={editForm.l1TipGiftType}
                                  onChange={(e) =>
                                    setEditForm((f) => ({ ...f, l1TipGiftType: e.target.value as 'text' | 'url' | 'ipfs' }))
                                  }
                                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm"
                                >
                                  <option value="text">Text</option>
                                  <option value="url">URL</option>
                                  <option value="ipfs">IPFS CID</option>
                                </select>
                                <input
                                  type="text"
                                  value={editForm.l1TipGiftLabel}
                                  onChange={(e) => setEditForm((f) => ({ ...f, l1TipGiftLabel: e.target.value }))}
                                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm"
                                  placeholder="Short label (e.g. Wallpaper pack)"
                                />
                                <textarea
                                  value={editForm.l1TipGiftValue}
                                  onChange={(e) => setEditForm((f) => ({ ...f, l1TipGiftValue: e.target.value }))}
                                  rows={2}
                                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm"
                                  placeholder={editForm.l1TipGiftType === 'text' ? 'Message…' : editForm.l1TipGiftType === 'url' ? 'https://…' : 'bafy…'}
                                />
                              </div>
                            )}
                          </div>
                        </>
                      ) : null}
                      {editingV2CampaignId == null ? (
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
                      ) : null}
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
                      {editingV2CampaignId != null ? (
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-3">
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                            Need <strong>featured</strong> placement or the <strong>L1 tip jar</strong>? Unlock paid modules on the{' '}
                            <Link
                              href={`/donations/modules?campaignId=${editingV2CampaignId!.toString()}`}
                              className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                            >
                              Modules
                            </Link>{' '}
                            page after you save your edits here.
                          </p>
                        </div>
                      ) : null}
                      {editErrorMsg && <p className="text-sm text-red-600 dark:text-red-400">{editErrorMsg}</p>}
                      {updateError && <p className="text-sm text-red-600 dark:text-red-400">{getErrorMessage(updateError, 'Update failed')}</p>}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={editingV2CampaignId != null ? handleUpdateCampaignV2 : handleUpdateCampaign}
                          disabled={editSubmitting || isUpdatePending}
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {editSubmitting || isUpdatePending ? 'Updating…' : 'Save changes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditForm(false);
                            setEditingV2CampaignId(null);
                          }}
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
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Network</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Required: <span className="font-semibold">Igra Mainnet</span>
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Current: <span className="font-semibold">{currentChain?.name ?? (chainId ? `chain ${chainId}` : 'Not connected')}</span>
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">How it works</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <li>Verify your wallet (tiny on-chain tx).</li>
                    <li>Create your campaign (goal + deadline).</li>
                    <li>Share the campaign link.</li>
                    <li>After deadline: creator claims if goal reached, otherwise donors can refund.</li>
                  </ol>
                </div>

                {kaspaState.isConnected && kaspaState.address && (
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Kaspa L1 wallet</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 break-all font-mono">{kaspaState.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
