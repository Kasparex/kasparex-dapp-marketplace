import { cleanPollOptions, type TokenModuleId, type TokenModulesConfig } from '@/lib/tokens/modules';

/** Required-when-enabled checks for Tokens premium modules before publish. */
export function validateTokenModulesForPublish(args: {
  enabledModuleIds: Iterable<string>;
  modulesConfig: TokenModulesConfig;
  marketsSectionEnabled?: boolean;
}): string | null {
  const enabled = new Set(args.enabledModuleIds);
  const config = args.modulesConfig;

  if (enabled.has('roadmap_editor') || enabled.has('timeline_builder')) {
    const milestones = config.roadmap ?? [];
    if (milestones.length === 0) {
      return 'Roadmap / timeline needs at least one milestone when enabled.';
    }
    if (milestones.some((m) => !m.title.trim())) {
      return 'Each roadmap milestone needs a title.';
    }
  }

  if (enabled.has('on_chain_poll')) {
    const options = cleanPollOptions(config.poll?.options ?? []);
    if (!String(config.poll?.question ?? '').trim() || options.length < 2) {
      return 'On-chain poll requires a question and at least 2 options when enabled.';
    }
  }

  if (enabled.has('utility_integrations')) {
    if (!(config.utilityProducts ?? []).length) {
      return 'Utility integrations needs at least one Hub product selected when enabled.';
    }
  }

  if (enabled.has('access_gate')) {
    const gate = config.accessGate;
    if (!gate?.holderOnly && !String(gate?.minBalanceSompi ?? '').trim()) {
      return 'Access gate needs holder-only mode or a minimum balance when enabled.';
    }
  }

  if (enabled.has('covenant_utilities_hub')) {
    if (!(config.covenantUtilityTemplates ?? []).length) {
      return 'Covenant utilities needs at least one template selected when enabled.';
    }
  }

  if (args.marketsSectionEnabled) {
    const markets = config.markets ?? [];
    if (markets.length === 0) {
      return 'Markets section needs at least one venue when enabled.';
    }
    if (markets.some((m) => !m.name.trim() || !m.url.trim())) {
      return 'Each market venue needs a name and URL.';
    }
  }

  return null;
}
