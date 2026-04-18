import { redirect } from 'next/navigation';

export default function ProtocolsDocumentationRedirectPage() {
  redirect('/protocols?kind=documentation');
}
