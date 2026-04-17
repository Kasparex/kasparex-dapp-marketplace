import { redirect } from 'next/navigation';

/** Listing flow lives in Profile Hub (My dApps → List dApp). */
export default function ListDAppRedirectPage() {
  redirect('/dapps/editor/new?mode=list');
}
