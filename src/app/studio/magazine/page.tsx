'use client';

import { MagazineEditor } from '@/components/magazines/editor/MagazineEditor';

export default function StudioMagazinePage() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-12">
                <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter mb-2">
                    Magazine Editor
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                    Collaborate on digital issues, set revenue splits, and publish to decentralized storage.
                </p>
            </div>

            <MagazineEditor />
        </div>
    );
}
