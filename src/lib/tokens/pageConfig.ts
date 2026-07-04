import type { TokenContentTab } from './sections';
import type { TokenPageConfig, TokenPageSectionConfig, TokenPageSectionType } from './listingRecord';

export const TOKEN_PAGE_SECTION_LABELS: Record<TokenPageSectionType, string> = {
  overview: 'About',
  tokenomics: 'Tokenomics',
  roadmap: 'Roadmap',
  markets: 'Markets',
  swap: 'Swap',
  utility: 'Hub Utility',
  comments: 'Comments',
  links: 'Links',
  whitepaper: 'Whitepaper',
};

export const TOKEN_TAB_LABELS: Record<TokenContentTab, string> = {
  overview: 'Overview',
  roadmap: 'Roadmap',
  markets: 'Markets',
  swap: 'Swap',
  utility: 'Utility',
  comments: 'Comments',
};

/** Natural-tab grouping: which section types belong to which content tab. */
export const TOKEN_BUILDER_GROUPS: {
  tab: TokenContentTab;
  label: string;
  blocks: TokenPageSectionType[];
  alwaysOn?: boolean;
}[] = [
  {
    tab: 'overview',
    label: 'Overview',
    blocks: ['overview', 'tokenomics', 'whitepaper', 'links'],
    alwaysOn: true,
  },
  { tab: 'roadmap', label: 'Roadmap', blocks: ['roadmap'] },
  { tab: 'markets', label: 'Markets', blocks: ['markets'] },
  { tab: 'swap', label: 'Swap', blocks: ['swap'] },
  { tab: 'utility', label: 'Utility', blocks: ['utility'] },
  { tab: 'comments', label: 'Comments', blocks: ['comments'] },
];

export type TokenBuilderBlock = {
  type: TokenPageSectionType;
  label: string;
  enabled: boolean;
  locked: boolean;
  description: string;
};

export type TokenBuilderTab = {
  tab: TokenContentTab;
  label: string;
  enabled: boolean;
  blocks: TokenBuilderBlock[];
};

export type TokenBuilderModel = {
  tabs: TokenBuilderTab[];
};

const BUILDER_BLOCK_DESCRIPTIONS: Partial<Record<TokenPageSectionType, string>> = {
  overview: 'Token info, description, and contract details (always shown)',
  tokenomics: 'Supply, allocations, and distribution',
  whitepaper: 'Link or embedded whitepaper document',
  links: 'Social and project links grid',
  roadmap: 'Milestone timeline and progress',
  markets: 'Price charts, minting progress, and balances',
  swap: 'In-page token swap widget',
  utility: 'Hub integrations and instant utility',
  comments: 'Community discussion thread',
};

function isSectionTypeEnabled(
  config: TokenPageConfig | undefined,
  type: TokenPageSectionType,
): boolean {
  if (!config) {
    return type === 'overview' || type === 'comments' || type === 'links';
  }
  const section = config.sections.find((s) => s.type === type);
  return section?.enabled ?? false;
}

/**
 * Builder-facing view of page config: tabs in display order, each with ordered blocks.
 */
export function getBuilderModel(config: TokenPageConfig | undefined): TokenBuilderModel {
  const orderedTabs = getOrderedTabs(config);
  const orderedOverviewSubsections = getOrderedOverviewSubsections(config);

  const tabs: TokenBuilderTab[] = TOKEN_BUILDER_GROUPS.map((group) => {
    const tabEnabled =
      group.alwaysOn ||
      group.blocks.some((type) => type !== 'overview' && isSectionTypeEnabled(config, type));

    if (group.tab === 'overview') {
      const blocks: TokenBuilderBlock[] = [
        {
          type: 'overview',
          label: TOKEN_PAGE_SECTION_LABELS.overview,
          enabled: true,
          locked: true,
          description: BUILDER_BLOCK_DESCRIPTIONS.overview ?? '',
        },
        ...orderedOverviewSubsections.map((type) => ({
          type,
          label: TOKEN_PAGE_SECTION_LABELS[type],
          enabled: true,
          locked: false,
          description: BUILDER_BLOCK_DESCRIPTIONS[type] ?? '',
        })),
      ];
      return { tab: group.tab, label: group.label, enabled: true, blocks };
    }

    const blocks: TokenBuilderBlock[] = group.blocks.map((type) => ({
      type,
      label: TOKEN_PAGE_SECTION_LABELS[type],
      enabled: isSectionTypeEnabled(config, type),
      locked: false,
      description: BUILDER_BLOCK_DESCRIPTIONS[type] ?? '',
    }));

    return { tab: group.tab, label: group.label, enabled: tabEnabled, blocks };
  });

  const tabOrder = new Map(orderedTabs.map((tab, index) => [tab, index]));
  tabs.sort((a, b) => {
    const ai = tabOrder.get(a.tab) ?? 999;
    const bi = tabOrder.get(b.tab) ?? 999;
    return ai - bi;
  });

  return { tabs };
}

/** Section types that compose the Overview tab canvas (excluding the locked About block). */
export const OVERVIEW_CANVAS_BLOCKS: TokenPageSectionType[] = ['tokenomics', 'whitepaper', 'links'];

