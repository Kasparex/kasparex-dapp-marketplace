import { redirect } from 'next/navigation';

/** Standalone dApp modules page removed. */
export default function DAppModulesPage() {
  redirect('/dapps/dashboard');
}
