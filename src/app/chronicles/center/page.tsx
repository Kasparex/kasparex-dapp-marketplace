import { Suspense } from 'react';
import { ChroniclesCenterContent } from '@/components/chronicles/center/ChroniclesCenterContent';

export default function ChroniclesCenterPage() {
  return (
    <Suspense fallback={<div className="text-zinc-500">Loading Chronicles Center…</div>}>
      <ChroniclesCenterContent />
    </Suspense>
  );
}
