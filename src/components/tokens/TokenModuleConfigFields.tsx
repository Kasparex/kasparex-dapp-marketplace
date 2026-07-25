'use client';

import { VBlogPollOptionsEditor } from '@/components/vblog/VBlogPollOptionsEditor';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { TokenRoadmapEditor } from '@/components/tokens/TokenRoadmapEditor';
import { TokenMarketsEditor } from '@/components/tokens/TokenMarketsEditor';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import {
  cleanPollOptions,
  defaultTokenPollConfig,
  type TokenModuleId,
  type TokenModulesConfig,
} from '@/lib/tokens/modules';
import { HUB_UTILITY_PRODUCTS } from '@/lib/tokens/utilityRegistry';
import { contentForRichEditor } from '@/lib/richText/html';
import { isProgrammableListingNetwork } from '@/lib/tokens/listingNetwork';
import {
  COVENANT_UTILITY_TEMPLATES,
  type CovenantUtilityTemplateId,
} from '@/lib/programmable/covenantUtilities';

export type TokenModuleConfigTarget = TokenModuleId | 'markets';

type TokenModuleConfigFieldsProps = {
  config: TokenModulesConfig;
  onChange: (config: TokenModulesConfig) => void;
  enabledModuleIds: Set<string>;
  isRealToken: boolean;
  listingNetwork?: import('@/lib/tokens/listingNetwork').TokenListingNetwork;
  marketsSectionEnabled?: boolean;
  disabled?: boolean;
  /** When set, render only this module/section config (for nested dashed cards). */
  moduleId?: TokenModuleConfigTarget;
  /** Strip outer panel chrome when nested inside a premium module card. */
  bare?: boolean;
};

function moduleHasConfigFields(moduleId: TokenModuleConfigTarget): boolean {
  return (
    moduleId === 'roadmap_editor' ||
    moduleId === 'timeline_builder' ||
    moduleId === 'on_chain_poll' ||
    moduleId === 'utility_integrations' ||
    moduleId === 'covenant_utilities_hub' ||
    moduleId === 'access_gate' ||
    moduleId === 'native_subscriptions' ||
    moduleId === 'markets'
  );
}

export function tokenModuleHasConfigFields(moduleId: TokenModuleId): boolean {
  return moduleHasConfigFields(moduleId);
}

