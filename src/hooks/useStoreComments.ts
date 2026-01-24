'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductComment } from '@/lib/store/types';
import { getCommentsForProduct, addProductComment, deleteProductComment } from '@/lib/store/comments';

/**
 * Hook for managing store product comments
 */
export function useStoreComments(productId: string) {
    const [comments, setComments] = useState<ProductComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadComments = useCallback(() => {
        setIsLoading(true);
        try {
            const productComments = getCommentsForProduct(productId);
            setComments(productComments);
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    // Load comments on mount and whenever productId changes
    useEffect(() => {
        loadComments();
    }, [loadComments]);

    /**
     * Add a new comment
     */
    const addComment = useCallback(async (content: string, author: string): Promise<ProductComment> => {
        const newComment = addProductComment({
            productId,
            content,
            author,
        });
        setComments(prev => [newComment, ...prev]);
        return newComment;
    }, [productId]);

    /**
     * Delete a comment
     */
    const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
        const deleted = deleteProductComment(commentId);
        if (deleted) {
            setComments(prev => prev.filter(c => c.id !== commentId));
        }
        return deleted;
    }, []);

    return {
        comments,
        isLoading,
        loadComments,
        addComment,
        deleteComment,
    };
}
