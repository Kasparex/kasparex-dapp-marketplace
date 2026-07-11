'use client';

import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAccount, useChainId, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
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
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { CrowdKasCampaignMediaField } from '@/components/donations/CrowdKasCampaignMediaField';
import { DonationCategoryField } from '@/components/donations/DonationCategoryField';
import { HowItWorksWizard } from '@/components/donations/HowItWorksWizard';
import { DONATION_CATEGORIES, isDonationCategory, normalizeTags } from '@/lib/donations/categories';
import { useMyDonationCampaignsV2 } from '@/hooks/useMyDonationCampaigns';
import { DONATION_MODULE_IDS } from '@/lib/donations/modules';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { config as wagmiChainConfig } from '@/lib/wagmi';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { CrowdKasCovenantPanel, type CrowdKasCovenantPanelHandle } from '@/components/donations/CrowdKasCovenantPanel';
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
import { CROWDKAS_L1_COVENANT_GATE, CROWDKAS_L2_STUDIO_GATE } from '@/lib/hub/gateConfigs';
import { CrowdKasAuthorDashboard } from '@/components/donations/CrowdKasAuthorDashboard';
import { CrowdKasAuthorPricing } from '@/components/donations/CrowdKasAuthorPricing';
import { CrowdKasStudioRightPanel } from '@/components/donations/CrowdKasStudioRightPanel';
import { CrowdKasModulesPanel } from '@/components/donations/CrowdKasModulesPanel';
import { CrowdKasCampaignPreviewModal } from '@/components/donations/CrowdKasCampaignPreviewModal';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { CROWDKAS_FORM_PANEL_CLASS } from '@/components/donations/crowdkasFormTheme';
import { cleanCrowdKasModulesConfig, type CrowdKasModulesConfig } from '@/lib/donations/crowdkasModules';
import { useCrowdKasPricing } from '@/hooks/useCrowdKasPricing';
import { CrowdKasMyCampaignsPanel } from '@/components/donations/CrowdKasMyCampaignsPanel';
import { CrowdKasEditCampaignForm } from '@/components/donations/CrowdKasEditCampaignForm';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { MobileDesktopOnlyGate } from '@/components/hub/MobileDesktopOnlyGate';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { normalizeAddr } from '@/lib/covenant/utils';
import { VDONATE_PRODUCT_NAME, VDONATE_STUDIO_NAME, VDONATE_SHORT_NAME, VDONATE_GRADIENT_TEXT } from '@/lib/donations/brand';
import { HubPageAccentLayout } from '@/components/hub/HubPageAccentLayout';

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
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
          <Header />
          <main className="flex flex-1 items-center justify-center p-8">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading studio…</p>
          </main>
          <Footer />
        </div>
      }
    >
      <DonationsStudioPageContent />
    </Suspense>
  );
}

