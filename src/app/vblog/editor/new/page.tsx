import { redirect } from 'next/navigation';

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function VBlogEditorNewPage({ searchParams }: PageProps) {
  const sp = (await searchParams) || {};
  const returnTo = typeof sp.returnTo === 'string' ? sp.returnTo : undefined;
  const author = typeof sp.author === 'string' ? sp.author : undefined;

  const qs = new URLSearchParams();
  qs.set('tab', 'create');
  if (returnTo) qs.set('returnTo', returnTo);
  if (author) qs.set('author', author);

  redirect(`/vblog/dashboard?${qs.toString()}`);
}

