'use client';

import { CreateArticleForm } from '@/components/vblog/CreateArticleForm';
import { createArticle } from '@/lib/vblog/data';
import { useRouter } from 'next/navigation';

export default function StudioVBlogPage() {
    const router = useRouter();

    const handleSubmit = async (articleData: any) => {
        try {
            createArticle(articleData);
            router.push('/u?tab=workspace');
        } catch (error) {
            console.error('Submission failed:', error);
            throw error;
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
                        Create Article
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-2xl">
                        Craft and publish decentralized articles. Your content is stored permanently on the Kaspa network.
                    </p>
                </div>

                <div className="hidden md:block">
                    <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </div>
                        <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                            vBlog Editor
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 shadow-sm overflow-hidden">
                <div className="bg-zinc-50/50 dark:bg-white/5 p-8">
                    <CreateArticleForm onSubmit={handleSubmit} onCancel={() => router.push('/u?tab=workspace')} />
                </div>
            </div>
        </div>
    );
}
