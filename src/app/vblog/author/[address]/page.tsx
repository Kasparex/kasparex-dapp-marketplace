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

export default async function VBlogAuthorPage({ params }: PageProps) {
  await params; // Await params to ensure proper server component behavior
  return <AuthorPageContent />;
}
