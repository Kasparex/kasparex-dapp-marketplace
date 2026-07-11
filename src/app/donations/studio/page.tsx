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
import { CrowdKasPremiumSectionFields } from '@/components/donations/CrowdKasPremiumSectionFields';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { CROWDKAS_PREMIUM_SECTION_OFFER, CROWDKAS_PREMIUM_SECTION_ENABLE_FEE_KAS } from '@/lib/donations/premiumSection';
import { CrowdKasCampaignPreviewModal } from '@/components/donations/CrowdKasCampaignPreviewModal';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { CROWDKAS_FORM_PANEL_CLASS, CROWDKAS_PREMIUM_MODULE_CARD_CLASS } from '@/components/donations/crowdkasFormTheme';
import { cleanCrowdKasModulesConfig, type CrowdKasModulesConfig } from '@/lib/donations/crowdkasModules';
import { useCrowdKasPricing } from '@/hooks/useCrowdKasPricing';
import type { CrowdKasPricingDraft } from '@/lib/donations/pricing';
import { CROWDKAS_CONTENT_LIMITS, getCrowdKasCharacterCount } from '@/lib/donations/limits';
import { CrowdKasMyCampaignsPanel } from '@/components/donations/CrowdKasMyCampaignsPanel';
import { CrowdKasEditCampaignForm } from '@/components/donations/CrowdKasEditCampaignForm';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { MobileDesktopOnlyGate } from '@/components/hub/MobileDesktopOnlyGate';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { normalizeAddr } from '@/lib/covenant/utils';
import { VDONATE_PRODUCT_NAME, VDONATE_STUDIO_NAME, VDONATE_SHORT_NAME } from '@/lib/donations/brand';
import { HubPageAccentLayout } from '@/components/hub/HubPageAccentLayout';
import {
  scrollToCrowdKasField,
  validateL2CampaignCreateForm,
  validateL2CampaignEditForm,
} from '@/lib/donations/formValidation';

