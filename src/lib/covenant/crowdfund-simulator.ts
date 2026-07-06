import { COVENANT_LAB_CONFIG } from './config';
import type { CovenantWalletContext } from './context';
import { requireCovenantContext } from './context';
import type { CrowdfundRuntime } from './crowdfund-runtime';
import type {
  CreateCrowdfundParams,
  CrowdfundCampaign,
  PledgeParams,
} from './crowdfund-types';
import { loadMap, normalizeAddr, randomHex, randomId, saveMap } from './utils';

const STORAGE = () => COVENANT_LAB_CONFIG.crowdfundStorageKey;

function sumPledges(campaign: CrowdfundCampaign): bigint {
  return campaign.pledges
    .filter((p) => !p.refunded)
    .reduce((s, p) => s + BigInt(p.amountSompi), 0n);
}

function resolveStatus(campaign: CrowdfundCampaign): CrowdfundCampaign['status'] {
  if (campaign.status === 'succeeded') return 'succeeded';
  const raised = sumPledges(campaign);
  const goal = BigInt(campaign.goalSompi);
  if (Date.now() < campaign.deadline) return 'funding';
  return raised >= goal ? 'succeeded' : 'failed';
}

class CrowdfundSimulator implements CrowdfundRuntime {
  readonly mode = 'simulator' as const;
  readonly effectiveMode = 'simulator' as const;

  private campaigns = loadMap<CrowdfundCampaign>(STORAGE());

  private persist(): void {
    saveMap(STORAGE(), this.campaigns);
  }

  async create(params: CreateCrowdfundParams): Promise<CrowdfundCampaign> {
    const goal = BigInt(params.goalSompi);
    const min = BigInt(COVENANT_LAB_CONFIG.minLockSompi);
    if (goal < min) throw new Error(`Minimum goal is ${Number(min) / 1e8} KAS`);
    if (!params.title.trim()) throw new Error('Title required');
    if (params.deadline <= Date.now()) throw new Error('Deadline must be in the future');

    const id = randomId('cf');
    const campaign: CrowdfundCampaign = {
      id,
      covenantId: `cov_cf_${randomHex(10)}`,
      status: 'funding',
      creator: params.creator,
      title: params.title.trim(),
      memo: params.memo.trim(),
      goalSompi: params.goalSompi,
      raisedSompi: '0',
      deadline: params.deadline,
      pledges: [],
      createdAt: Date.now(),
      claimedAt: null,
    };
    this.campaigns.set(id, campaign);
    this.persist();
    return campaign;
  }

  async pledge(
    campaignId: string,
    backer: string,
    amountSompi: string,
    ctx: CovenantWalletContext
  ): Promise<CrowdfundCampaign> {
    requireCovenantContext(ctx);
    return this.pledgeInternal({
      campaignId,
      backer,
      amountSompi,
      txHash: undefined,
    });
  }

  private async pledgeInternal(params: PledgeParams): Promise<CrowdfundCampaign> {
    const campaign = this.campaigns.get(params.campaignId);
    if (!campaign) throw new Error('Campaign not found');
    if (Date.now() >= campaign.deadline) throw new Error('Funding period ended');
    if (BigInt(params.amountSompi) <= 0n) throw new Error('Pledge must be positive');

    const pledge = {
      id: randomId('plg'),
      backer: params.backer,
      amountSompi: params.amountSompi,
      txHash: params.txHash,
      refunded: false,
      createdAt: Date.now(),
    };
    const pledges = [...campaign.pledges, pledge];
    const raised = pledges
      .filter((p) => !p.refunded)
      .reduce((s, p) => s + BigInt(p.amountSompi), 0n);
    const updated: CrowdfundCampaign = {
      ...campaign,
      pledges,
      raisedSompi: String(raised),
      status: 'funding',
    };
    this.campaigns.set(params.campaignId, updated);
    this.persist();
    return updated;
  }

  async claimByCreator(
    campaignId: string,
    claimer: string,
    _ctx: CovenantWalletContext
  ): Promise<CrowdfundCampaign> {
    let campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    if (normalizeAddr(claimer) !== normalizeAddr(campaign.creator)) {
      throw new Error('Only the creator can claim funds');
    }
    campaign = { ...campaign, status: resolveStatus(campaign) };
    if (campaign.status !== 'succeeded') {
      throw new Error('Goal not reached or deadline not passed');
    }
    if (campaign.claimedAt) throw new Error('Already claimed');

    const updated: CrowdfundCampaign = { ...campaign, claimedAt: Date.now() };
    this.campaigns.set(campaignId, updated);
    this.persist();
    return updated;
  }

  async refundPledge(
    campaignId: string,
    pledgeId: string,
    claimer: string,
    _ctx: CovenantWalletContext
  ): Promise<CrowdfundCampaign> {
    let campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    campaign = { ...campaign, status: resolveStatus(campaign) };
    if (campaign.status !== 'failed') {
      throw new Error('Refunds only after failed campaign (deadline passed, goal not met)');
    }
    const pledge = campaign.pledges.find((p) => p.id === pledgeId);
    if (!pledge) throw new Error('Pledge not found');
    if (normalizeAddr(claimer) !== normalizeAddr(pledge.backer)) {
      throw new Error('Only the backer can refund their pledge');
    }
    if (pledge.refunded) throw new Error('Already refunded');

    const pledges = campaign.pledges.map((p) =>
      p.id === pledgeId ? { ...p, refunded: true } : p
    );
    const raised = pledges
      .filter((p) => !p.refunded)
      .reduce((s, p) => s + BigInt(p.amountSompi), 0n);
    const updated: CrowdfundCampaign = {
      ...campaign,
      pledges,
      raisedSompi: String(raised),
    };
    this.campaigns.set(campaignId, updated);
    this.persist();
    return updated;
  }

  async listAll(): Promise<CrowdfundCampaign[]> {
    return Array.from(this.campaigns.values())
      .map((c) => ({ ...c, status: resolveStatus(c) }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async listForAddress(address: string): Promise<CrowdfundCampaign[]> {
    const norm = normalizeAddr(address);
    return (await this.listAll()).filter(
      (c) =>
        normalizeAddr(c.creator) === norm ||
        c.pledges.some((p) => normalizeAddr(p.backer) === norm)
    );
  }

  async getById(id: string): Promise<CrowdfundCampaign | null> {
    const c = this.campaigns.get(id);
    if (!c) return null;
    return { ...c, status: resolveStatus(c) };
  }
}

let instance: CrowdfundSimulator | null = null;
export function getCrowdfundSimulator(): CrowdfundSimulator {
  if (!instance) instance = new CrowdfundSimulator();
  return instance;
}
