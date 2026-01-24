'use client';

import { ProductComment } from './types';

const STORAGE_KEYS = {
    comments: 'store_comments',
} as const;

/**
 * Get all comments for a product from storage
 */
export function getCommentsForProduct(productId: string): ProductComment[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEYS.comments);
        if (!stored) return [];
        const allComments: ProductComment[] = JSON.parse(stored);
        return allComments
            .filter(comment => comment.productId === productId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
        console.error('Error loading store comments:', error);
        return [];
    }
}

/**
 * Add a comment to a product
 */
export function addProductComment(commentData: Omit<ProductComment, 'id' | 'timestamp'>): ProductComment {
    if (typeof window === 'undefined') {
        throw new Error('Cannot add comment on server side');
    }

    const newComment: ProductComment = {
        ...commentData,
        id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        txHash: `0x${Math.random().toString(16).substring(2, 66).padStart(64, '0')}`, // Mock transaction hash
    };

    try {
        const stored = localStorage.getItem(STORAGE_KEYS.comments);
        const allComments: ProductComment[] = stored ? JSON.parse(stored) : [];
        allComments.push(newComment);
        localStorage.setItem(STORAGE_KEYS.comments, JSON.stringify(allComments));
    } catch (error) {
        console.error('Error saving store comment:', error);
        throw error;
    }

    return newComment;
}

/**
 * Delete a comment (simulated)
 */
export function deleteProductComment(commentId: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const stored = localStorage.getItem(STORAGE_KEYS.comments);
        if (!stored) return false;
        const allComments: ProductComment[] = JSON.parse(stored);
        const filtered = allComments.filter(c => c.id !== commentId);

        if (filtered.length === allComments.length) return false;

        localStorage.setItem(STORAGE_KEYS.comments, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Error deleting store comment:', error);
        return false;
    }
}
