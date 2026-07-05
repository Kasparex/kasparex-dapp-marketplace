import type { VBlogArticle } from '@/lib/vblog/types';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import type { ChroniclesCommunitySubmission } from '@/lib/chronicles/communitySubmissions';

export type HubContentKind = 'vblog' | 'tokens' | 'dapps' | 'chronicles';

export type HubContentRegistry = {
  updatedAt: string;
  vblog: VBlogArticle[];
  tokens: PublishedTokenListing[];
  dapps: DirectoryListing[];
  chronicles: ChroniclesCommunitySubmission[];
};

export const EMPTY_HUB_CONTENT_REGISTRY: HubContentRegistry = {
  updatedAt: new Date(0).toISOString(),
  vblog: [],
  tokens: [],
  dapps: [],
  chronicles: [],
};

export type HubContentSyncOp = 'upsert' | 'delete';

export type HubContentSyncBody = {
  kind: HubContentKind;
  op: HubContentSyncOp;
  item?: unknown;
  id?: string;
  commitTxHash?: string;
};
