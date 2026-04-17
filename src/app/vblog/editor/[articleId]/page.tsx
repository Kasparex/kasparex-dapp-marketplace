import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ articleId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function VBlogEditorExistingPage({ params, searchParams }: PageProps) {
  const { articleId } = await params;
  const sp = (await searchParams) || {};
  const returnTo = typeof sp.returnTo === 'string' ? sp.returnTo : undefined;

  const qs = new URLSearchParams();
  qs.set('tab', 'create');
  qs.set('edit', articleId);
  if (returnTo) qs.set('returnTo', returnTo);

  redirect(`/vblog/dashboard?${qs.toString()}`);
}

