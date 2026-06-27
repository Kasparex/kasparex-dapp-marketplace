/** Supported chain options for directory listing submissions. */
export const DIRECTORY_LISTING_CHAINS = ['Kaspa', 'Kasplex', 'Igra'] as const;

export type DirectoryListingChain = (typeof DIRECTORY_LISTING_CHAINS)[number];

export function isDirectoryListingChain(value: string): value is DirectoryListingChain {
  return (DIRECTORY_LISTING_CHAINS as readonly string[]).includes(value);
}
