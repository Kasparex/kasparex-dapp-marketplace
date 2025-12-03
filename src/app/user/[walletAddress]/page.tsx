import { UserProfileContent } from './UserProfileContent';

interface PageProps {
  params: Promise<{
    walletAddress: string;
  }>;
}

export async function generateStaticParams(): Promise<Array<{ walletAddress: string }>> {
  return [];
}

export async function generateMetadata({ params }: PageProps) {
  const { walletAddress } = await params;
  return {
    title: `User Profile: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} - Kasparex`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  await params;
  return <UserProfileContent />;
}

