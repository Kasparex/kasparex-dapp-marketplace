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