export function TokenModuleConfigFields({
  config,
  onChange,
  enabledModuleIds,
  isRealToken,
  listingNetwork,
  marketsSectionEnabled = false,
  disabled,
  moduleId,
  bare = false,
}: TokenModuleConfigFieldsProps) {
  const isProgrammable = isProgrammableListingNetwork(listingNetwork);

  const showRoadmap =
    (!moduleId || moduleId === 'roadmap_editor' || moduleId === 'timeline_builder') &&
    (enabledModuleIds.has('roadmap_editor') || enabledModuleIds.has('timeline_builder'));
  const showPoll =
    (!moduleId || moduleId === 'on_chain_poll') && isRealToken && enabledModuleIds.has('on_chain_poll');
  const showUtility =
    (!moduleId || moduleId === 'utility_integrations') &&
    isRealToken &&
    enabledModuleIds.has('utility_integrations');
  const showCovenantHub =
    (!moduleId || moduleId === 'covenant_utilities_hub') &&
    isRealToken &&
    isProgrammable &&
    enabledModuleIds.has('covenant_utilities_hub');
  const showAccessGate =
    (!moduleId || moduleId === 'access_gate') &&
    isRealToken &&
    isProgrammable &&
    enabledModuleIds.has('access_gate');
  const showSubscriptions =
    (!moduleId || moduleId === 'native_subscriptions') &&
    isRealToken &&
    isProgrammable &&
    enabledModuleIds.has('native_subscriptions');
  const showMarkets = (!moduleId || moduleId === 'markets') && marketsSectionEnabled;

  if (
    !showRoadmap &&
    !showPoll &&
    !showUtility &&
    !showMarkets &&
    !showCovenantHub &&
    !showAccessGate &&
    !showSubscriptions
  ) {
    return null;
  }

  const poll = config.poll ?? defaultTokenPollConfig();
  const utilityProducts = config.utilityProducts ?? [];
  const covenantTemplates = config.covenantUtilityTemplates ?? COVENANT_UTILITY_TEMPLATES.map((t) => t.id);
  const accessGate = config.accessGate ?? { holderOnly: true };

  const setupShellClass = bare
    ? 'mt-5 space-y-3 border-t border-zinc-200 pt-5 dark:border-zinc-700'
    : 'space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900';

  return (
    <div className={bare ? undefined : 'space-y-4'} id={bare ? undefined : 'tokens-dashboard-module-config'}>
      {showRoadmap ? (
        <div className={setupShellClass}>
          {!bare ? <DAppSectionHeader title="Roadmap content" className="mb-1" /> : null}
          <p className="kx-body-sm">Milestones appear on the Roadmap tab after publish.</p>
          <TokenRoadmapEditor
            intro={config.roadmapIntro ?? ''}
            outro={config.roadmapOutro ?? ''}
            milestones={config.roadmap ?? []}
            onIntroChange={(roadmapIntro) => onChange({ ...config, roadmapIntro })}
            onOutroChange={(roadmapOutro) => onChange({ ...config, roadmapOutro })}
            onChange={(roadmap) => onChange({ ...config, roadmap })}
            disabled={disabled}
          />
        </div>
      ) : null}

      {showMarkets ? (
        <div className={setupShellClass} id={bare ? undefined : 'tokens-dashboard-markets'}>
          {!bare ? <DAppSectionHeader title="Markets content" className="mb-1" /> : null}
          <p className="kx-body-sm">Build a custom list of CEX and DEX marketplaces for your token.</p>
          <TokenMarketsEditor
            markets={config.markets ?? []}
            onChange={(markets) => onChange({ ...config, markets })}
            disabled={disabled}
          />
        </div>
      ) : null}

      {showPoll ? (
        <div className={setupShellClass}>
          {!bare ? <DAppSectionHeader title="Community poll" className="mb-1" /> : null}
          <div>
            <label className="k-label">Question</label>
            <KxRichTextEditor
              value={contentForRichEditor(poll.question)}
              onChange={(question) => onChange({ ...config, poll: { ...poll, question } })}
              placeholder="What should we prioritize next?"
              minRows={3}
              disabled={disabled}
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
        <div className={setupShellClass}>
          {!bare ? <DAppSectionHeader title="Hub utility products" className="mb-1" /> : null}
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

      {showCovenantHub ? (
        <div className={setupShellClass}>
          {!bare ? <DAppSectionHeader title="Covenant utilities hub" className="mb-1" /> : null}
          <p className="kx-body-sm">Choose which Kasparex covenant tools to surface on your token page.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {COVENANT_UTILITY_TEMPLATES.map((template) => {
              const checked = covenantTemplates.includes(template.id);
              return (
                <label
                  key={template.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                    checked ? 'border-[#02abb8]/40 bg-[#02abb8]/5' : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => {
                      const next = checked
                        ? covenantTemplates.filter((id) => id !== template.id)
                        : [...covenantTemplates, template.id];
                      onChange({ ...config, covenantUtilityTemplates: next as CovenantUtilityTemplateId[] });
                    }}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {template.label}
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">{template.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      {showAccessGate ? (
        <div className={setupShellClass}>
          {!bare ? <DAppSectionHeader title="Access gate rules" className="mb-1" /> : null}
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={Boolean(accessGate.holderOnly)}
              disabled={disabled}
              onChange={(e) =>
                onChange({ ...config, accessGate: { ...accessGate, holderOnly: e.target.checked } })
              }
            />
            Any live covenant holder may pass
          </label>
          <div>
            <label className="k-label">Minimum live value (sompi, optional)</label>
            <input
              type="text"
              className="k-input mt-2 w-full font-mono text-sm"
              placeholder="e.g. 100000000"
              value={accessGate.minBalanceSompi ?? ''}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...config,
                  accessGate: { ...accessGate, minBalanceSompi: e.target.value.trim() || undefined },
                })
              }
            />
          </div>
          <div>
            <label className="k-label">Unlocked content URL (optional)</label>
            <input
              type="url"
              className="k-input mt-2 w-full text-sm"
              placeholder="https://…"
              value={accessGate.unlockUrl ?? ''}
              disabled={disabled}
              onChange={(e) =>
                onChange({ ...config, accessGate: { ...accessGate, unlockUrl: e.target.value.trim() || undefined } })
              }
            />
          </div>
          <div>
            <label className="k-label">Denied message (optional)</label>
            <input
              type="text"
              className="k-input mt-2 w-full text-sm"
              value={accessGate.deniedMessage ?? ''}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...config,
                  accessGate: { ...accessGate, deniedMessage: e.target.value.trim() || undefined },
                })
              }
            />
          </div>
        </div>
      ) : null}

      {showSubscriptions ? (
        <div className={setupShellClass}>
          {!bare ? <DAppSectionHeader title="Native subscriptions" className="mb-1" /> : null}
          <p className="kx-body-sm">
            Placeholder for recurring access plans. Billing activates when KCC-20 payment rails are live in Hub
            products.
          </p>
          <div>
            <label className="k-label">Creator note (shown on token page)</label>
            <textarea
              className="k-input mt-2 w-full text-sm min-h-[80px]"
              value={config.subscriptionsNote ?? ''}
              disabled={disabled}
              onChange={(e) => onChange({ ...config, subscriptionsNote: e.target.value })}
              placeholder="Describe your planned subscription tiers or link to a milestone covenant."
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
