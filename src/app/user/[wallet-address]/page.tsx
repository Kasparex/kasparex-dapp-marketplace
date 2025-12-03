import { UserProfileContent } from './UserProfileContent';

interface PageProps {
  params: Promise<{
    'wallet-address': string;
  }>;
}

// Generate static params (empty array - profiles are client-side only)
// For static export, we can't pre-generate all wallet addresses
export async function generateStaticParams(): Promise<Array<{ 'wallet-address': string }>> {
  return []; // Empty array - routes will work client-side
}

export default async function UserProfilePage({ params }: PageProps) {
  await params; // Await params to ensure proper server component behavior
  return <UserProfileContent />;
}
