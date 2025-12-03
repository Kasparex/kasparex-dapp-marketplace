import { AuthorPageContent } from './AuthorPageContent';

interface PageProps {
  params: Promise<{
    address: string;
  }>;
}

// Generate static params (empty array - authors are client-side only)
// For static export, we can't pre-generate all author addresses
export async function generateStaticParams(): Promise<Array<{ address: string }>> {
  return []; // Empty array - routes will work client-side
}

export async function generateMetadata({ params }: PageProps) {
  const { address } = await params;
  return {
    title: `Author: ${address.slice(0, 6)}...${address.slice(-4)} - Kasparex vBlog`,
  };
}

export default async function VBlogAuthorPage({ params }: PageProps) {
  await params; // Await params to ensure proper server component behavior
  return <AuthorPageContent />;
}
