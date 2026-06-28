import { redirect } from 'next/navigation';

export default function ChroniclesRootRedirect() {
  redirect('/chronicles/chapters');
}
