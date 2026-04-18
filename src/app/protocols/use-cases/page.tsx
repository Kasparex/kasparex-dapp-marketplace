import { redirect } from 'next/navigation';

export default function ProtocolsUseCasesRedirectPage() {
  redirect('/protocols?kind=use-case');
}
