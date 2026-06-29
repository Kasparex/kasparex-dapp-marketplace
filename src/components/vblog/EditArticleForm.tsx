'use client';

import { VBlogArticle } from '@/lib/vblog/types';
import { CreateArticleForm } from './CreateArticleForm';

interface EditArticleFormProps {
  article: VBlogArticle;
  onSubmit: (articleId: string, updates: Partial<Omit<VBlogArticle, 'id' | 'author' | 'publishDate'>>) => Promise<void>;
  onCancel?: () => void;
}

/** Edit mode uses the same form as Create for a single shared UI/UX surface. */
export function EditArticleForm({ article, onSubmit, onCancel }: EditArticleFormProps) {
  return <CreateArticleForm article={article} onUpdate={onSubmit} onCancel={onCancel} />;
}
