'use client';

import { useReducer } from 'react';
import { RewardsHeader } from '@/components/rewards/RewardsHeader';
import { RewardsPageContent } from '@/components/rewards/RewardsPageContent';

/** Keeps catalog cards in sync after L2 session verification (localStorage). */
export function RewardsHubSection() {
  const [, bump] = useReducer((x: number) => x + 1, 0);
  return (
    <>
      <RewardsHeader onSessionVerifiedChange={() => bump()} />
      <RewardsPageContent />
    </>
  );
}
