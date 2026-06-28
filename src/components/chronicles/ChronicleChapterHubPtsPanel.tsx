'use client';

import { useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { isChapterQuizCompleted } from '@/lib/chronicles/quiz/localQuizState';
import { KxHubPtsEarnPanel, type HubPtsEarnSource } from '@/components/ui/KxHubPtsEarnPanel';

export function ChronicleChapterHubPtsPanel({
  chapterSlug,
  hasQuiz,
}: {
  chapterSlug: string;
  hasQuiz: boolean;
}) {
  const { state } = useKaspaWallet();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onUpdate = () => setTick((n) => n + 1);
    window.addEventListener('chronicles-quiz-updated', onUpdate);
    window.addEventListener('kasparex-hub-ledger', onUpdate);
    return () => {
      window.removeEventListener('chronicles-quiz-updated', onUpdate);
      window.removeEventListener('kasparex-hub-ledger', onUpdate);
    };
  }, []);

  const sources = useMemo((): HubPtsEarnSource[] => {
    void tick;
    const rows: HubPtsEarnSource[] = [];
    if (hasQuiz) {
      const earned = isChapterQuizCompleted(state.address, chapterSlug);
      rows.push({
        id: 'chapter-quiz',
        label: 'Chapter quiz',
        points: HUB_EARN_POINTS.chroniclesQuizComplete,
        scrollTargetId: 'chapter-quiz',
        status: earned ? 'earned' : 'available',
        detail: 'Pass the lore quiz after reading this chapter.',
      });
    }
    rows.push({
      id: 'future-modules',
      label: 'Future modules',
      points: 0,
      status: 'coming_soon',
      detail: 'More Chronicles earn paths will appear here.',
    });
    return rows;
  }, [chapterSlug, hasQuiz, state.address, tick]);

  if (!hasQuiz) return null;

  return <KxHubPtsEarnPanel title="Earn from this chapter" sources={sources} />;
}
