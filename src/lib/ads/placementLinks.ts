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
    slotId: 'VBLOG_ARTICLE_ASIDE_BOTTOM',
    title: 'vBlog article aside',
    href: '/vblog#ad-slot-vblog-article-aside-bottom',
    placement: 'vBlog article page, right aside bottom',
  },
  {
    slotId: 'SIDEBAR_RANDOM',
    title: 'Studio sidebar',
    href: '/studio/portfolio#ad-slot-studio-sidebar',
    placement: 'Creator Studio, left sidebar',
  },
  {
    slotId: 'FOOTER_BLOCK',
    title: 'Footer strip',
    href: '/#ad-slot-footer',
    placement: 'Site footer, all pages',
  },
];
