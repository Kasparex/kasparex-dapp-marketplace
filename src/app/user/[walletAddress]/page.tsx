import { redirect } from 'next/navigation';

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
  const { walletAddress } = await params;
  // Backward compatible route: redirect into the unified public profile page.
  redirect(`/u/${encodeURIComponent(walletAddress)}`);
}

