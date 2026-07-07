'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useDAOVoting, Vote } from '@/hooks/useDAOVoting';
import { TransactionTracker } from '@/components/transactions/TransactionTracker';
import { RewardStatusBox } from '@/components/rewards/RewardStatusBox';
import { DAppWidgetShell } from '@/components/dapps/DAppWidgetShell';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { useRegisterDAppWidgetRailSlot } from '@/lib/dapps/DAppWidgetActionRailContext';
import { useSyncDAppWidgetQuote } from '@/lib/dapps/PaymentAmountContext';
import { KxAlertRegion } from '@/components/ui/KxAlertRegion';
import { KxAlert } from '@/components/ui/KxAlert';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import {
  KX_EMPTY_STATE,
  KX_INPUT,
  KX_SURFACE_ROW,
  KX_TEXTAREA,
} from '@/lib/hub/shellTokens';

export function DAOVotingWidget() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userVotes, setUserVotes] = useState<Map<bigint, Vote>>(new Map());

  const contractAddress = getContractAddress(chainId, 'DAOVoting');

  const {
    proposals,
    isLoading,
    error,
    submitProposal,
    vote,
    changeVote,
    getUserVote,
    refreshProposals,
    voteFee,
    proposalCount,
    txHash,
    isConfirmed,
    lastActionType,
  } = useDAOVoting();

  useEffect(() => {
    if (!isConnected || !address || !contractAddress || proposals.length === 0) {
      setUserVotes(new Map());
      return;
    }

    let cancelled = false;

    const loadUserVotes = async () => {
      const results = await Promise.all(
        proposals
          .filter((proposal) => proposal.id && proposal.id > 0n)
          .map(async (proposal) => {
            try {
              const userVote = await getUserVote(proposal.id);
              return userVote && userVote.timestamp > 0n
                ? ([proposal.id, userVote] as const)
                : null;
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : String(err);
              if (message.includes('Invalid proposal ID')) return null;
              console.error(`Error loading vote for proposal ${proposal.id}:`, err);
              return null;
            }
          }),
      );

      if (cancelled) return;

      const votesMap = new Map<bigint, Vote>();
      for (const entry of results) {
        if (entry) votesMap.set(entry[0], entry[1]);
      }
      setUserVotes(votesMap);
    };

    void loadUserVotes();
    return () => {
      cancelled = true;
    };
  }, [isConnected, address, contractAddress, proposals, getUserVote]);

  const handleSubmitProposal = async () => {
    if (!title.trim() || !description.trim()) return;
    if (title.length > 200 || description.length > 2000) return;

    try {
      await submitProposal(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      setShowSubmitForm(false);
      setTimeout(() => void refreshProposals(), 3000);
    } catch (err) {
      console.error('Error submitting proposal:', err);
    }
  };

  const handleVote = async (proposalId: bigint, support: boolean) => {
    try {
      const existingVote = userVotes.get(proposalId);
      if (existingVote) await changeVote(proposalId, support);
      else await vote(proposalId, support);
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const formatDate = (timestamp: bigint) =>
    new Date(Number(timestamp) * 1000).toLocaleString();

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  useSyncDAppWidgetQuote(null, showSubmitForm ? 'submit-proposal' : 'cast-vote');

  const railActions =
    showSubmitForm && isConnected ? (
      <button
        type="button"
        onClick={() => void handleSubmitProposal()}
        disabled={isLoading || !title.trim() || !description.trim()}
        className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Submitting...' : 'Submit Proposal'}
      </button>
    ) : null;

  useRegisterDAppWidgetRailSlot('actions', railActions, [
    showSubmitForm,
    isLoading,
    title,
    description,
    isConnected,
  ]);

  const railAlerts = useMemo(() => {
    if (!error) return null;
    return (
      <KxAlertRegion>
        <KxAlert variant="error" title="Action failed">
          {error}
        </KxAlert>
      </KxAlertRegion>
    );
  }, [error]);

  useRegisterDAppWidgetRailSlot('alerts', railAlerts, [error]);

  if (!isConnected) {
    return (
      <DAppWidgetShell>
        <div className={KX_EMPTY_STATE}>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Connect your L2 wallet to use DAO Voting.</p>
        </div>
      </DAppWidgetShell>
    );
  }

  if (!contractAddress) {
    return (
      <DAppWidgetShell>
        <div className={KX_EMPTY_STATE}>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            DAO Voting contract not deployed on this network.
          </p>
        </div>
      </DAppWidgetShell>
    );
  }

  return (
    <DAppWidgetShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DAppSectionHeader
          title={`Proposals${proposalCount !== null ? ` (${proposalCount.toString()})` : ''}`}
          hint="Submit and vote on future dApp ideas."
          className="!mb-0"
        />
        <button
          type="button"
          onClick={() => setShowSubmitForm((open) => !open)}
          className="k-control-btn shrink-0 !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94]"
        >
          {showSubmitForm ? 'Cancel' : 'Submit Proposal'}
        </button>
      </div>

      {showSubmitForm ? (
        <div className={`${KX_SURFACE_ROW} space-y-4`}>
          <DAppSectionHeader title="New proposal" className="!mb-0" />
          <div>
            <KxFormFieldLabel tooltip="Max 200 characters">Title</KxFormFieldLabel>
            <input
              id="dao-proposal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Enter proposal title"
              className={KX_INPUT}
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{title.length}/200</p>
          </div>
          <div>
            <KxFormFieldLabel tooltip="Max 2000 characters">Description</KxFormFieldLabel>
            <textarea
              id="dao-proposal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={6}
              placeholder="Describe your dApp idea or concept"
              className={KX_TEXTAREA}
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{description.length}/2000</p>
          </div>
        </div>
      ) : null}

      {txHash && isConfirmed ? (
        <div className="space-y-3">
          <TransactionTracker txHash={txHash} compact />
          <RewardStatusBox
            txHash={txHash}
            network="L2"
            dAppId="dao-voting"
            actionType={lastActionType || 'vote'}
            compact
          />
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Active proposals</h3>
          <button
            type="button"
            onClick={() => void refreshProposals()}
            disabled={isLoading}
            className="k-control-btn !h-auto !py-1.5 !px-3 !text-xs disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {isLoading && proposals.length === 0 ? (
          <div className={KX_EMPTY_STATE}>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading proposals...</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className={KX_EMPTY_STATE}>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No proposals yet</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Be the first to submit one.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals
              .slice()
              .reverse()
              .map((proposal) => {
                const userVote = userVotes.get(proposal.id);
                const hasVoted = Boolean(userVote && userVote.timestamp > 0n);
                const userVoteSupport = userVote?.support;

                return (
                  <article key={proposal.id.toString()} className={`${KX_SURFACE_ROW} space-y-4`}>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{proposal.title}</h4>
                        {proposal.isFlagged ? (
                          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                            Flagged
                          </span>
                        ) : null}
                      </div>
                      <p className="kx-body whitespace-pre-wrap">{proposal.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>Proposer: {formatAddress(proposal.proposer)}</span>
                        <span>{formatDate(proposal.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950/60">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Yes: {proposal.yesVotes.toString()}
                      </span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        No: {proposal.noVotes.toString()}
                      </span>
                      {hasVoted ? (
                        <span className="ml-auto text-xs font-semibold text-[#02abb8]">
                          You voted: {userVoteSupport ? 'Yes' : 'No'}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleVote(proposal.id, true)}
                        disabled={isLoading || !proposal.isActive}
                        className={`flex-1 k-control-btn disabled:cursor-not-allowed disabled:opacity-50 ${
                          hasVoted && userVoteSupport
                            ? '!border-emerald-500 !bg-emerald-600 !text-white'
                            : '!border-emerald-500/40 !text-emerald-700 dark:!text-emerald-300'
                        }`}
                      >
                        {hasVoted && userVoteSupport ? 'Voted Yes' : 'Vote Yes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleVote(proposal.id, false)}
                        disabled={isLoading || !proposal.isActive}
                        className={`flex-1 k-control-btn disabled:cursor-not-allowed disabled:opacity-50 ${
                          hasVoted && !userVoteSupport
                            ? '!border-rose-500 !bg-rose-600 !text-white'
                            : '!border-rose-500/40 !text-rose-700 dark:!text-rose-300'
                        }`}
                      >
                        {hasVoted && !userVoteSupport ? 'Voted No' : 'Vote No'}
                      </button>
                    </div>

                    {hasVoted && voteFee ? (
                      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                        Changing your vote costs {formatEther(voteFee)} wKAS
                      </p>
                    ) : null}
                  </article>
                );
              })}
          </div>
        )}
      </div>
    </DAppWidgetShell>
  );
}
