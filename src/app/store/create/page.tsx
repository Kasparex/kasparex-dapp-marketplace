import { redirect } from 'next/navigation';

export default function StoreCreatePage() {
  redirect('/store/dashboard?tab=create');
}
