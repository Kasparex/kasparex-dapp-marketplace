import { redirect } from 'next/navigation';

/** Build flow lives in Profile Hub (My dApps → Build dApp). */
export default function BuildDAppRedirectPage() {
  redirect('/dapps/editor/new?mode=build');
}
