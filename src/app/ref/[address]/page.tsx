import { notFound } from 'next/navigation';
import { RefLandingContent } from './RefLandingContent';

function isValidEvmAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  return /^0x[a-fA-F0-9]{40}$/.test(trimmed);
}

interface PageProps {
  params: Promise<{ address: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { address } = await params;
  if (!isValidEvmAddress(address)) {
    return { title: 'Invalid referral - Kasparex' };
  }
  return {
    title: 'You were referred - Kasparex',
    description: 'Join Kasparex and use dApps. Your referrer will be set when you connect your wallet.',
  };
}

export default async function RefPage({ params }: PageProps) {
  const { address } = await params;
  const referrerAddress = address?.trim();

  if (!isValidEvmAddress(referrerAddress)) {
    notFound();
  }

  return (
    <RefLandingContent referrerAddress={referrerAddress} />
  );
}
