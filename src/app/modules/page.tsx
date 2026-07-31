import { redirect } from 'next/navigation';

export default function ModulesLegacyRedirect() {
  redirect('/dapps/dashboard');
}
