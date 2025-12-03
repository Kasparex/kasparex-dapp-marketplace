import { UserProfileContent } from './UserProfileContent';

// Generate static params (empty array - profiles are client-side only)
// For static export, we can't pre-generate all wallet addresses
export async function generateStaticParams() {
  return []; // Empty array - routes will work client-side
}

export default function UserProfilePage() {
  return <UserProfileContent />;
}
