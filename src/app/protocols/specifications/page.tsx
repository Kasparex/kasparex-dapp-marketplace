import { redirect } from 'next/navigation';

export default function ProtocolsSpecificationsRedirectPage() {
  redirect('/protocols?kind=protocol');
}
