'use client';

import { useMemo, useState } from 'react';
import type { Token } from '@/lib/tokens/types';
import { VBlogPremiumPoll } from '@/components/vblog/VBlogPremiumPoll';
import {
  getPollVoteForWallet,
  getPollVotes,
  hasPollVote,
  savePollVote,
} from '@/lib/tokens/votes';
import { tokenHasModule } from '@/lib/tokens/modules';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { getTokensTreasuryL1Address } from '@/lib/tokens/config';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { useKREXBalance } from '@/hooks/useKREXBalance';

export function TokenCommunityPoll({ token }: { token: Token }) {
  const poll = token.modulesConfig?.poll;
  const enabled = tokenHasModule(token.paidModuleIds, 'on_chain_poll') && poll && poll.options.length >= 2;
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress } = useAccount();
  const { balance: krexBalance } = useKREXBalance();
  const wallet = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);

  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedOption, setSelectedOption] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const votes = useMemo(() => getPollVotes(token.slug), [token.slug, refreshTick]);
  const hasVoted = wallet ? hasPollVote(token.slug, wallet) : false;
  const userVote = wallet ? getPollVoteForWallet(token.slug, wallet) : undefined;

  if (!enabled || !poll) return null;

  const canVote = Boolean(wallet) && !hasVoted;

  const handleSubmit = async () => {
    if (!wallet || hasVoted) return;
    setIsProcessing(true);
    try {
      let txHash: string | undefined;
      if (poll.onChainEnabled && kaspaState.isConnected && kaspaState.provider && kaspaState.address) {
        const treasury = getTokensTreasuryL1Address().replace(/^kaspa:/, '');
        const result = await sendKaspaTransaction(kaspaState.provider, {
          to: treasury,
          amount: kasToSompis(0.01).toString(),
          note: `Token poll vote: ${token.symbol}`,
        });
        if (result.txHash) txHash = result.txHash;
      }
      savePollVote({
        tokenSlug: token.slug,
        wallet,
        optionIndex: selectedOption,
        votedAt: new Date().toISOString(),
        txHash,
      });
      appendHubActivityEarn({
        walletRaw: wallet,
        source: 'tokens_listing_vote',
        redeemableDelta: HUB_EARN_POINTS.tokensListingVote,
        krexBalance,
        idempotencyKey: `poll:${token.slug}:${wallet}`,
        meta: { slug: token.slug },
      });
      setRefreshTick((t) => t + 1);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <VBlogPremiumPoll
      question={poll.question}
      options={poll.options}
      votes={votes.map((v) => ({
        articleId: token.slug,
        wallet: v.wallet,
        optionIndex: v.optionIndex,
        txHash: v.txHash,
        votedAt: v.votedAt,
      }))}
      selectedOption={selectedOption}
      onSelectOption={setSelectedOption}
      onSubmitVote={handleSubmit}
      canVote={canVote}
      hasVoted={hasVoted}
      userVoteIndex={userVote?.optionIndex}
      premiumUnlocked
      isProcessing={isProcessing}
    />
  );
}
