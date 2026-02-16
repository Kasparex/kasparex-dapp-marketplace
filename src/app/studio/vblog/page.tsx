'use client';

import { CreateArticleForm } from '@/components/vblog/CreateArticleForm';
import { createArticle } from '@/lib/vblog/data';
import { useRouter } from 'next/navigation';

export default function StudioVBlogPage() {
    const router = useRouter();

    const handleSubmit = async (articleData: any) => {
        try {
            createArticle(articleData);
            // Redirect to studio dashboard or activity after success
            router.push('/studio');
        } catch (error) {
            console.error('Submission failed:', error);
            throw error;
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Halo Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-100 via-orange-50/30 to-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 md:p-12">
                {/* Halo Background Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full -ml-48 -mb-48" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-full uppercase tracking-widest border border-orange-500/20">
                                    vBlog Editor
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-4">
                                Create Article
                            </h1>
                            <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-xl">
                                Craft and publish decentralized articles. Your content is stored permanently on the Kaspa network.
                            </p>
                        </div>

                        <div className="hidden md:block">
                            <div className="p-4 bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-white/10 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </div>
                                <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                    Decentralized Publishing
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-1 shadow-sm overflow-hidden">
                <div className="bg-zinc-50/50 dark:bg-white/5 p-8">
                    <CreateArticleForm onSubmit={handleSubmit} onCancel={() => router.push('/studio/dashboard')} />
                </div>
            </div>
        </div>
    );
}
