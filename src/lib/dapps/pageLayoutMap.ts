/** Field-to-published-page layout contract for dApp listings and detail pages. */

export type DAppLayoutSlot =
  | 'header.title'
  | 'header.excerpt'
  | 'header.logo'
  | 'header.featuredImage'
  | 'header.category'
  | 'header.tags'
  | 'header.network'
  | 'header.creator'
  | 'header.socialLinks'
  | 'tab.overview.gallery'
  | 'tab.overview.actionButtons'
  | 'tab.overview.contacts'
  | 'tab.description'
  | 'tab.fees'
  | 'tab.metadata'
  | 'card.listing';

export type DAppFormSectionId =
  | 'page-header'
  | 'links-actions'
  | 'description'
  | 'fees'
  | 'overview-extras'
  | 'listing-meta';

export type DAppFieldDef = {
  key: string;
  label: string;
  tooltip: string;
  layoutSlot: DAppLayoutSlot;
  layoutHint: string;
  formSection: DAppFormSectionId;
  required?: boolean;
};

export const DAPP_FORM_SECTIONS: { id: DAppFormSectionId; title: string; description: string }[] = [
  {
    id: 'page-header',
    title: 'Page header',
    description: 'Hero area above tabs: title, excerpt, images, category, tags, and network.',
  },
  {
    id: 'links-actions',
    title: 'Links and actions',
    description: 'Website, social, docs, and quick-action buttons on the published page.',
  },
  {
    id: 'description',
    title: 'Description tab',
    description: 'Full overview, utility, how-to, and benefits sections.',
  },
  {
    id: 'fees',
    title: 'Fees tab',
    description: 'Pricing overview and cost breakdown for users.',
  },
  {
    id: 'overview-extras',
    title: 'Overview extras',
    description: 'Gallery, downloads, and contact details on the Overview tab.',
  },
];

