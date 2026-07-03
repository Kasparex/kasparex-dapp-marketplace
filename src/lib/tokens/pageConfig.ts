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
