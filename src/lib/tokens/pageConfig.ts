import type { TokenContentTab } from './sections';
import type { TokenPageConfig, TokenPageSectionConfig, TokenPageSectionType } from './listingRecord';

export const TOKEN_PAGE_SECTION_LABELS: Record<TokenPageSectionType, string> = {
  overview: 'Overview',
  tokenomics: 'Tokenomics',
  roadmap: 'Roadmap',
  markets: 'Markets',
  swap: 'Swap',
  utility: 'Hub Utility',
  comments: 'Comments',
  links: 'Links',
  whitepaper: 'Whitepaper',
};

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
