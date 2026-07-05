/**
 * Kasparex Hub IPFS standard.
 * Use these helpers in all editors, upload flows, and display components.
 */

export { resolveHubMediaUrl } from '@/lib/hub/resolveMediaUrl';
export {
  normalizeIpfsUrlForForm,
  getBestGatewayUrl,
  getIpfsProxyPath,
  getIpfsProxyUrl,
  extractCidFromIpfsUrl,
} from '@/lib/ipfs/gateway';
export {
  cleanIpfsHash,
  extractCidsFromValues,
  requestIpfsUnpin,
  collectVblogMediaCids,
  collectTokenMediaCids,
  collectDappMediaCids,
  collectChroniclesMediaCids,
  collectStoreMediaCids,
  collectMagazineMediaCids,
} from '@/lib/ipfs/cidUtils';
export {
  HUB_DELETE_FEE_KAS,
  executeHubPaidDelete,
  finalizeHubContentDelete,
  buildHubDeletePlainNote,
  getHubDeleteTreasuryAddress,
} from '@/lib/hub/paidDelete';

import { normalizeIpfsUrlForForm } from '@/lib/ipfs/gateway';
import { requestIpfsUnpin } from '@/lib/ipfs/cidUtils';

/** Format a freshly uploaded CID for form state and persistence. */
export function formatHubUploadCid(cid: string): string {
  return normalizeIpfsUrlForForm(null, cid);
}

/** Normalize a pasted URL or CID for form state. */
export function formatHubMediaInput(value: string): string {
  return normalizeIpfsUrlForForm(value);
}

/** Best-effort Pinata unpin after content delete (media only). */
export async function deleteHubMedia(cids: string[]): Promise<void> {
  await requestIpfsUnpin(cids);
}
