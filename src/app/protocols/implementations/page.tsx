import { redirect } from 'next/navigation';

export default function ProtocolsImplementationsRedirectPage() {
  redirect('/protocols?kind=implementation');
}
