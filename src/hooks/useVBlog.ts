'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAllArticles,
  getArticleBySlug,
  getArticlesByAuthor,
  createArticle,
  updateArticle,
  deleteArticle,
  getCommentsForArticle,
  addComment,
} from '@/lib/vblog/data';
import { VBlogArticle, VBlogComment } from '@/lib/vblog/types';

/**
 * Hook for managing vBlog data
 */
export function useVBlog() {
  const [articles, setArticles] = useState<VBlogArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadArticles = useCallback(() => {
    setIsLoading(true);
    try {
      const allArticles = getAllArticles();
      setArticles(allArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load articles on mount - only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadArticles();
    }
  }, [loadArticles]);

  /**
   * Get article by slug
   */
  const getArticle = useCallback((slug: string): VBlogArticle | null => {
    return getArticleBySlug(slug);
  }, []);

  /**
   * Get articles by author
   */
  const getAuthorArticles = useCallback((authorAddress: string): VBlogArticle[] => {
    return getArticlesByAuthor(authorAddress);
  }, []);

  /**
   * Create a new article
   * TODO: Replace with actual smart contract call
   */
  const createNewArticle = useCallback(async (
    articleData: Omit<VBlogArticle, 'id' | 'slug' | 'publishDate' | 'cid' | 'articleId' | 'txHash' | 'status'>
  ): Promise<VBlogArticle> => {
    // Mock smart contract call
    // TODO: Replace with actual smart contract call
    const newArticle = createArticle(articleData);
    loadArticles(); // Reload articles
    return newArticle;
  }, [loadArticles]);

  /**
   * Update an existing article
   * TODO: Replace with actual smart contract call
   */
  const updateExistingArticle = useCallback(async (
    articleId: string,
    updates: Partial<Omit<VBlogArticle, 'id' | 'author' | 'publishDate'>>
  ): Promise<VBlogArticle | null> => {
    // Mock smart contract call
    // TODO: Replace with actual smart contract call
    const updated = updateArticle(articleId, updates);
    loadArticles(); // Reload articles
    return updated;
  }, [loadArticles]);

  /**
   * Get comments for an article
   */
  const getArticleComments = useCallback((articleId: string): VBlogComment[] => {
    return getCommentsForArticle(articleId);
  }, []);

  /**
   * Add a comment to an article
   * TODO: Replace with actual smart contract call for credit checking
   */
  const addArticleComment = useCallback(async (
    commentData: Omit<VBlogComment, 'id' | 'timestamp'>
  ): Promise<VBlogComment> => {
    // Mock credit checking - in real implementation, this would check smart contract
    // TODO: Replace with actual smart contract call for credit checking
    const newComment = addComment(commentData);
    return newComment;
  }, []);

  /**
   * Delete an article
   * TODO: Replace with actual smart contract call
   */
  const deleteExistingArticle = useCallback(async (articleId: string): Promise<boolean> => {
    const deleted = deleteArticle(articleId);
    if (deleted) {
      loadArticles(); // Reload articles
    }
    return deleted;
  }, [loadArticles]);

  return {
    articles,
    isLoading,
    loadArticles,
    getArticle,
    getAuthorArticles,
    createNewArticle,
    updateExistingArticle,
    deleteExistingArticle,
    getArticleComments,
    addArticleComment,
  };
}

