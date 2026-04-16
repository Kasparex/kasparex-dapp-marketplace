'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudioRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/u?tab=workspace');
    }, [router]);

    return (
        <div className="flex h-[70vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#02abb8] border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Opening Profile Hub...</p>
            </div>
        </div>
    );
}
