'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { DAO_VOTING_ABI } from '@/lib/contracts/abis';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useDAOVoting, Proposal, Vote } from '@/hooks/useDAOVoting';

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
  } = useDAOVoting();

  // Load user votes for all proposals
  useEffect(() => {
    if (!isConnected || !address || !contractAddress || proposals.length === 0) {
      return;
    }

    const loadUserVotes = async () => {
      const votesMap = new Map<bigint, Vote>();
      for (const proposal of proposals) {
        try {
          const userVote = await getUserVote(proposal.id);
          if (userVote && userVote.timestamp > 0n) {
            votesMap.set(proposal.id, userVote);
          }
        } catch (err) {
          console.error(`Error loading vote for proposal ${proposal.id}:`, err);
        }
      }
      setUserVotes(votesMap);
    };

    loadUserVotes();
  }, [isConnected, address, contractAddress, proposals, getUserVote]);

  // Read user votes using readContract for each proposal
  useEffect(() => {
    if (!isConnected || !address || !contractAddress) {
      return;
    }

    // We'll use readContract hooks for each proposal
    // This is handled in the component rendering
  }, [isConnected, address, contractAddress]);

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
      setTimeout(() => {
        refreshProposals();
        // Reload user votes
        getUserVote(proposalId).then((vote) => {
          if (vote && vote.timestamp > 0n) {
            setUserVotes((prev) => new Map(prev).set(proposalId, vote));
          }
        });
      }, 3000);
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
      <div className="px-6 py-4 text-center">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Please connect your wallet to use DAO Voting
        </p>
      </div>
    );
  }

  if (!contractAddress) {
    return (
      <div className="px-6 py-4 text-center">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          DAO Voting contract not deployed on this network
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">DAO Voting</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Submit and vote on future dApp ideas for marketplace integration
          </p>
        </div>
        <button
          onClick={() => setShowSubmitForm(!showSubmitForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showSubmitForm ? 'Cancel' : 'Submit Proposal'}
        </button>
      </div>

      {/* Fee Info */}
      {submissionFee && voteFee && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">Submission Fee:</span>
              <span className="ml-2 font-semibold text-zinc-900 dark:text-zinc-100">
                {formatEther(submissionFee)} KAS
              </span>
            </div>
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">Vote Fee:</span>
              <span className="ml-2 font-semibold text-zinc-900 dark:text-zinc-100">
                {formatEther(voteFee)} KAS
              </span>
            </div>
            {flagThreshold && (
              <div className="col-span-2">
                <span className="text-zinc-600 dark:text-zinc-400">Flag Threshold:</span>
                <span className="ml-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  {flagThreshold.toString()} yes votes
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Proposal Form */}
      {showSubmitForm && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Submit New Proposal
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Title (max 200 characters)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="Enter proposal title"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {title.length}/200 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Description (max 2000 characters)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={6}
                placeholder="Describe your dApp idea or concept..."
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {description.length}/2000 characters
              </p>
            </div>
            {submissionFee && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Submission fee: {formatEther(submissionFee)} KAS
                </p>
              </div>
            )}
            <button
              onClick={handleSubmitProposal}
              disabled={isLoading || !title.trim() || !description.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Submitting...' : `Submit Proposal (${submissionFee ? formatEther(submissionFee) : '10'} KAS)`}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Proposals List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Proposals {proposalCount !== null && `(${proposalCount.toString()})`}
          </h3>
          <button
            onClick={refreshProposals}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            Refresh
          </button>
        </div>

        {isLoading && proposals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-600 dark:text-zinc-400">Loading proposals...</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-600 dark:text-zinc-400">No proposals yet. Be the first to submit one!</p>
          </div>
        ) : (
          <div className="space-y-4">
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
                    className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {proposal.title}
                          </h4>
                          {proposal.isFlagged && (
                            <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                              Flagged for Review
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                          {proposal.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                          <span>Proposer: {formatAddress(proposal.proposer)}</span>
                          <span>Created: {formatDate(proposal.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vote Counts */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          Yes: {proposal.yesVotes.toString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                          No: {proposal.noVotes.toString()}
                        </span>
                      </div>
                      {hasVoted && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          You voted: {userVoteSupport ? 'Yes' : 'No'}
                        </span>
                      )}
                    </div>

                    {/* Vote Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote(proposal.id, true)}
                        disabled={isLoading || !proposal.isActive}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          hasVoted && userVoteSupport
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {hasVoted && userVoteSupport ? '✓ Yes' : 'Vote Yes'}
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, false)}
                        disabled={isLoading || !proposal.isActive}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          hasVoted && !userVoteSupport
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {hasVoted && !userVoteSupport ? '✓ No' : 'Vote No'}
                      </button>
                    </div>
                    {voteFee && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                        Vote fee: {formatEther(voteFee)} KAS
                        {hasVoted && ' (changing vote)'}
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

