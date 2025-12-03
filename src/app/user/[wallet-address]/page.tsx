import { UserProfileContent } from './UserProfileContent';

// Type alias to work around hyphen in parameter name
type WalletAddressParams = {
  'wallet-address': string;
};

interface PageProps {
  params: Promise<WalletAddressParams>;
}

// Explicit export for Next.js static export detection
export async function generateStaticParams(): Promise<Array<WalletAddressParams>> {
  return [];
}

// Explicit export for metadata generation
export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const walletAddress = resolvedParams['wallet-address'];
  return {
    title: `User Profile: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} - Kasparex`,
  };
}

// Explicit default export
export default async function UserProfilePage({ params }: PageProps) {
  await params;
  return <UserProfileContent />;
}
