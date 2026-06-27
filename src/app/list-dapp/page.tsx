import { redirect } from 'next/navigation';

/** Paid promotional dApp directory listings live on the dApps dashboard. */
export default function ListDAppRedirectPage() {
  redirect('/dapps/dashboard?tab=create');
}
