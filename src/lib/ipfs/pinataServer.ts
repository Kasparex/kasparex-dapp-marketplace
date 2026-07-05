import PinataService, { getPinataService } from '@/lib/ipfs/pinata';

/** Server-side Pinata instance (prefer non-public env vars). */
export function getServerPinataService() {
  return new PinataService({
    apiKey: process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY || '',
    apiSecret: process.env.PINATA_API_SECRET || process.env.NEXT_PUBLIC_PINATA_API_SECRET || '',
  });
}

export { getPinataService };
