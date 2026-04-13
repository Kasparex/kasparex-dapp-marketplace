import { redirect } from 'next/navigation';

type HomeSearchParams = Record<string, string | string[] | undefined>;

function buildDappsQuery(searchParams: HomeSearchParams): string {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(searchParams)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      for (const v of val) params.append(key, v);
    } else {
      params.set(key, val);
    }
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const sp = await searchParams;
  redirect(`/dapps${buildDappsQuery(sp)}`);
}
