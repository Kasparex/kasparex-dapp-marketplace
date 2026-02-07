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
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-12">
                <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter mb-2">
                    vBlog Article Editor
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                    Create and publish decentralized articles directly to the Kasparex ecosystem.
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm">
                <CreateArticleForm onSubmit={handleSubmit} onCancel={() => router.push('/studio')} />
            </div>
        </div>
    );
}