function DonationsStudioPageContent() {
  const chainId = useChainId();
  const { address } = useAccount();
  /** CrowdKAS escrow on Igra Mainnet - used for all reads so studio state works even when the wallet is on another chain. */
  const igraEscrowAddress = getContractAddress(VDONATIONS_CHAIN_ID, 'DonationEscrow');
  const writeEscrowAddress = getContractAddress(chainId, 'DonationEscrow');
  /** CrowdKAS V2 escrow on Igra Mainnet - multi-campaign + explicit donation method. */
  const igraEscrowV2Address = getContractAddress(VDONATIONS_CHAIN_ID, 'DonationEscrowV2');
  const writeEscrowV2Address = getContractAddress(chainId, 'DonationEscrowV2');
  const currentChain = chainId ? getChainById(chainId) : null;
  const { state: kaspaState } = useKaspaWallet();
  const { balance: krexBalance } = useKREXBalance();

  const onRequiredChain = chainId === VDONATIONS_CHAIN_ID;
  const hasEscrowConfigured = Boolean(igraEscrowAddress);
  const hasEscrowV2Configured = Boolean(igraEscrowV2Address);
  const showMissingConfigNudge = onRequiredChain && Boolean(address) && !writeEscrowAddress;
  const showMissingV2ConfigNudge = onRequiredChain && Boolean(address) && hasEscrowV2Configured && !writeEscrowV2Address;

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

  const { writeContract, writeContractAsync, data: txHash, isPending: isTxPending, error: txError } = useWriteContract();
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
  type EditOnChainLock = {
    targetWei: bigint;
    deadline: bigint;
    l1Address: string;
  };

  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editOnChainLock, setEditOnChainLock] = useState<EditOnChainLock | null>(null);
  const [editModulesConfig, setEditModulesConfig] = useState<CrowdKasModulesConfig>({});
  const [deleteCampaignId, setDeleteCampaignId] = useState<bigint | null>(null);

  const searchParams = useSearchParams();
  const pricing = useCrowdKasPricing();
  const { campaigns: covenantCampaigns } = useCovenantCrowdfund();
  const [modulesConfig, setModulesConfig] = useState<CrowdKasModulesConfig>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const covenantPanelRef = useRef<CrowdKasCovenantPanelHandle>(null);
  const [l1Submitting, setL1Submitting] = useState(false);
  const [l1PricingInputs, setL1PricingInputs] = useState({
    payoutSplitRecipientCount: 0,
    pendingPaidModules: [] as import('@/lib/donations/modules').DonationPaidModuleId[],
  });
  const [l2ImageSource, setL2ImageSource] = useState<'url' | 'file'>('file');
  const [l2ImageUrl, setL2ImageUrl] = useState('');
  const [l2ImageCid, setL2ImageCid] = useState<string | null>(null);
  const [l2ImageFileName, setL2ImageFileName] = useState<string | null>(null);
  const [editImageSource, setEditImageSource] = useState<'url' | 'file'>('file');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImageCid, setEditImageCid] = useState<string | null>(null);
  const [editImageFileName, setEditImageFileName] = useState<string | null>(null);

  const myCovenantCampaigns = useMemo(() => {
    if (!kaspaState.address) return [];
    const norm = normalizeAddr(kaspaState.address);
    return covenantCampaigns.filter((c) => normalizeAddr(c.creator) === norm);
  }, [covenantCampaigns, kaspaState.address]);

  const myCampaignsCount = myCampaignsV2.length + myCovenantCampaigns.length + (hasCampaign ? 1 : 0);
  const l1CreateQuote = useMemo(
    () =>
      pricing.estimateL1Quote('create', {
        payoutSplitRecipientCount: l1PricingInputs.payoutSplitRecipientCount,
        enabledPaidModules: l1PricingInputs.pendingPaidModules,
      }),
    [l1PricingInputs, pricing],
  );
  const l2CreateQuote = useMemo(() => pricing.estimateL2Quote('create'), [pricing]);

  const previewMetadata = useMemo((): DonationCampaignMetadata => {
    const category = createForm.category && isDonationCategory(createForm.category) ? createForm.category : undefined;
    const tags = normalizeTags(createForm.tags ?? []);
    return {
      title: createForm.title,
      description: createForm.description || '',
      category,
      tags: tags.length ? tags : undefined,
      goals: createForm.goals?.length ? createForm.goals : undefined,
      socialLinks: Object.keys(createForm.socialLinks || {}).length ? createForm.socialLinks : undefined,
      imageUrl: l2ImageSource === 'url' && l2ImageUrl.trim() ? l2ImageUrl.trim() : undefined,
      imageHash: l2ImageSource === 'file' && l2ImageCid ? l2ImageCid : undefined,
      modules: cleanCrowdKasModulesConfig(modulesConfig),
    };
  }, [createForm, l2ImageCid, l2ImageSource, l2ImageUrl, modulesConfig]);

  const l1TipsUnlockedV2 =
    editingV2CampaignId != null ? (unlockByCampaignId.get(editingV2CampaignId.toString())?.l1Tips ?? false) : false;

  const closeEditCampaignForm = () => {
    setShowEditForm(false);
    setEditingV2CampaignId(null);
    setEditOnChainLock(null);
  };

  const syncEditImageFromMetadata = (meta: DonationCampaignMetadata | null) => {
    if (meta?.imageUrl?.trim()) {
      setEditImageSource('url');
      setEditImageUrl(meta.imageUrl.trim());
      setEditImageCid(null);
      setEditImageFileName(null);
      return;
    }
    setEditImageSource('file');
    setEditImageUrl('');
    setEditImageCid(meta?.imageHash?.trim() ? meta.imageHash.trim() : null);
    setEditImageFileName(null);
  };

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

  const handleCreateL1Covenant = async () => {
    setL1Submitting(true);
    try {
      await covenantPanelRef.current?.submit();
    } finally {
      setL1Submitting(false);
    }
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
      const category = createForm.category && isDonationCategory(createForm.category) ? createForm.category : undefined;
      const tags = normalizeTags(createForm.tags ?? []);

      const metadata: DonationCampaignMetadata = {
        title: createForm.title,
        description: createForm.description || '',
        category,
        tags: tags.length ? tags : undefined,
        goals: createForm.goals?.length ? createForm.goals : undefined,
        socialLinks: Object.keys(createForm.socialLinks || {}).length ? createForm.socialLinks : undefined,
        imageUrl: l2ImageSource === 'url' && l2ImageUrl.trim() ? l2ImageUrl.trim() : undefined,
        imageHash: l2ImageSource === 'file' && l2ImageCid ? l2ImageCid : undefined,
        modules: cleanCrowdKasModulesConfig(modulesConfig),
      };
      const client = getIPFSClient();
      const ipfsHash = await client.uploadJSON(metadata as unknown as Record<string, unknown>);
      const targetWei = parseEther(createForm.targetKAS);
      const deadline = BigInt(Math.floor(endDate.getTime() / 1000));
      const method = 0 as const;
      const l1Address = '';

      const hash = await writeContractAsync({
        address: writeEscrowV2Address as Address,
        abi: DONATION_ESCROW_V2_ABI,
        functionName: 'createCampaign',
        args: [method, ipfsHash, targetWei, deadline, l1Address],
      });
      const receipt = await waitForTransactionReceipt(wagmiChainConfig, { hash });
      if (receipt.status === 'success' && kaspaState.address?.trim()) {
        appendHubActivityEarn({
          walletRaw: kaspaState.address,
          source: 'crowdkas_campaign_create',
          redeemableDelta: HUB_EARN_POINTS.crowdkasCampaignCreate,
          krexBalance,
          idempotencyKey: `crowdkas:create:v2:${hash}`,
          meta: { escrow: 'v2' },
        });
      }
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
        modules: cleanCrowdKasModulesConfig(modulesConfig),
      };
      const client = getIPFSClient();
      const ipfsHash = await client.uploadJSON(metadata as unknown as Record<string, unknown>);
      const targetWei = parseEther(createForm.targetKAS);
      const deadline = BigInt(Math.floor(endDate.getTime() / 1000));
      const l1Address = createForm.l1KaspaAddress.trim();
      const hash = await writeContractAsync({
        address: writeEscrowAddress as Address,
        abi: DONATION_ESCROW_ABI,
        functionName: 'createCampaign',
        args: [ipfsHash, targetWei, deadline, l1Address],
      });
      const receipt = await waitForTransactionReceipt(wagmiChainConfig, { hash });
      if (receipt.status === 'success') {
        appendHubActivityEarn({
          walletRaw: l1Address,
          source: 'crowdkas_campaign_create',
          redeemableDelta: HUB_EARN_POINTS.crowdkasCampaignCreate,
          krexBalance,
          idempotencyKey: `crowdkas:create:v1:${hash}`,
          meta: { escrow: 'v1' },
        });
      }
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
      const g = meta?.l1TipGift;
      setEditOnChainLock({
        targetWei,
        deadline,
        l1Address: l1Address?.trim() ?? '',
      });
      setEditModulesConfig(meta?.modules ?? {});
      syncEditImageFromMetadata(meta);
      setEditForm({
        title: meta?.title ?? '',
        description: meta?.description ?? '',
        category: meta?.category && isDonationCategory(meta.category) ? meta.category : undefined,
        tags: normalizeTags(meta?.tags ?? []),
        goals: meta?.goals ?? [],
        socialLinks: meta?.socialLinks ?? {},
        l1KaspaAddress: l1Address?.trim() ?? meta?.l1KaspaAddress ?? '',
        targetKAS: targetWei ? formatEther(targetWei) : '1000',
        endDate: deadline ? new Date(Number(deadline) * 1000).toISOString().slice(0, 16) : '',
        featuredImageMode: meta?.imageUrl ? 'url' : 'ipfs',
        featuredImageValue: (meta?.imageUrl || meta?.imageHash || '').trim(),
        l1TipGiftEnabled: Boolean(g?.enabled && g?.value?.trim()),
        l1TipGiftType: g?.type ?? 'text',
        l1TipGiftLabel: g?.label ?? '',
        l1TipGiftValue: g?.value ?? '',
      });
      setShowEditForm(true);
      requestAnimationFrame(() => {
        document.getElementById('crowdkas-edit-campaign')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
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
      const g1 = meta?.l1TipGift;
      setEditOnChainLock({
        targetWei: campaign.targetWei,
        deadline: campaign.deadline,
        l1Address: campaign.l1Address?.trim() ?? '',
      });
      setEditModulesConfig(meta?.modules ?? {});
      syncEditImageFromMetadata(meta);
      setEditForm({
        title: meta?.title ?? '',
        description: meta?.description ?? '',
        category: meta?.category && isDonationCategory(meta.category) ? meta.category : undefined,
        tags: normalizeTags(meta?.tags ?? []),
        goals: meta?.goals ?? [],
        socialLinks: meta?.socialLinks ?? {},
        l1KaspaAddress: campaign.l1Address?.trim() ?? meta?.l1KaspaAddress ?? '',
        targetKAS: campaign.targetWei ? formatEther(campaign.targetWei) : '1000',
        endDate: campaign.deadline ? new Date(Number(campaign.deadline) * 1000).toISOString().slice(0, 16) : '',
        featuredImageMode: meta?.imageUrl ? 'url' : 'ipfs',
        featuredImageValue: (meta?.imageUrl || meta?.imageHash || '').trim(),
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
    if (!address || !writeEscrowV2Address || editingV2CampaignId == null || !editOnChainLock) return;
    if (!editForm.title.trim()) {
      setEditErrorMsg('Please fill title.');
      return;
    }
    setEditSubmitting(true);
    setEditErrorMsg(null);
    try {
      const category = editForm.category && isDonationCategory(editForm.category) ? editForm.category : undefined;
      const tags = normalizeTags(editForm.tags ?? []);
      const l1TipsOn = Boolean(l1TipsUnlockedV2);
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
        imageUrl: editImageSource === 'url' && editImageUrl.trim() ? editImageUrl.trim() : undefined,
        imageHash: editImageSource === 'file' && editImageCid ? editImageCid : undefined,
        modules: cleanCrowdKasModulesConfig(editModulesConfig),
        l1TipGift: l1Gift,
      };
      const client = getIPFSClient();
      const ipfsHash = await client.uploadJSON(metadata as unknown as Record<string, unknown>);
      const targetWei = editOnChainLock.targetWei;
      const deadline = editOnChainLock.deadline;
      const l1Address = editOnChainLock.l1Address;

      writeContract({
        address: writeEscrowV2Address as Address,
        abi: DONATION_ESCROW_V2_ABI,
        functionName: 'updateCampaign',
        args: [editingV2CampaignId, ipfsHash, targetWei, deadline, l1Address],
      });
      setShowEditForm(false);
      setEditingV2CampaignId(null);
      setEditOnChainLock(null);
    } catch (e) {
      setEditErrorMsg(getErrorMessage(e, 'Failed to update campaign'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleUpdateCampaign = async () => {
    if (!address || !writeEscrowAddress || !campaign || !editOnChainLock) return;
    if (!editForm.title.trim()) {
      setEditErrorMsg('Please fill title.');
      return;
    }
    setEditSubmitting(true);
    setEditErrorMsg(null);
    try {
      const category = editForm.category && isDonationCategory(editForm.category) ? editForm.category : undefined;
      const tags = normalizeTags(editForm.tags ?? []);
      const metadata: DonationCampaignMetadata = {
        title: editForm.title,
        description: editForm.description || '',
        category,
        tags: tags.length ? tags : undefined,
        goals: editForm.goals?.length ? editForm.goals : undefined,
        socialLinks: Object.keys(editForm.socialLinks || {}).length ? editForm.socialLinks : undefined,
        imageUrl: editImageSource === 'url' && editImageUrl.trim() ? editImageUrl.trim() : undefined,
        imageHash: editImageSource === 'file' && editImageCid ? editImageCid : undefined,
        modules: cleanCrowdKasModulesConfig(editModulesConfig),
      };
      const client = getIPFSClient();
      const ipfsHash = await client.uploadJSON(metadata as unknown as Record<string, unknown>);
      const targetWei = editOnChainLock.targetWei;
      const deadline = editOnChainLock.deadline;
      const l1Address = editOnChainLock.l1Address;
      writeContract({
        address: writeEscrowAddress as Address,
        abi: DONATION_ESCROW_ABI,
        functionName: 'updateCampaign',
        args: [ipfsHash, targetWei, deadline, l1Address],
      });
      setShowEditForm(false);
      setEditOnChainLock(null);
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
            <p className="kx-body mt-3">
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
      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <HubPageAccentLayout projectId="kasparex-donations">
          <div className="hidden lg:block flex-shrink-0">
            <DonationsSidebar variant="minimal" showStudioSections backLink={{ href: '/donations', label: 'All campaigns' }} />
          </div>
          <div className="lg:hidden flex-shrink-0">
            <DonationsSidebar variant="minimal" showStudioSections backLink={{ href: '/donations', label: 'All campaigns' }} />
          </div>

          <div className="flex-1 min-w-0 p-4 sm:p-8 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-200">
                  Creator dashboard
                </p>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight tracking-tight">
                  Kasparex <span className={VDONATE_GRADIENT_TEXT}>{VDONATE_SHORT_NAME} Studio</span>
                </h1>
                <p className="kx-body max-w-3xl">
                  Create L1 covenant or L2 escrow campaigns, manage listings, and unlock modules for your supporters.
                </p>
              </div>

              <MobileDesktopOnlyGate title={VDONATE_STUDIO_NAME} backHref="/donations" backLabel={`Back to ${VDONATE_SHORT_NAME}`}>
              <CrowdKasAuthorDashboard myCampaignsCount={myCampaignsCount}>
                {(activeTab) => (
                  <div className="space-y-8">
                    {(activeTab === 'l1-covenant' || activeTab === 'l2-escrow') && (
                      <div id="crowdkas-dashboard-pricing" className="scroll-mt-24">
                        <CrowdKasAuthorPricing network={activeTab === 'l1-covenant' ? 'l1' : 'l2'} />
                      </div>
                    )}

                    <div
                      className={`grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start ${
                        activeTab === 'my-campaigns' || activeTab === 'how-it-works' ? 'xl:grid-cols-1' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-6 min-w-0">
                        {activeTab === 'l1-covenant' && (
                          <section id="covenant-create" className="scroll-mt-24">
                            <HubWalletGateShell config={CROWDKAS_L1_COVENANT_GATE} mode="overlay" className="min-h-[18rem]">
                              <CrowdKasCovenantPanel
                                ref={covenantPanelRef}
                                variant="embed"
                                studioMode
                                onPricingInputsChange={setL1PricingInputs}
                              />
                            </HubWalletGateShell>
                          </section>
                        )}

                        {activeTab === 'l2-escrow' && (
                  <HubWalletGateShell config={CROWDKAS_L2_STUDIO_GATE} mode="overlay" className="min-h-[22rem]">
                    <div className="flex flex-col gap-6 min-w-0">
                    {showMissingConfigNudge && (
                    <div className="rounded-xl border border-red-200 dark:border-red-800 p-4 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100 space-y-2">
                      <p className="font-semibold">{VDONATE_SHORT_NAME} contracts are not configured for Igra Mainnet yet.</p>
                      <p className="text-sm">
                        You are on <strong>Igra Mainnet</strong>, but `DonationEscrow` address is missing for chain {VDONATIONS_CHAIN_ID}.
                        Set `NEXT_PUBLIC_DONATION_ESCROW_ADDRESS_IGRA_MAINNET` (or `NEXT_PUBLIC_DONATION_ESCROW_ADDRESS_38833`) in Vercel and redeploy.
                      </p>
                    </div>
                  )}

                  {showMissingV2ConfigNudge && (
                    <div className="rounded-xl border border-red-200 dark:border-red-800 p-4 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100 space-y-2">
                      <p className="font-semibold">{VDONATE_SHORT_NAME} V2 contracts are not configured for Igra Mainnet yet.</p>
                      <p className="text-sm">
                        You are on <strong>Igra Mainnet</strong>, but `DonationEscrowV2` address is missing for chain {VDONATIONS_CHAIN_ID}.
                        Set `NEXT_PUBLIC_DONATION_ESCROW_V2_ADDRESS_IGRA_MAINNET` (or `NEXT_PUBLIC_DONATION_ESCROW_V2_ADDRESS_38833`) in Vercel and redeploy.
                      </p>
                    </div>
                  )}

                  {(writeEscrowV2Address || writeEscrowAddress) && (
                    <div className="flex flex-col gap-6">
                      {writeEscrowV2Address && hasEscrowV2Configured && (
                        <>
                          <div className={`${CROWDKAS_FORM_PANEL_CLASS} space-y-4`}>
                            <DAppSectionHeader title="Wallet verification" />
                            {isVerifiedV2 ? (
                              <p className="text-emerald-600 dark:text-emerald-400 font-medium">Verified</p>
                            ) : (
                              <>
                                <p className="kx-body">
                                  Pay 1 wei to verify. Only verified wallets can create campaigns.
                                </p>
                                <button
                                  type="button"
                                  onClick={handleVerifyV2}
                                  disabled={isVerifyPending}
                                  className="k-control-btn !bg-emerald-600 !text-white hover:!bg-emerald-700 disabled:opacity-50"
                                >
                                  {isVerifyPending ? 'Confirming…' : 'Verify (1 wei)'}
                                </button>
                                {verifyError && (
                                  <p className="text-sm text-red-600 dark:text-red-400">{getErrorMessage(verifyError, 'Verify failed')}</p>
                                )}
                              </>
                            )}
                          </div>

                          {isVerifiedV2 && (
                            <div id="create" className={`${CROWDKAS_FORM_PANEL_CLASS} space-y-6 scroll-mt-24`}>
                              <div>
                                <DAppSectionHeader title="Main content" className="mb-3" />
                                <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
                                  Create L2 escrow campaign
                                </h3>
                                <p className="kx-body">
                                  New campaigns use <strong>L2 escrow</strong> on Igra for the funding goal. Optional Kaspa L1 tips can be added later after you unlock the L1 tip jar module.
                                </p>
                              </div>
                              <div className="space-y-6">
                                <div>
                                  <KxFormFieldLabel>
                                    Title <span className="text-red-500">*</span>
                                  </KxFormFieldLabel>
                                  <input
                                    type="text"
                                    value={createForm.title}
                                    onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                                    className="k-input text-base"
                                    placeholder="Campaign title"
                                  />
                                </div>
                                <div>
                                  <KxFormFieldLabel>Description</KxFormFieldLabel>
                                  <KxRichTextEditor
                                    value={createForm.description}
                                    onChange={(value) => setCreateForm((f) => ({ ...f, description: value }))}
                                    minRows={8}
                                    placeholder="What is this campaign for?"
                                  />
                                </div>
                                <CrowdKasCampaignMediaField
                                  source={l2ImageSource}
                                  onSourceChange={setL2ImageSource}
                                  url={l2ImageUrl}
                                  onUrlChange={setL2ImageUrl}
                                  cid={l2ImageCid}
                                  onCidChange={setL2ImageCid}
                                  fileName={l2ImageFileName}
                                  onFileNameChange={setL2ImageFileName}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <KxFormFieldLabel>Category</KxFormFieldLabel>
                                    <DonationCategoryField
                                      value={createForm.category ?? ''}
                                      onChange={(category) =>
                                        setCreateForm((f) => ({ ...f, category: category || undefined }))
                                      }
                                    />
                                  </div>
                                  <div>
                                    <KxFormFieldLabel>Tags (optional)</KxFormFieldLabel>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        className="k-input flex-1"
                                        placeholder="e.g. wallet, nft, open-source"
                                      />
                                      <button type="button" onClick={addTag} className="k-control-btn shrink-0">
                                        Add
                                      </button>
                                    </div>
                                    {(createForm.tags ?? []).length > 0 ? (
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
                                    ) : null}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <KxFormFieldLabel>Target (iKAS)</KxFormFieldLabel>
                                    <input
                                      type="number"
                                      value={createForm.targetKAS}
                                      onChange={(e) => setCreateForm((f) => ({ ...f, targetKAS: e.target.value }))}
                                      min="100"
                                      step="1"
                                      className="k-input text-base"
                                    />
                                  </div>
                                  <div>
                                    <KxFormFieldLabel>End date</KxFormFieldLabel>
                                    <input
                                      type="datetime-local"
                                      value={createForm.endDate}
                                      onChange={(e) => setCreateForm((f) => ({ ...f, endDate: e.target.value }))}
                                      className="k-input text-base"
                                    />
                                  </div>
                                </div>
                                {createErrorMsg && <p className="text-sm text-red-600 dark:text-red-400">{createErrorMsg}</p>}
                                {createError && <p className="text-sm text-red-600 dark:text-red-400">{getErrorMessage(createError, 'Create failed')}</p>}
                              </div>
                            </div>
                          )}

                          <div id="crowdkas-dashboard-modules" className={`${CROWDKAS_FORM_PANEL_CLASS} scroll-mt-24 my-2 py-10 sm:py-12 space-y-6`}>
                            <CrowdKasModulesPanel
                              modules={modulesConfig}
                              onChange={setModulesConfig}
                            />
                          </div>
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
                  <p className="kx-body mb-4">
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
                    You already have a V1 campaign. V1 only supports <strong>one campaign per creator</strong>. To create multiple campaigns you need {VDONATE_SHORT_NAME} V2
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
                  <div id="crowdkas-edit-campaign" className="scroll-mt-24 mb-4">
                    <CrowdKasEditCampaignForm
                      form={editForm}
                      onFormChange={setEditForm}
                      onChainLock={editOnChainLock}
                      tagInput={editTagInput}
                      onTagInputChange={setEditTagInput}
                      onAddTag={addEditTag}
                      onRemoveTag={removeEditTag}
                      goalInput={editGoalInput}
                      onGoalInputChange={setEditGoalInput}
                      onAddGoal={addEditGoal}
                      onRemoveGoal={removeEditGoal}
                      imageSource={editImageSource}
                      onImageSourceChange={setEditImageSource}
                      imageUrl={editImageUrl}
                      onImageUrlChange={setEditImageUrl}
                      imageCid={editImageCid}
                      onImageCidChange={setEditImageCid}
                      imageFileName={editImageFileName}
                      onImageFileNameChange={setEditImageFileName}
                      modulesConfig={editModulesConfig}
                      onModulesConfigChange={setEditModulesConfig}
                      editingV2CampaignId={editingV2CampaignId}
                      l1TipsUnlockedV2={l1TipsUnlockedV2}
                      paidModulesUnlocked={
                        editingV2CampaignId != null
                          ? unlockByCampaignId.get(editingV2CampaignId.toString())
                          : undefined
                      }
                      editErrorMsg={editErrorMsg}
                      updateErrorMsg={updateError ? getErrorMessage(updateError, 'Update failed') : null}
                      isSubmitting={editSubmitting || isUpdatePending}
                      onSave={editingV2CampaignId != null ? handleUpdateCampaignV2 : handleUpdateCampaign}
                      onCancel={closeEditCampaignForm}
                    />
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
                  </HubWalletGateShell>
                        )}

                        {activeTab === 'my-campaigns' && (
                          <div className="space-y-6 w-full">
                            {showEditForm && (
                              <div id="crowdkas-edit-campaign" className="scroll-mt-24">
                                <CrowdKasEditCampaignForm
                                  form={editForm}
                                  onFormChange={setEditForm}
                                  onChainLock={editOnChainLock}
                                  tagInput={editTagInput}
                                  onTagInputChange={setEditTagInput}
                                  onAddTag={addEditTag}
                                  onRemoveTag={removeEditTag}
                                  goalInput={editGoalInput}
                                  onGoalInputChange={setEditGoalInput}
                                  onAddGoal={addEditGoal}
                                  onRemoveGoal={removeEditGoal}
                                  imageSource={editImageSource}
                                  onImageSourceChange={setEditImageSource}
                                  imageUrl={editImageUrl}
                                  onImageUrlChange={setEditImageUrl}
                                  imageCid={editImageCid}
                                  onImageCidChange={setEditImageCid}
                                  imageFileName={editImageFileName}
                                  onImageFileNameChange={setEditImageFileName}
                                  modulesConfig={editModulesConfig}
                                  onModulesConfigChange={setEditModulesConfig}
                                  editingV2CampaignId={editingV2CampaignId}
                                  l1TipsUnlockedV2={l1TipsUnlockedV2}
                                  paidModulesUnlocked={
                                    editingV2CampaignId != null
                                      ? unlockByCampaignId.get(editingV2CampaignId.toString())
                                      : undefined
                                  }
                                  editErrorMsg={editErrorMsg}
                                  updateErrorMsg={updateError ? getErrorMessage(updateError, 'Update failed') : null}
                                  isSubmitting={editSubmitting || isUpdatePending}
                                  onSave={editingV2CampaignId != null ? handleUpdateCampaignV2 : handleUpdateCampaign}
                                  onCancel={closeEditCampaignForm}
                                />
                              </div>
                            )}
                            <CrowdKasMyCampaignsPanel
                              l2Campaigns={myCampaignsV2}
                              covenantCampaigns={myCovenantCampaigns}
                              creatorAddress={address as Address | undefined}
                              isLoading={myCampaignsV2Loading}
                              error={myCampaignsV2Error}
                              onRefresh={refetchMyCampaignsV2}
                              onEdit={(campaignId, ipfsHash, l1Address, targetWei, deadline) => {
                                void loadEditFormV2(campaignId, ipfsHash, l1Address, targetWei, deadline);
                              }}
                              onClaim={handleClaimV2}
                              onDelete={setDeleteCampaignId}
                            />
                          </div>
                        )}

                        {activeTab === 'how-it-works' && (
                          <section id="how-it-works" className={`${CROWDKAS_FORM_PANEL_CLASS} scroll-mt-24 space-y-6`}>
                            <div>
                              <DAppSectionHeader title="Walkthrough" className="mb-3" />
                              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">
                                How {VDONATE_SHORT_NAME} works
                              </h3>
                              <p className="kx-body">
                                Step through donor and creator flows for L2 escrow and L1 covenant campaigns.
                              </p>
                            </div>
                            <HowItWorksWizard />
                          </section>
                        )}
                      </div>

                      {activeTab === 'l1-covenant' ? (
                        <CrowdKasStudioRightPanel
                          network="l1"
                          quote={l1CreateQuote}
                          tier={pricing.tier}
                          infoText="Launch your L1 covenant campaign on Kaspa. Creation requires KAS (or supported tokens). Paid modules bill in KAS on L1."
                          onSubmit={handleCreateL1Covenant}
                          submitLabel="Create L1 campaign"
                          isSubmitting={l1Submitting}
                          submitDisabled={l1Submitting}
                          error={createErrorMsg ?? (createError ? getErrorMessage(createError, 'Create failed') : null)}
                        />
                      ) : null}
                      {activeTab === 'l2-escrow' ? (
                        <CrowdKasStudioRightPanel
                          network="l2"
                          quote={l2CreateQuote}
                          infoText="Create your L2 escrow campaign on Igra. Creation requires iKAS for the platform fee and network gas."
                          onSubmit={isVerifiedV2 ? handleCreateCampaignV2 : undefined}
                          submitLabel="Create L2 campaign"
                          isSubmitting={createSubmitting || isCreatePending}
                          submitDisabled={createSubmitting || isCreatePending}
                          onPreview={isVerifiedV2 ? () => setPreviewOpen(true) : undefined}
                          error={createErrorMsg ?? (createError ? getErrorMessage(createError, 'Create failed') : null)}
                        />
                      ) : null}
                    </div>
                  </div>
                )}
              </CrowdKasAuthorDashboard>
              </MobileDesktopOnlyGate>
              <CrowdKasCampaignPreviewModal
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                metadata={previewMetadata}
              />
            </div>
          </div>
        </HubPageAccentLayout>
      </main>
      <Footer />
    </div>
  );
}
