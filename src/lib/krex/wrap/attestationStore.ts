/** Re-export: attestation helpers live next to mint receipts (same serverless chunk). */
export {
  type AttestationStoreFile,
  findAttestation,
  loadAttestationStore,
  persistAttestationStore,
  upsertAttestation,
} from './mintReceiptStore';

export const ATTESTATIONS_TN10_PATH = 'data/krex-wrap/attestations-tn10.json';
