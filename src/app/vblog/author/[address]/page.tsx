import { AuthorPageContent } from './AuthorPageContent';

// Generate static params (empty array - authors are client-side only)
// For static export, we can't pre-generate all author addresses
export async function generateStaticParams() {
  return []; // Empty array - routes will work client-side
}

export default function VBlogAuthorPage() {
  return <AuthorPageContent />;
}
