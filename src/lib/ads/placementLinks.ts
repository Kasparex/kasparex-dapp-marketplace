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
    placement:
      'dApps home (halo), dApp detail rails, and dApps dashboard create form; one shared slot pool',
  },
  {
    slotId: 'HALO_HUB_RIGHT',
    title: 'Hub halo',
    href: '/hub#ad-slot-hub-halo',
    placement: 'Kasparex Hub landing, hero right',
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
    placement:
      'Magazines listing (halo), Magazines dashboard, and issue editor form; one shared slot pool',
  },
  {
    slotId: 'HALO_CHRONICLES_RIGHT',
    title: 'Chronicles halo',
    href: '/chronicles#ad-slot-chronicles-halo',
    placement:
      'Chronicles listing (halo), article/overview rails, and Chronicles Center create form; one shared slot pool',
  },
  {
    slotId: 'HALO_VBLOG_RIGHT',
    title: 'vBlog halo',
    href: '/vblog#ad-slot-vblog-halo',
    placement:
      'vBlog listing (halo), article right rails, and Author Dashboard create form; one shared slot pool',
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
    placement:
      'CrowdKAS listing (halo), campaign right rails, and vDonate Studio editor; one shared slot pool',
  },
  {
    slotId: 'HALO_STORE_RIGHT',
    title: 'Store halo',
    href: '/store#ad-slot-store-halo',
    placement:
      'Store listing (halo), product pages, Seller Dashboard, and List a Product form; one shared slot pool',
  },
  {
    slotId: 'HALO_GAMES_RIGHT',
    title: 'Games halo',
    href: '/games#ad-slot-games-halo',
    placement:
      'Kasparex Games listing (halo), game play dashboards, and Games dashboard create form; one shared slot pool',
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
    placement:
      'Tokens listing and token page headers (halo), token detail rail, and Tokens dashboard form; one shared slot pool',
  },
  {
    slotId: 'HALO_ADS_RIGHT',
    title: 'Ads halo',
    href: '/ads#ad-slot-ads-halo',
    placement: 'Ads marketplace, hero right',
  },
  {
    slotId: 'HALO_API_RIGHT',
    title: 'API halo',
    href: '/api#ad-slot-api-halo',
    placement: 'API docs, hero right',
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
