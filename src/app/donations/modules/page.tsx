import { redirect } from 'next/navigation';

/** Standalone modules page removed; modules live in campaign create/edit forms. */
export default function CrowdKasModulesPage() {
  redirect('/donations/studio?tab=l2-escrow#crowdkas-dashboard-modules');
}
