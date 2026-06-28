'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useDAOVoting, Proposal, Vote } from '@/hooks/useDAOVoting';
import { TransactionTracker } from '@/components/transactions/TransactionTracker';
import { RewardStatusBox } from '@/components/rewards/RewardStatusBox';

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
    submissionFee,
    voteFee,
    flagThreshold,
    proposalCount,
    txHash,
    isConfirmed,
    lastActionType,
  } = useDAOVoting();

  // Load user votes for all proposals
  useEffect(() => {
    if (!isConnected || !address || !contractAddress || proposals.length === 0) {
      return;
    }

    const loadUserVotes = async () => {
      const votesMap = new Map<bigint, Vote>();
      for (const proposal of proposals) {
        if (!proposal.id || proposal.id <= 0n) {
          continue;
        }
        
        try {
          const userVote = await getUserVote(proposal.id);
          if (userVote && userVote.timestamp > 0n) {
            votesMap.set(proposal.id, userVote);
          }
        } catch (err: any) {
          if (err?.message?.includes('Invalid proposal ID') || err?.shortMessage?.includes('Invalid proposal ID')) {
            continue;
          }
          console.error(`Error loading vote for proposal ${proposal.id}:`, err);
        }
      }
      setUserVotes(votesMap);
    };

    loadUserVotes();
  }, [isConnected, address, contractAddress, proposals, getUserVote]);

  const handleSubmitProposal = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please fill in both title and description');
      return;
    }

    if (title.length > 200) {
      alert('Title must be 200 characters or less');
      return;
    }

    if (description.length > 2000) {
      alert('Description must be 2000 characters or less');
      return;
    }

    try {
      await submitProposal(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      setShowSubmitForm(false);
      setTimeout(() => {
        refreshProposals();
      }, 3000);
    } catch (err) {
      console.error('Error submitting proposal:', err);
    }
  };

  const handleVote = async (proposalId: bigint, support: boolean) => {
    try {
      const existingVote = userVotes.get(proposalId);
      if (existingVote) {
        await changeVote(proposalId, support);
      } else {
        await vote(proposalId, support);
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Please connect your wallet to use DAO Voting
        </p>
      </div>
    );
  }

  if (!contractAddress) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          DAO Voting contract not deployed on this network
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Premium Header - Submit Proposal Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Proposals {proposalCount !== null && `(${proposalCount.toString()})`}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Submit and vote on future dApp ideas
          </p>
        </div>
        <button
          onClick={() => setShowSubmitForm(!showSubmitForm)}
          className="px-5 py-2.5 bg-[#02abb8] hover:bg-[#028a94] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showSubmitForm ? 'Cancel' : 'Submit Proposal'}
        </button>
      </div>

      {/* Submit Proposal Form - Premium Design */}
      {showSubmitForm && (
        <div className="p-6 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-lg">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
            Submit New Proposal
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Title (max 200 characters)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="Enter proposal title"
                className="w-full px-4 py-3 border-2 border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#02abb8] focus:border-[#02abb8] transition-all"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                {title.length}/200 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Description (max 2000 characters)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={8}
                placeholder="Describe your dApp idea or concept in detail..."
                className="w-full px-4 py-3 border-2 border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#02abb8] focus:border-[#02abb8] transition-all resize-none"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                {description.length}/2000 characters
              </p>
            </div>
            <button
              onClick={handleSubmitProposal}
              disabled={isLoading || !title.trim() || !description.trim()}
              className="w-full px-6 py-3.5 bg-[#02abb8] hover:bg-[#028a94] text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Transaction Tracker - Show after transaction */}
      {txHash && isConfirmed && (
        <div className="space-y-4">
          <TransactionTracker txHash={txHash} compact />
          <RewardStatusBox
            txHash={txHash}
            network="L2"
            dAppId="dao-voting"
            actionType={lastActionType || 'vote'}
            compact
          />
        </div>
      )}

      {/* Proposals List - Premium Design */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Active Proposals
          </h3>
          <button
            onClick={refreshProposals}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {isLoading && proposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#02abb8] mb-3"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Loading proposals...</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700">
            <svg className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">No proposals yet</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">Be the first to submit one!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {proposals
              .slice()
              .reverse()
              .map((proposal) => {
                const userVote = userVotes.get(proposal.id);
                const hasVoted = userVote && userVote.timestamp > 0n;
                const userVoteSupport = userVote?.support;

                return (
                  <div
                    key={proposal.id.toString()}
                    className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {/* Proposal Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                            {proposal.title}
                          </h4>
                          {proposal.isFlagged && (
                            <span className="px-3 py-1 text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg border border-yellow-300 dark:border-yellow-700">
                              ⚠ Flagged
                            </span>
                          )}
                        </div>
                        
                        {/* Proposal Description - More Visible */}
                        <div className="mb-5">
                          <p className="kx-body text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                            {proposal.description}
                          </p>
                        </div>
                        
                        {/* Proposal Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-500 mb-4">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Proposer: {formatAddress(proposal.proposer)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatDate(proposal.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vote Counts - Premium Display */}
                    <div className="flex items-center gap-6 mb-5 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-base font-bold text-green-600 dark:text-green-400">
                          Yes: {proposal.yesVotes.toString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-base font-bold text-red-600 dark:text-red-400">
                          No: {proposal.noVotes.toString()}
                        </span>
                      </div>
                      {hasVoted && (
                        <div className="ml-auto px-3 py-1.5 bg-[#02abb8]/10 text-[#02abb8] rounded-lg text-sm font-semibold">
                          You voted: {userVoteSupport ? 'Yes' : 'No'}
                        </div>
                      )}
                    </div>

                    {/* Vote Buttons - Premium Design */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleVote(proposal.id, true)}
                        disabled={isLoading || !proposal.isActive}
                        className={`flex-1 px-6 py-3.5 rounded-xl font-bold text-base transition-all duration-200 ${
                          hasVoted && userVoteSupport
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 border-2 border-green-300 dark:border-green-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {hasVoted && userVoteSupport ? '✓ Voted Yes' : 'Vote Yes'}
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, false)}
                        disabled={isLoading || !proposal.isActive}
                        className={`flex-1 px-6 py-3.5 rounded-xl font-bold text-base transition-all duration-200 ${
                          hasVoted && !userVoteSupport
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-red-300 dark:border-red-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {hasVoted && !userVoteSupport ? '✓ Voted No' : 'Vote No'}
                      </button>
                    </div>
                    {hasVoted && voteFee && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 text-center">
                        Changing your vote costs {formatEther(voteFee)} KAS
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
