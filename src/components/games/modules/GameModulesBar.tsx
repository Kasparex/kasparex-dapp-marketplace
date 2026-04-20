'use client';

import { RiskToggle } from './RiskToggle';
import { RewardsPreview } from './RewardsPreview';

export function GameModulesBar(props: {
  risk: 'cashout' | 'push' | 'none';
  onRiskChange: (v: 'cashout' | 'push' | 'none') => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <RewardsPreview />
      <RiskToggle value={props.risk} onChange={props.onRiskChange} />
    </div>
  );
}

