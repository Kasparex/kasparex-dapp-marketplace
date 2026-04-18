import { redirect } from 'next/navigation';

export default function ProtocolsToolsRedirectPage() {
  redirect('/protocols?kind=tool');
}
