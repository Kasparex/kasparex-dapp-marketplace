'use client';

import { useMemo } from 'react';
import { emptyCrowdfundTier } from '@/lib/donations/tiers';
import type { CrowdfundTier } from '@/lib/covenant/crowdfund-types';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { crowdkasSmallInputClass, crowdkasSecondaryBtnClass } from '@/components/donations/CrowdKasUi';
import { KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';

export function VDonateTiersEditor({
  tiers,
  onChange,
}: {
  tiers: CrowdfundTier[];
  onChange: (next: CrowdfundTier[]) => void;
}) {
  const sorted = useMemo(
    () => [...tiers].sort((a, b) => a.minKas - b.minKas),
    [tiers],
  );

  const updateAt = (id: string, patch: Partial<CrowdfundTier>) => {
    onChange(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const removeAt = (id: string) => {
    onChange(tiers.filter((t) => t.id !== id));
  };

  const addTier = () => {
    const base = emptyCrowdfundTier({
      title: `Tier ${tiers.length + 1}`,
      minKas: tiers.length === 0 ? 10 : Math.max(...tiers.map((t) => t.minKas)) + 10,
      description: '',
      reward: '',
    });
    onChange([...tiers, base]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Reward tiers</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Donors pick a tier when they pledge. Set a minimum KAS amount, description, and reward.
          </p>
        </div>
        <button type="button" onClick={addTier} className={`${crowdkasSecondaryBtnClass} !w-auto px-4`}>
          Add tier
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className={`${KX_SURFACE_NESTED} rounded-xl p-4 text-sm text-zinc-500 dark:text-zinc-400`}>
          No tiers yet. Add at least one if you want Kickstarter-style rewards.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((tier, idx) => (
            <div key={tier.id} className={`${KX_SURFACE_NESTED} rounded-xl p-4 space-y-3`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Tier {idx + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeAt(tier.id)}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <KxFormFieldLabel htmlFor={`tier-title-${tier.id}`}>Title</KxFormFieldLabel>
                  <input
                    id={`tier-title-${tier.id}`}
                    className={crowdkasSmallInputClass}
                    value={tier.title}
                    onChange={(e) => updateAt(tier.id, { title: e.target.value })}
                    placeholder="Early backer"
                  />
                </div>
                <div>
                  <KxFormFieldLabel htmlFor={`tier-min-${tier.id}`}>Min pledge (KAS)</KxFormFieldLabel>
                  <input
                    id={`tier-min-${tier.id}`}
                    type="number"
                    min={0.01}
                    step="0.01"
                    className={crowdkasSmallInputClass}
                    value={tier.minKas}
                    onChange={(e) => updateAt(tier.id, { minKas: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <KxFormFieldLabel htmlFor={`tier-desc-${tier.id}`}>Description</KxFormFieldLabel>
                <textarea
                  id={`tier-desc-${tier.id}`}
                  className={`${crowdkasSmallInputClass} min-h-[4rem] resize-y`}
                  value={tier.description}
                  onChange={(e) => updateAt(tier.id, { description: e.target.value })}
                  placeholder="What this tier includes"
                />
              </div>
              <div>
                <KxFormFieldLabel htmlFor={`tier-reward-${tier.id}`}>Reward / perk</KxFormFieldLabel>
                <input
                  id={`tier-reward-${tier.id}`}
                  className={crowdkasSmallInputClass}
                  value={tier.reward ?? ''}
                  onChange={(e) => updateAt(tier.id, { reward: e.target.value })}
                  placeholder="Digital wallpaper pack, shout-out, etc."
                />
              </div>
              <div>
                <KxFormFieldLabel htmlFor={`tier-limit-${tier.id}`}>
                  Limited quantity (optional)
                </KxFormFieldLabel>
                <input
                  id={`tier-limit-${tier.id}`}
                  type="number"
                  min={1}
                  step={1}
                  className={crowdkasSmallInputClass}
                  value={tier.limitedQty ?? ''}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    updateAt(tier.id, {
                      limitedQty: v ? Math.max(1, Math.floor(Number(v))) : undefined,
                    });
                  }}
                  placeholder="Unlimited"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
