/**
 * NFT collection filter for Workers-tab slots (Minecore + Diamond Mining modals).
 * Return undefined so any collection in the wallet stream can be deployed.
 */
export function getMinecoreDeckCollectionAllowlist(): string[] | undefined {
  return undefined;
}

/** @deprecated Use `getMinecoreDeckCollectionAllowlist` */
export const getMinecoreWorkerRowCollectionAllowlist = getMinecoreDeckCollectionAllowlist;
