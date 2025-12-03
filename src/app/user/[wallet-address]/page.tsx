import { UserProfileContent } from './UserProfileContent';

interface PageProps {
  params: Promise<{
    'wallet-address': string;
  }>;
}

// Generate static params (empty array - profiles are client-side only)
// For static export, we can't pre-generate all wallet addresses
export async function generateStaticParams(): Promise<Array<{ 'wallet-address': string }>> {
  return [];
}

export async function generateMetadata({ params }: PageProps) {
  const { 'wallet-address': walletAddress } = await params;
  return {
    title: `User Profile: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} - Kasparex`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  await params;
  return <UserProfileContent />;
}
