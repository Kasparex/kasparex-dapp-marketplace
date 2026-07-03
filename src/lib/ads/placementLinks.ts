import type { AdSlotId } from '@/lib/ads/types';

/** Where each slot appears on the site (for sidebar deep links). */
export const AD_SLOT_PLACEMENT_LINKS: {
  slotId: AdSlotId;
  title: string;
  href: string;
  placement: string;
}[] = [
  {
    slotId: 'HALO_DAPPS_RIGHT',
    title: 'dApps halo',
    href: '/#ad-slot-dapps-halo',
    placement: 'dApps home, hero right',
  },
  {
    slotId: 'HALO_PROTOCOLS_RIGHT',
    title: 'Protocols halo',
    href: '/protocols#ad-slot-protocols-halo',
    placement: 'Protocols hub, halo header right',
  },
  {
    slotId: 'HALO_MAGAZINES_RIGHT',
    title: 'Magazines halo',
    href: '/magazines#ad-slot-magazines-halo',
    placement: 'Magazines listing, halo header right',
  },
  {
    slotId: 'HALO_CHRONICLES_RIGHT',
    title: 'Chronicles halo',
    href: '/chronicles#ad-slot-chronicles-halo',
    placement: 'Krex Chronicles, halo header right',
  },
  {
    slotId: 'HALO_VBLOG_RIGHT',
    title: 'vBlog halo',
    href: '/vblog#ad-slot-vblog-halo',
    placement: 'vBlog listing, halo header right',
  },
  {
    slotId: 'HALO_NFT_RIGHT',
    title: 'NFT Tools halo',
    href: '/nft#ad-slot-nft-halo',
    placement: 'NFT Tools, halo header right',
  },
  {
    slotId: 'HALO_DONATIONS_RIGHT',
    title: 'CrowdKAS halo',
    href: '/donations#ad-slot-crowdkas-halo',
    placement: 'CrowdKAS listing, halo header right',
  },
  {
    slotId: 'HALO_STORE_RIGHT',
    title: 'Store halo',
    href: '/store#ad-slot-store-halo',
    placement: 'Kasparex Store listing, halo header right',
  },
  {
    slotId: 'HALO_GAMES_RIGHT',
    title: 'Games halo',
    href: '/games#ad-slot-games-halo',
    placement:
      'Kasparex Games listing (halo) and all game play dashboards (right column); one shared slot pool',
  },
  {
    slotId: 'HALO_AI_RIGHT',
    title: 'Kasparex AI halo',
    href: '/ai#ad-slot-ai-halo',
    placement: 'Kasparex AI hub, hero header right',
  },
  {
    slotId: 'HALO_STATS_RIGHT',
    title: 'Kasparex Stats halo',
    href: '/stats#ad-slot-stats-halo',
    placement: 'Kasparex Stats hub, hero header right',
  },
  {
    slotId: 'HALO_TOKENS_RIGHT',
    title: 'Tokens halo',
    href: '/tokens#ad-slot-tokens-halo',
    placement: 'Kasparex Tokens listing and token page headers, halo right',
  },
  {
    slotId: 'VBLOG_ARTICLE_ASIDE_BOTTOM',
    title: 'vBlog article aside',
    href: '/vblog#ad-slot-vblog-article-aside-bottom',
    placement: 'vBlog article page, right aside bottom',
  },
  {
    slotId: 'SIDEBAR_RANDOM',
    title: 'Profile Hub sidebar',
    href: '/u?tab=workspace#ad-slot-studio-sidebar',
    placement: 'Profile Hub, left sidebar',
  },
  {
    slotId: 'FOOTER_BLOCK',
    title: 'Footer strip',
    href: '/#ad-slot-footer',
    placement: 'Site footer, all pages',
  },
];
