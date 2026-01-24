'use client';

import { useState } from 'react';
import { CreateArticleForm } from './CreateArticleForm';
import { EditArticleForm } from './EditArticleForm';
import { VBlogArticle } from '@/lib/vblog/types';
import { useVBlog } from '@/hooks/useVBlog';

interface VBlogSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editArticle?: VBlogArticle | null;
}

export function VBlogSubmissionModal({
    isOpen,
    onClose,
    onSuccess,
    editArticle = null
}: VBlogSubmissionModalProps) {
    const { createNewArticle, updateExistingArticle } = useVBlog();

    if (!isOpen) return null;

    const handleCreate = async (articleData: Omit<VBlogArticle, 'id' | 'slug' | 'publishDate' | 'cid' | 'articleId' | 'txHash' | 'status'>) => {
        await createNewArticle(articleData);
        onSuccess();
        onClose();
    };

    const handleEdit = async (articleId: string, updates: Partial<Omit<VBlogArticle, 'id' | 'author' | 'publishDate'>>) => {
        await updateExistingArticle(articleId, updates);
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {editArticle ? 'Edit Article' : 'Create New Article'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {editArticle ? (
                        <EditArticleForm
                            article={editArticle}
                            onSubmit={handleEdit}
                            onCancel={onClose}
                        />
                    ) : (
                        <CreateArticleForm
                            onSubmit={handleCreate}
                            onCancel={onClose}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