export const DAPP_LISTING_FIELD_MAP: DAppFieldDef[] = [
  {
    key: 'name',
    label: 'Project name',
    tooltip: 'The main title on your dApp page and in the marketplace.',
    layoutSlot: 'header.title',
    layoutHint: 'Page header',
    formSection: 'page-header',
    required: true,
  },
  {
    key: 'shortDescription',
    label: 'Short description',
    tooltip: 'One or two sentences shown under the title in the page header.',
    layoutSlot: 'header.excerpt',
    layoutHint: 'Page header',
    formSection: 'page-header',
    required: true,
  },
  {
    key: 'logoUrl',
    label: 'Logo',
    tooltip: 'Square icon beside the title and on marketplace cards.',
    layoutSlot: 'header.logo',
    layoutHint: 'Page header',
    formSection: 'page-header',
  },
  {
    key: 'featureImageUrl',
    label: 'Featured image',
    tooltip: 'Wide hero image on the right side of the page header.',
    layoutSlot: 'header.featuredImage',
    layoutHint: 'Page header',
    formSection: 'page-header',
    required: true,
  },
  {
    key: 'category',
    label: 'Category',
    tooltip: 'Helps users filter the marketplace and shows as a chip on your page.',
    layoutSlot: 'header.category',
    layoutHint: 'Page header',
    formSection: 'page-header',
    required: true,
  },
  {
    key: 'tags',
    label: 'Tags',
    tooltip: 'Up to 12 tags for discovery. Shown in the header and on cards.',
    layoutSlot: 'header.tags',
    layoutHint: 'Page header',
    formSection: 'page-header',
  },
  {
    key: 'networkLayer',
    label: 'Network layer',
    tooltip: 'L1 Kaspa, L2 EVM, or multichain. Drives the network badge.',
    layoutSlot: 'header.network',
    layoutHint: 'Page header',
    formSection: 'page-header',
    required: true,
  },
  {
    key: 'supportedChains',
    label: 'Supported chains',
    tooltip: 'Specific chains your dApp runs on. Listed in the header and Overview.',
    layoutSlot: 'header.network',
    layoutHint: 'Page header',
    formSection: 'page-header',
  },
  {
    key: 'websiteUrl',
    label: 'Website',
    tooltip: 'Primary link shown in the header social row.',
    layoutSlot: 'header.socialLinks',
    layoutHint: 'Page header',
    formSection: 'links-actions',
  },
  {
    key: 'socialLinks',
    label: 'Social links',
    tooltip: 'X, Discord, Telegram, and more. Shown in header and Overview.',
    layoutSlot: 'header.socialLinks',
    layoutHint: 'Page header',
    formSection: 'links-actions',
  },
  {
    key: 'documentationLinks',
    label: 'Documentation',
    tooltip: 'Docs, GitBook, or API links on the Overview tab.',
    layoutSlot: 'tab.overview.actionButtons',
    layoutHint: 'Overview tab',
    formSection: 'links-actions',
  },
  {
    key: 'actionButtons',
    label: 'Action buttons',
    tooltip: 'Quick actions like Launch app or Try demo on the Overview tab.',
    layoutSlot: 'tab.overview.actionButtons',
    layoutHint: 'Overview tab',
    formSection: 'links-actions',
  },
  {
    key: 'fullDescription',
    label: 'Full description',
    tooltip: 'Main overview text on the Description tab.',
    layoutSlot: 'tab.description',
    layoutHint: 'Description tab',
    formSection: 'description',
    required: true,
  },
  {
    key: 'utility',
    label: 'Utility / use case',
    tooltip: 'What problem your dApp solves. Shown on the Description tab.',
    layoutSlot: 'tab.description',
    layoutHint: 'Description tab',
    formSection: 'description',
  },
  {
    key: 'process',
    label: 'How to use',
    tooltip: 'Step-by-step or workflow summary on the Description tab.',
    layoutSlot: 'tab.description',
    layoutHint: 'Description tab',
    formSection: 'description',
  },
  {
    key: 'benefits',
    label: 'Benefits',
    tooltip: 'Why users should care. Shown on the Description tab.',
    layoutSlot: 'tab.description',
    layoutHint: 'Description tab',
    formSection: 'description',
  },
  {
    key: 'feesOverview',
    label: 'Fees overview',
    tooltip: 'High-level fee summary on the Fees tab.',
    layoutSlot: 'tab.fees',
    layoutHint: 'Fees tab',
    formSection: 'fees',
  },
  {
    key: 'feesPricing',
    label: 'Pricing details',
    tooltip: 'Specific pricing tiers or rates on the Fees tab.',
    layoutSlot: 'tab.fees',
    layoutHint: 'Fees tab',
    formSection: 'fees',
  },
  {
    key: 'feesCosts',
    label: 'Additional costs',
    tooltip: 'Gas, listing, or subscription costs on the Fees tab.',
    layoutSlot: 'tab.fees',
    layoutHint: 'Fees tab',
    formSection: 'fees',
  },
  {
    key: 'galleryUrls',
    label: 'Gallery',
    tooltip: 'Screenshots shown in the Overview tab gallery.',
    layoutSlot: 'tab.overview.gallery',
    layoutHint: 'Overview tab',
    formSection: 'overview-extras',
  },
  {
    key: 'optionalFileUrls',
    label: 'Optional files',
    tooltip: 'Downloadable assets on the Overview tab.',
    layoutSlot: 'tab.overview.gallery',
    layoutHint: 'Overview tab',
    formSection: 'overview-extras',
  },
  {
    key: 'contactX',
    label: 'X handle',
    tooltip: 'Project contact on the Overview tab.',
    layoutSlot: 'tab.overview.contacts',
    layoutHint: 'Overview tab',
    formSection: 'overview-extras',
  },
  {
    key: 'contactTelegram',
    label: 'Telegram',
    tooltip: 'Telegram contact link on the Overview tab.',
    layoutSlot: 'tab.overview.contacts',
    layoutHint: 'Overview tab',
    formSection: 'overview-extras',
  },
  {
    key: 'contactDiscord',
    label: 'Discord',
    tooltip: 'Discord invite on the Overview tab.',
    layoutSlot: 'tab.overview.contacts',
    layoutHint: 'Overview tab',
    formSection: 'overview-extras',
  },
  {
    key: 'additionalNotes',
    label: 'Additional notes',
    tooltip: 'Extra context shown at the bottom of the Overview tab.',
    layoutSlot: 'tab.overview.contacts',
    layoutHint: 'Overview tab',
    formSection: 'overview-extras',
  },
];

export function getFieldsForSection(sectionId: DAppFormSectionId): DAppFieldDef[] {
  return DAPP_LISTING_FIELD_MAP.filter((f) => f.formSection === sectionId);
}

export function getFieldDef(key: string): DAppFieldDef | undefined {
  return DAPP_LISTING_FIELD_MAP.find((f) => f.key === key);
}