/** All section types available in the block library, grouped by home tab. */
export function getLibraryBlocks(): { tab: TokenContentTab; tabLabel: string; blocks: TokenPageSectionType[] }[] {
  return TOKEN_BUILDER_GROUPS.map((group) => ({
    tab: group.tab,
    tabLabel: group.label,
    blocks: group.blocks.filter((type) => type !== 'overview'),
  }));
}

const DEFAULT_SECTIONS: TokenPageSectionConfig[] = [
  { type: 'overview', enabled: true },
  { type: 'tokenomics', enabled: false },
  { type: 'roadmap', enabled: false },
  { type: 'markets', enabled: false },
  { type: 'swap', enabled: false },
  { type: 'utility', enabled: false },
  { type: 'comments', enabled: true },
  { type: 'links', enabled: true },
  { type: 'whitepaper', enabled: false },
];

export function createDefaultPageConfig(enabledModuleIds: string[] = []): TokenPageConfig {
  const sections = DEFAULT_SECTIONS.map((section) => {
    if (section.type === 'roadmap' && enabledModuleIds.includes('roadmap_editor')) {
      return { ...section, enabled: true };
    }
    if (section.type === 'utility' && enabledModuleIds.includes('utility_integrations')) {
      return { ...section, enabled: true };
    }
    if (section.type === 'utility' && enabledModuleIds.includes('on_chain_poll')) {
      return { ...section, enabled: true };
    }
    return { ...section };
  });

  return {
    version: 1,
    defaultTab: 'overview',
    sections,
  };
}

export function isSectionEnabled(config: TokenPageConfig | undefined, type: TokenPageSectionType): boolean {
  if (!config) return true;
  const section = config.sections.find((s) => s.type === type);
  return section?.enabled ?? false;
}

export function sectionToTab(type: TokenPageSectionType): TokenContentTab | null {
  switch (type) {
    case 'overview':
    case 'tokenomics':
    case 'links':
    case 'whitepaper':
      return 'overview';
    case 'roadmap':
      return 'roadmap';
    case 'markets':
      return 'markets';
    case 'swap':
      return 'swap';
    case 'utility':
      return 'utility';
    case 'comments':
      return 'comments';
    default:
      return null;
  }
}

export function getEnabledTabs(config: TokenPageConfig | undefined): Set<TokenContentTab> {
  if (!config) {
    return new Set(['overview', 'roadmap', 'markets', 'swap', 'utility', 'comments']);
  }
  const tabs = new Set<TokenContentTab>();
  for (const section of config.sections) {
    if (!section.enabled) continue;
    const tab = sectionToTab(section.type);
    if (tab) tabs.add(tab);
  }
  if (tabs.size === 0) tabs.add('overview');
  return tabs;
}

/**
 * Ordered list of enabled content tabs, following the section order chosen in the
 * dashboard (drag-and-reorder). Overview is always present and shown first.
 */
export function getOrderedTabs(config: TokenPageConfig | undefined): TokenContentTab[] {
  if (!config) return ['overview', 'roadmap', 'markets', 'swap', 'utility', 'comments'];
  const result: TokenContentTab[] = [];
  const seen = new Set<TokenContentTab>();
  for (const section of config.sections) {
    if (!section.enabled) continue;
    const tab = sectionToTab(section.type);
    if (tab && !seen.has(tab)) {
      seen.add(tab);
      result.push(tab);
    }
  }
  if (!seen.has('overview')) result.unshift('overview');
  return result.length ? result : ['overview'];
}

const OVERVIEW_SUBSECTIONS: TokenPageSectionType[] = ['tokenomics', 'whitepaper', 'links'];

/**
 * Ordered list of enabled overview sub-sections (tokenomics, whitepaper, links),
 * following the dashboard section order.
 */
export function getOrderedOverviewSubsections(
  config: TokenPageConfig | undefined,
): TokenPageSectionType[] {
  if (!config) return OVERVIEW_SUBSECTIONS;
  return config.sections
    .filter((s) => s.enabled && OVERVIEW_SUBSECTIONS.includes(s.type))
    .map((s) => s.type);
}

/**
 * Apply enable/disable toggles and an optional section order to a base page config.
 */
export function applyPageSectionConfig(
  base: TokenPageConfig,
  toggles: Record<string, boolean>,
  order?: TokenPageSectionType[],
): TokenPageConfig {
  const withToggles: TokenPageSectionConfig[] = base.sections.map((section) => ({
    ...section,
    enabled: toggles[section.type] ?? section.enabled,
  }));
  if (!order || order.length === 0) {
    return { ...base, sections: withToggles };
  }
  const map = new Map<TokenPageSectionType, TokenPageSectionConfig>(
    withToggles.map((s) => [s.type, s]),
  );
  const ordered: TokenPageSectionConfig[] = [];
  for (const type of order) {
    const section = map.get(type);
    if (section) {
      ordered.push(section);
      map.delete(type);
    }
  }
  for (const remaining of map.values()) ordered.push(remaining);
  return { ...base, sections: ordered };
}

export function mergePageConfig(
  base: TokenPageConfig,
  sectionToggles: Partial<Record<TokenPageSectionType, boolean>>,
): TokenPageConfig {
  return {
    ...base,
    sections: base.sections.map((section) => ({
      ...section,
      enabled: sectionToggles[section.type] ?? section.enabled,
    })),
  };
}