type StudioDeleteTarget =
  | { network: 'l2'; campaignId: bigint }
  | { network: 'l1'; campaignId: string };

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
    mainContent: '',
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
  const [createFormRequirements, setCreateFormRequirements] = useState<string[]>([]);
  const [editFormRequirements, setEditFormRequirements] = useState<string[]>([]);
  const [covenantEditRequirements, setCovenantEditRequirements] = useState<string[]>([]);

  const [editForm, setEditForm] = useState<StudioCampaignForm>({
    title: '',
    description: '',
    mainContent: '',
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
  const [deleteTarget, setDeleteTarget] = useState<StudioDeleteTarget | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const pricing = useCrowdKasPricing();
  const { campaigns: covenantCampaigns, updateCampaign: updateCovenantCampaign, deleteCampaign: deleteCovenantCampaign, refresh: refreshCovenantCampaigns } = useCovenantCrowdfund();
  const [modulesConfig, setModulesConfig] = useState<CrowdKasModulesConfig>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const covenantPanelRef = useRef<CrowdKasCovenantPanelHandle>(null);
  const editTxPendingRef = useRef(false);
  const [l1Submitting, setL1Submitting] = useState(false);
  const [l1PricingDraft, setL1PricingDraft] = useState<CrowdKasPricingDraft>({ title: '', description: '' });
  const [editingCovenantId, setEditingCovenantId] = useState<string | null>(null);
  const [covenantEditTitle, setCovenantEditTitle] = useState('');
  const [covenantEditMemo, setCovenantEditMemo] = useState('');
  const [covenantEditSubmitting, setCovenantEditSubmitting] = useState(false);
  const [covenantEditError, setCovenantEditError] = useState<string | null>(null);
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
  const l2CreateDraft = useMemo((): CrowdKasPricingDraft => {
    const category = createForm.category && isDonationCategory(createForm.category) ? createForm.category : undefined;
    return {
      title: createForm.title,
      description: createForm.description || '',
      mainContent: createForm.mainContent || '',
      category,
      tags: normalizeTags(createForm.tags ?? []),
      goals: createForm.goals?.length ? createForm.goals : undefined,
      socialLinks: createForm.socialLinks,
      imageUrl: l2ImageSource === 'url' && l2ImageUrl.trim() ? l2ImageUrl.trim() : undefined,
      imageHash: l2ImageSource === 'file' && l2ImageCid ? l2ImageCid : undefined,
      targetKas: createForm.targetKAS,
      endDate: createForm.endDate,
      modules: modulesConfig,
    };
  }, [createForm, l2ImageCid, l2ImageSource, l2ImageUrl, modulesConfig]);

  const l2EditDraft = useMemo((): CrowdKasPricingDraft => {
    const category = editForm.category && isDonationCategory(editForm.category) ? editForm.category : undefined;
    const unlocked =
      editingV2CampaignId != null ? unlockByCampaignId.get(editingV2CampaignId.toString()) : undefined;
    const excludePaidModuleIds = (['featured', 'l1Tips'] as const).filter((id) => unlocked?.[id]);
    return {
      title: editForm.title,
      description: editForm.description || '',
      mainContent: editForm.mainContent || '',
      category,
      tags: normalizeTags(editForm.tags ?? []),
      goals: editForm.goals?.length ? editForm.goals : undefined,
      socialLinks: editForm.socialLinks,
      imageUrl: editImageSource === 'url' && editImageUrl.trim() ? editImageUrl.trim() : undefined,
      imageHash: editImageSource === 'file' && editImageCid ? editImageCid : undefined,
      targetKas: editOnChainLock ? formatEther(editOnChainLock.targetWei) : undefined,
      endDate: editOnChainLock ? new Date(Number(editOnChainLock.deadline) * 1000).toISOString().slice(0, 16) : undefined,
      l1Address: editOnChainLock?.l1Address,
      modules: editModulesConfig,
      excludePaidModuleIds: excludePaidModuleIds.length ? [...excludePaidModuleIds] : undefined,
    };
  }, [
    editForm,
    editImageCid,
    editImageSource,
    editImageUrl,
    editModulesConfig,
    editOnChainLock,
    editingV2CampaignId,
    unlockByCampaignId,
  ]);

  const covenantEditDraft = useMemo(
    (): CrowdKasPricingDraft => ({
      title: covenantEditTitle,
      description: covenantEditMemo,
    }),
    [covenantEditMemo, covenantEditTitle],
  );

  const l1CreateQuote = useMemo(
    () => pricing.estimateL1Quote('create', { draft: l1PricingDraft }),
    [l1PricingDraft, pricing],
  );
  const l1EditQuote = useMemo(
    () => pricing.estimateL1Quote('edit', { draft: covenantEditDraft }),
    [covenantEditDraft, pricing],
  );
  const l2CreateQuote = useMemo(() => pricing.estimateL2Quote('create', { draft: l2CreateDraft }), [l2CreateDraft, pricing]);
  const l2EditQuote = useMemo(() => pricing.estimateL2Quote('edit', { draft: l2EditDraft }), [l2EditDraft, pricing]);

  useEffect(() => {
    setCreateFormRequirements([]);
  }, [l1PricingDraft, l2CreateDraft, createForm, modulesConfig]);

  useEffect(() => {
    setEditFormRequirements([]);
  }, [l2EditDraft, editForm, editModulesConfig]);

  useEffect(() => {
    setCovenantEditRequirements([]);
  }, [covenantEditTitle, covenantEditMemo]);

  const studioTabRaw = searchParams.get('tab');
  const studioTab =
    studioTabRaw === 'l2-escrow' || studioTabRaw === 'l2'
      ? 'l2-escrow'
      : studioTabRaw === 'my-campaigns' || studioTabRaw === 'archive'
        ? 'my-campaigns'
        : studioTabRaw === 'how-it-works' || studioTabRaw === 'help'
          ? 'how-it-works'
          : 'l1-covenant';
  const isFullWidthStudioTab =
    (studioTab === 'my-campaigns' && !showEditForm && editingCovenantId == null) || studioTab === 'how-it-works';
  const useStudioRightPanel =
    studioTab === 'l1-covenant' ||
    studioTab === 'l2-escrow' ||
    (studioTab === 'my-campaigns' && (showEditForm || editingCovenantId != null));

  const previewMetadata = useMemo((): DonationCampaignMetadata => {
    const category = createForm.category && isDonationCategory(createForm.category) ? createForm.category : undefined;
    const tags = normalizeTags(createForm.tags ?? []);
    return {
      title: createForm.title,
      description: createForm.description || '',
      mainContent: createForm.mainContent || '',
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
    setEditingCovenantId(null);
    setCovenantEditError(null);
  };

  const loadCovenantEditForm = (campaign: import('@/lib/covenant/crowdfund-types').CrowdfundCampaign) => {
    setEditingCovenantId(campaign.id);
    setCovenantEditTitle(campaign.title);
    setCovenantEditMemo(campaign.memo);
    setCovenantEditError(null);
    setShowEditForm(false);
    setEditingV2CampaignId(null);
    requestAnimationFrame(() => {
      document.getElementById('crowdkas-edit-campaign')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSaveCovenantEdit = async () => {
    if (!editingCovenantId || !covenantEditTitle.trim()) {
      setCovenantEditRequirements(['Campaign title']);
      setCovenantEditError('Complete required fields before saving.');
      scrollToCrowdKasField('crowdkas-edit-campaign');
      return;
    }
    setCovenantEditRequirements([]);
    setCovenantEditSubmitting(true);
    setCovenantEditError(null);
    try {
      await updateCovenantCampaign(editingCovenantId, {
        title: covenantEditTitle,
        memo: covenantEditMemo,
      });
      closeEditCampaignForm();
      void refreshCovenantCampaigns();
    } catch (e) {
      setCovenantEditError(getErrorMessage(e, 'Failed to update campaign'));
    } finally {
      setCovenantEditSubmitting(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteErrorMsg(null);
  };

  const confirmDeleteCampaign = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    setDeleteErrorMsg(null);
    try {
      if (deleteTarget.network === 'l2') {
        if (!address || !igraEscrowV2Address) {
          setDeleteErrorMsg('Connect your Igra (EVM) wallet to cancel this campaign on-chain.');
          return;
        }
        const campaign = myCampaignsV2.find((c) => c.campaignId === deleteTarget.campaignId);
        if (!campaign) {
          setDeleteErrorMsg('Campaign not found.');
          return;
        }
        const canDelete =
          campaign.active &&
          campaign.raisedWei === 0n &&
          campaign.donorCount === 0n &&
          (campaign.l1RecordedTotalWei ?? 0n) === 0n &&
          (campaign.l1RecordedDonationCount ?? 0n) === 0n;
        if (!canDelete) {
          setDeleteErrorMsg('Cannot delete a campaign that has received donations.');
          return;
        }
        const hash = await writeContractAsync({
          chainId: VDONATIONS_CHAIN_ID,
          address: igraEscrowV2Address as Address,
          abi: DONATION_ESCROW_V2_ABI,
          functionName: 'cancelCampaign',
          args: [deleteTarget.campaignId],
        });
        await waitForTransactionReceipt(wagmiChainConfig, { hash });
        if (editingV2CampaignId === deleteTarget.campaignId) closeEditCampaignForm();
        closeDeleteModal();
        void refetchMyCampaignsV2();
      } else {
        const campaign = covenantCampaigns.find((c) => c.id === deleteTarget.campaignId);
        if (!campaign) {
          setDeleteErrorMsg('Campaign not found.');
          return;
        }
        const backers = campaign.pledges.filter((p) => !p.refunded).length;
        if (backers > 0) {
          setDeleteErrorMsg('Cannot delete a campaign that has received pledges.');
          return;
        }
        await deleteCovenantCampaign(deleteTarget.campaignId, campaign.creator);
        if (editingCovenantId === deleteTarget.campaignId) closeEditCampaignForm();
        closeDeleteModal();
        void refreshCovenantCampaigns();
      }
    } catch (e) {
      setDeleteErrorMsg(getErrorMessage(e, 'Delete failed'));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleDeleteCovenantCampaign = (campaignId: string) => {
    setDeleteErrorMsg(null);
    setDeleteTarget({ network: 'l1', campaignId });
  };

  const handleDeleteL2Campaign = (campaignId: bigint) => {
    setDeleteErrorMsg(null);
    setDeleteTarget({ network: 'l2', campaignId });
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
      if (editTxPendingRef.current) {
        editTxPendingRef.current = false;
        closeEditCampaignForm();
        setEditSubmitting(false);
      }
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

  useEffect(() => {
    if (updateError && editTxPendingRef.current) {
      editTxPendingRef.current = false;
      setEditSubmitting(false);
    }
  }, [updateError]);

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
    if (!igraEscrowV2Address) return;
    writeContract({
      chainId: VDONATIONS_CHAIN_ID,
      address: igraEscrowV2Address as Address,
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
    const validation = covenantPanelRef.current?.validate();
    if (!validation?.ok) {
      setCreateFormRequirements(validation?.requirements ?? []);
      setCreateErrorMsg(validation?.error ?? 'Complete required fields before paying.');
      scrollToCrowdKasField(validation?.focusId);
      return;
    }
    setCreateFormRequirements([]);
    setCreateErrorMsg(null);
    setL1Submitting(true);
    try {
      await covenantPanelRef.current?.submit();
    } catch (e) {
      setCreateErrorMsg(getErrorMessage(e, 'Failed to create campaign'));
    } finally {
      setL1Submitting(false);
    }
  };

  const handleCreateCampaignV2 = async () => {
    const validation = validateL2CampaignCreateForm({
      title: createForm.title,
      shortDescription: createForm.description,
      mainContent: createForm.mainContent ?? '',
      targetKas: createForm.targetKAS,
      endDate: createForm.endDate,
      imageUrl: l2ImageSource === 'url' ? l2ImageUrl : undefined,
      imageCid: l2ImageCid,
      evmConnected: Boolean(address),
      evmOnIgra: onRequiredChain,
      escrowConfigured: hasEscrowV2Configured,
      verified: Boolean(isVerifiedV2),
      modules: modulesConfig,
      creatorKaspaAddress: kaspaState.address,
    });
    if (!validation.ok) {
      setCreateFormRequirements(validation.requirements);
      setCreateErrorMsg(validation.error ?? 'Complete required fields before paying.');
      scrollToCrowdKasField(validation.focusId);
      return;
    }
    if (!address || !igraEscrowV2Address) {
      setCreateErrorMsg('Connect your Igra wallet and ensure DonationEscrowV2 is configured.');
      return;
    }
    setCreateFormRequirements([]);
    setCreateSubmitting(true);
    setCreateErrorMsg(null);
    try {
      const category = createForm.category && isDonationCategory(createForm.category) ? createForm.category : undefined;
      const tags = normalizeTags(createForm.tags ?? []);

      const metadata: DonationCampaignMetadata = {
        title: createForm.title,
        description: createForm.description || '',
        mainContent: createForm.mainContent || undefined,
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
      const endDate = new Date(createForm.endDate);
      const targetWei = parseEther(createForm.targetKAS);
      const deadline = BigInt(Math.floor(endDate.getTime() / 1000));
      const method = 0 as const;
      const l1Address = '';

      const hash = await writeContractAsync({
        chainId: VDONATIONS_CHAIN_ID,
        address: igraEscrowV2Address as Address,
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
        mainContent: createForm.mainContent || undefined,
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
    if (!igraEscrowV2Address) return;
    writeContract({
      chainId: VDONATIONS_CHAIN_ID,
      address: igraEscrowV2Address as Address,
      abi: DONATION_ESCROW_V2_ABI,
      functionName: 'claim',
      args: [campaignId],
    });
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
        mainContent: meta?.mainContent ?? '',
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
        mainContent: meta?.mainContent ?? '',
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
    const validation = validateL2CampaignEditForm({
      title: editForm.title,
      shortDescription: editForm.description,
      mainContent: editForm.mainContent ?? '',
      imageUrl: editImageSource === 'url' ? editImageUrl : undefined,
      imageCid: editImageCid,
      evmConnected: Boolean(address),
      evmOnIgra: onRequiredChain,
      escrowConfigured: hasEscrowV2Configured,
      modules: editModulesConfig,
      creatorKaspaAddress: kaspaState.address,
    });
    if (!validation.ok) {
      setEditFormRequirements(validation.requirements);
      setEditErrorMsg(validation.error ?? 'Complete required fields before saving.');
      scrollToCrowdKasField(validation.focusId);
      return;
    }
    if (!address || !igraEscrowV2Address || editingV2CampaignId == null || !editOnChainLock) {
      setEditErrorMsg('Connect your Igra wallet to save changes.');
      return;
    }
    setEditFormRequirements([]);
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
        mainContent: editForm.mainContent || undefined,
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

      editTxPendingRef.current = true;
      writeContract({
        chainId: VDONATIONS_CHAIN_ID,
        address: igraEscrowV2Address as Address,
        abi: DONATION_ESCROW_V2_ABI,
        functionName: 'updateCampaign',
        args: [editingV2CampaignId, ipfsHash, targetWei, deadline, l1Address],
      });
    } catch (e) {
      editTxPendingRef.current = false;
      setEditErrorMsg(getErrorMessage(e, 'Failed to update campaign'));
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
        mainContent: editForm.mainContent || undefined,
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
      editTxPendingRef.current = true;
      writeContract({
        address: writeEscrowAddress as Address,
        abi: DONATION_ESCROW_ABI,
        functionName: 'updateCampaign',
        args: [ipfsHash, targetWei, deadline, l1Address],
      });
    } catch (e) {
      editTxPendingRef.current = false;
      setEditErrorMsg(getErrorMessage(e, 'Failed to update campaign'));
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
      {deleteTarget ? (
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
            onClick={closeDeleteModal}
          />
          <div className="relative z-[1] max-w-md w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <h3 id="delete-campaign-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Delete this campaign?
            </h3>
            {deleteTarget.network === 'l2' ? (
              <p className="kx-body mt-3">
                This action is <strong className="text-red-700 dark:text-red-400">irreversible</strong>. Campaign #
                {deleteTarget.campaignId.toString()} will be cancelled on Igra and removed from public listings and your
                studio. No KAS platform fee applies. Your Igra wallet signs one free{' '}
                <code className="font-mono text-xs">cancelCampaign</code> transaction (network gas in iKAS only).
              </p>
            ) : (
              <p className="kx-body mt-3">
                This action is <strong className="text-red-700 dark:text-red-400">irreversible</strong>. The L1 covenant
                campaign will be removed from your studio and public listings immediately. No wallet payment is required
                when the campaign has no pledges.
              </p>
            )}
            {deleteErrorMsg ? (
              <p className="text-sm text-red-600 dark:text-red-400 mt-3">{deleteErrorMsg}</p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium"
                onClick={closeDeleteModal}
                disabled={deleteSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                onClick={() => void confirmDeleteCampaign()}
                disabled={
                  deleteSubmitting ||
                  (deleteTarget.network === 'l2' && (!address || !igraEscrowV2Address))
                }
              >
                {deleteSubmitting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <HubPageAccentLayout projectId="kasparex-donations">
          <div className="hidden lg:block flex-shrink-0">
            <DonationsSidebar variant="minimal" showStudioSections backLink={{ href: '/donations', label: 'All campaigns' }} />
          </div>
          <div className="lg:hidden flex-shrink-0">
            <DonationsSidebar variant="minimal" showStudioSections backLink={{ href: '/donations', label: 'All campaigns' }} />
          </div>

          <div className="flex-1 min-w-0 p-4 sm:p-8 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
            <div className={isFullWidthStudioTab ? 'w-full' : 'max-w-6xl mx-auto'}>
              <div className="mb-8">
                <p className="mb-4 text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  Creator dashboard
                </p>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="h-7 w-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                    aria-hidden="true"
                  />
                  <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight tracking-tight">
                    {VDONATE_SHORT_NAME} <span className="text-emerald-600 dark:text-emerald-400">Studio</span>
                  </h1>
                </div>
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
                      className={`grid grid-cols-1 gap-6 items-start ${
                        useStudioRightPanel ? 'xl:grid-cols-[minmax(0,1fr)_340px]' : ''
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
                                studioTotalKas={l1CreateQuote.totalKas}
                                onPricingDraftChange={setL1PricingDraft}
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

                  {(hasEscrowV2Configured || writeEscrowAddress) && (
                    <div className="flex flex-col gap-6">
                      {hasEscrowV2Configured && (
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
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <KxFormFieldLabel>
                                      Title <span className="text-red-500">*</span>
                                    </KxFormFieldLabel>
                                    <span
                                      className={`text-xs ${
                                        getCrowdKasCharacterCount(createForm.title) > CROWDKAS_CONTENT_LIMITS.title.max
                                          ? 'text-red-500'
                                          : 'text-zinc-500'
                                      }`}
                                    >
                                      {getCrowdKasCharacterCount(createForm.title)} / {CROWDKAS_CONTENT_LIMITS.title.max}
                                    </span>
                                  </div>
                                  <input
                                    id="crowdkas-l2-title"
                                    type="text"
                                    value={createForm.title}
                                    onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                                    maxLength={CROWDKAS_CONTENT_LIMITS.title.max}
                                    className="k-input text-base"
                                    placeholder="Campaign title"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <KxFormFieldLabel>Short Description</KxFormFieldLabel>
                                    <span
                                      className={`text-xs ${
                                        getCrowdKasCharacterCount(createForm.description) >
                                        CROWDKAS_CONTENT_LIMITS.description.max
                                          ? 'text-red-500'
                                          : 'text-zinc-500'
                                      }`}
                                    >
                                      {getCrowdKasCharacterCount(createForm.description)} /{' '}
                                      {CROWDKAS_CONTENT_LIMITS.description.max}
                                    </span>
                                  </div>
                                  <textarea
                                    id="crowdkas-l2-short-description"
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                                    placeholder="Brief summary for cards and listings"
                                    maxLength={CROWDKAS_CONTENT_LIMITS.description.max}
                                    rows={3}
                                    className="k-input text-base w-full resize-y min-h-[4.5rem]"
                                  />
                                </div>
                                <div>
                                  <KxFormFieldLabel>Main content</KxFormFieldLabel>
                                  <KxRichTextEditor
                                    value={createForm.mainContent ?? ''}
                                    onChange={(value) => setCreateForm((f) => ({ ...f, mainContent: value }))}
                                    minRows={14}
                                    placeholder="Primary campaign story and details"
                                  />
                                </div>
                                <div className={CROWDKAS_PREMIUM_MODULE_CARD_CLASS}>
                                  <KxInFormPremiumRow
                                    flat
                                    title={CROWDKAS_PREMIUM_SECTION_OFFER.title}
                                    description={CROWDKAS_PREMIUM_SECTION_OFFER.description}
                                    priceLabel={`+${CROWDKAS_PREMIUM_SECTION_ENABLE_FEE_KAS} iKAS`}
                                    checked={Boolean(modulesConfig.premiumSectionEnabled)}
                                    onToggle={() =>
                                      setModulesConfig((m) => ({
                                        ...m,
                                        premiumSectionEnabled: !m.premiumSectionEnabled,
                                      }))
                                    }
                                    accent="hub"
                                  />
                                  {modulesConfig.premiumSectionEnabled ? (
                                    <CrowdKasPremiumSectionFields modules={modulesConfig} onChange={setModulesConfig} />
                                  ) : null}
                                </div>
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
                                <CrowdKasCampaignMediaField
                                  source={l2ImageSource}
                                  onSourceChange={setL2ImageSource}
                                  url={l2ImageUrl}
                                  onUrlChange={setL2ImageUrl}
                                  cid={l2ImageCid}
                                  onCidChange={setL2ImageCid}
                                  fileName={l2ImageFileName}
                                  onFileNameChange={setL2ImageFileName}
                                  label="Cover image"
                                />
                                {createErrorMsg && <p className="text-sm text-red-600 dark:text-red-400">{createErrorMsg}</p>}
                                {createError && <p className="text-sm text-red-600 dark:text-red-400">{getErrorMessage(createError, 'Create failed')}</p>}
                              </div>
                            </div>

                          <div id="crowdkas-dashboard-modules" className={`${CROWDKAS_FORM_PANEL_CLASS} scroll-mt-24 my-2 py-10 sm:py-12 space-y-6`}>
                            <CrowdKasModulesPanel
                              modules={modulesConfig}
                              onChange={setModulesConfig}
                              network="l2"
                              hidePremiumSection
                            />
                          </div>
                        </>
                      )}

                      {/* Legacy V1 (fallback when V2 not configured) */}
                      {(!hasEscrowV2Configured) && (
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
                      updateErrorMsg={null}
                      isSubmitting={editSubmitting || isUpdatePending}
                      onSave={editingV2CampaignId != null ? handleUpdateCampaignV2 : handleUpdateCampaign}
                      onCancel={closeEditCampaignForm}
                      hideActions
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
                            {editingCovenantId != null ? (
                              <div id="crowdkas-edit-campaign" className={`${CROWDKAS_FORM_PANEL_CLASS} scroll-mt-24 space-y-6`}>
                                <div>
                                  <DAppSectionHeader title="Edit L1 campaign" className="mb-3" />
                                  <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    Update covenant presentation
                                  </h3>
                                  <p className="kx-body mt-2">
                                    Title and description can be updated. Goal, deadline, and pledges stay locked on-chain.
                                  </p>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <KxFormFieldLabel>Title <span className="text-red-500">*</span></KxFormFieldLabel>
                                    <span className="text-xs text-zinc-500">
                                      {getCrowdKasCharacterCount(covenantEditTitle)} / {CROWDKAS_CONTENT_LIMITS.title.max}
                                    </span>
                                  </div>
                                  <input
                                    className="k-input text-base"
                                    value={covenantEditTitle}
                                    maxLength={CROWDKAS_CONTENT_LIMITS.title.max}
                                    onChange={(e) => setCovenantEditTitle(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <KxFormFieldLabel>Short Description</KxFormFieldLabel>
                                    <span className="text-xs text-zinc-500">
                                      {getCrowdKasCharacterCount(covenantEditMemo)} /{' '}
                                      {CROWDKAS_CONTENT_LIMITS.description.max}
                                    </span>
                                  </div>
                                  <textarea
                                    className="k-input text-base w-full resize-y min-h-[4.5rem]"
                                    value={covenantEditMemo}
                                    maxLength={CROWDKAS_CONTENT_LIMITS.description.max}
                                    onChange={(e) => setCovenantEditMemo(e.target.value)}
                                    placeholder="Brief summary for cards and listings"
                                  />
                                </div>
                                {covenantEditError ? (
                                  <p className="text-sm text-red-600 dark:text-red-400">{covenantEditError}</p>
                                ) : null}
                              </div>
                            ) : showEditForm ? (
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
                                  updateErrorMsg={null}
                                  isSubmitting={editSubmitting || isUpdatePending}
                                  onSave={editingV2CampaignId != null ? handleUpdateCampaignV2 : handleUpdateCampaign}
                                  onCancel={closeEditCampaignForm}
                                  hideActions
                                />
                              </div>
                            ) : (
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
                                onDelete={handleDeleteL2Campaign}
                                onEditCovenant={loadCovenantEditForm}
                                onDeleteCovenant={handleDeleteCovenantCampaign}
                              />
                            )}
                          </div>
                        )}

                        {activeTab === 'how-it-works' && (
                          <section id="how-it-works" className={`${CROWDKAS_FORM_PANEL_CLASS} w-full scroll-mt-24 space-y-6`}>
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

                      {editingCovenantId != null && studioTab === 'my-campaigns' ? (
                        <CrowdKasStudioRightPanel
                          network="l1"
                          quote={l1EditQuote}
                          tier={pricing.tier}
                          infoText="Update L1 covenant campaign metadata on Kaspa. Full covenant logic will apply once covenants are live and integrated."
                          onSubmit={handleSaveCovenantEdit}
                          submitLabel="Save L1 changes"
                          submittingLabel="Updating…"
                          isSubmitting={covenantEditSubmitting}
                          submitDisabled={covenantEditSubmitting}
                          onCancel={closeEditCampaignForm}
                          error={covenantEditError}
                          requirementsNote={covenantEditRequirements}
                        />
                      ) : showEditForm && (studioTab === 'my-campaigns' || studioTab === 'l2-escrow') ? (
                        <CrowdKasStudioRightPanel
                          network="l2"
                          quote={l2EditQuote}
                          infoText="Update L2 campaign metadata on Igra. New paid modules selected here are billed in iKAS on L2."
                          onSubmit={editingV2CampaignId != null ? handleUpdateCampaignV2 : handleUpdateCampaign}
                          submitLabel="Save changes"
                          submittingLabel="Updating…"
                          isSubmitting={editSubmitting || isUpdatePending}
                          submitDisabled={editSubmitting || isUpdatePending}
                          onCancel={closeEditCampaignForm}
                          error={editErrorMsg ?? (updateError ? getErrorMessage(updateError, 'Update failed') : null)}
                          requirementsNote={editFormRequirements}
                        />
                      ) : activeTab === 'l1-covenant' ? (
                        <CrowdKasStudioRightPanel
                          network="l1"
                          quote={l1CreateQuote}
                          tier={pricing.tier}
                          infoText="Launch your L1 covenant campaign on Kaspa. One payment covers creation, payload size, and any enabled modules."
                          onSubmit={handleCreateL1Covenant}
                          submitLabel="Create L1 campaign"
                          isSubmitting={l1Submitting}
                          submitDisabled={l1Submitting}
                          error={createErrorMsg ?? (createError ? getErrorMessage(createError, 'Create failed') : null)}
                          requirementsNote={createFormRequirements}
                        />
                      ) : activeTab === 'l2-escrow' ? (
                        <CrowdKasStudioRightPanel
                          network="l2"
                          quote={l2CreateQuote}
                          infoText="Create your L2 escrow campaign on Igra. One iKAS payment covers platform fees and any enabled modules."
                          onSubmit={handleCreateCampaignV2}
                          submitLabel="Create L2 campaign"
                          isSubmitting={createSubmitting || isCreatePending}
                          submitDisabled={createSubmitting || isCreatePending}
                          onPreview={() => setPreviewOpen(true)}
                          error={createErrorMsg ?? (createError ? getErrorMessage(createError, 'Create failed') : null)}
                          requirementsNote={createFormRequirements}
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
