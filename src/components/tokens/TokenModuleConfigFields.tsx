'use client';

import { VBlogPollOptionsEditor } from '@/components/vblog/VBlogPollOptionsEditor';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { TokenRoadmapEditor } from '@/components/tokens/TokenRoadmapEditor';
import {
  cleanPollOptions,
  defaultTokenPollConfig,
  type TokenModulesConfig,
} from '@/lib/tokens/modules';
import { HUB_UTILITY_PRODUCTS } from '@/lib/tokens/utilityRegistry';

type TokenModuleConfigFieldsProps = {
  config: TokenModulesConfig;
  onChange: (config: TokenModulesConfig) => void;
  enabledModuleIds: Set<string>;
  disabled?: boolean;
};

export function TokenModuleConfigFields({
  config,
  onChange,
  enabledModuleIds,
  disabled,
}: TokenModuleConfigFieldsProps) {
  const showRoadmap =
    enabledModuleIds.has('roadmap_editor') || enabledModuleIds.has('timeline_builder');
  const showPoll = enabledModuleIds.has('on_chain_poll');
  const showUtility = enabledModuleIds.has('utility_integrations');

  if (!showRoadmap && !showPoll && !showUtility) return null;

  const poll = config.poll ?? defaultTokenPollConfig();
  const utilityProducts = config.utilityProducts ?? [];

  return (
    <div className="space-y-4" id="tokens-dashboard-module-config">
      {showRoadmap ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <DAppSectionHeader title="Roadmap content" className="mb-1" />
          <p className="kx-body-sm">Milestones appear on the Roadmap tab after publish.</p>
          <TokenRoadmapEditor
            milestones={config.roadmap ?? []}
            onChange={(roadmap) => onChange({ ...config, roadmap })}
            disabled={disabled}
          />
        </div>
      ) : null}

      {showPoll ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <DAppSectionHeader title="Community poll" className="mb-1" />
          <div>
            <label className="k-label">Question</label>
            <input
              type="text"
              className="k-input mt-1 w-full"
              value={poll.question}
              disabled={disabled}
              onChange={(e) => onChange({ ...config, poll: { ...poll, question: e.target.value } })}
            />
          </div>
          <VBlogPollOptionsEditor
            options={poll.options}
            disabled={disabled}
            onChange={(options) =>
              onChange({ ...config, poll: { ...poll, options: cleanPollOptions(options) } })
            }
          />
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={Boolean(poll.onChainEnabled)}
              disabled={disabled}
              onChange={(e) => onChange({ ...config, poll: { ...poll, onChainEnabled: e.target.checked } })}
            />
            Optional on-chain vote proof (0.01 KAS micro-payment per vote)
          </label>
        </div>
      ) : null}

      {showUtility ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <DAppSectionHeader title="Hub utility products" className="mb-1" />
          <p className="kx-body-sm">Select Kasparex products where your token should appear in payment flows.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {HUB_UTILITY_PRODUCTS.map((product) => {
              const checked = utilityProducts.includes(product.id);
              return (
                <label
                  key={product.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                    checked
                      ? 'border-[#02abb8]/40 bg-[#02abb8]/5'
                      : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => {
                      const next = checked
                        ? utilityProducts.filter((id) => id !== product.id)
                        : [...utilityProducts, product.id];
                      onChange({ ...config, utilityProducts: next });
                    }}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {product.label}
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">{product.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
