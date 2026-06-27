'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCommentsForArticle } from '@/lib/vblog/data';

export function useDAppCommentsCount(articleId: string) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    setCount(getCommentsForArticle(articleId).length);
  }, [articleId]);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'vblog_comments' || e.key === null) refresh();
    };
    const onUpdated = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('vblog-comments-updated', onUpdated);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('vblog-comments-updated', onUpdated);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  return count;
}
