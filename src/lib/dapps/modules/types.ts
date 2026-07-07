import type { ComponentType, ReactNode } from 'react';
import type { DApp } from '@/lib/dapps';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';

export type DAppBlockPlacement = 'header' | 'tab' | 'sidebar' | 'widget-footer';

export type DAppBlockProps = {
  dapp: DApp;
  contractAddress?: string;
  listing?: DirectoryListing;
};

export type DAppBlock = {
  id: string;
  placement: DAppBlockPlacement;
  component: ComponentType<DAppBlockProps>;
  order?: number;
  label?: string;
};

export type DAppTabDef<T extends string = string> = {
  id: T;
  label: string;
  icon?: ReactNode;
  rightAdornment?: ReactNode;
};
