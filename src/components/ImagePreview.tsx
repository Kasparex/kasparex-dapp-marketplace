'use client';

import { useState, useEffect } from 'react';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';

interface ImagePreviewProps {
  imageUrl: string;
  alt?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  className?: string;
  onError?: () => void;
  onLoad?: () => void;
  /** object-cover (default) or object-contain for logos/metadata art */
  objectFit?: 'cover' | 'contain';
}

/**
 * Check if a string is an IPFS CID (starts with Qm or bafy)
 */
function isIPFSCID(str: string): boolean {
  if (!str) return false;
  const clean = str.replace(/^ipfs:\/\//, '').replace(/^\/?ipfs\//, '');
  return /^(Qm|bafy|bafk)/i.test(clean) && clean.length > 20;
}

/**
 * Convert IPFS CID or URL to a displayable URL
 */
function normalizeImageUrl(url: string): string {
  if (!url) return url;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (isIPFSCID(url)) {
    return getBestGatewayUrl(url);
  }

  if (url.startsWith('ipfs://')) {
    const cid = url.replace(/^ipfs:\/\//, '');
    return getBestGatewayUrl(cid);
  }

  return url;
}

export function ImagePreview({
  imageUrl,
  alt = 'Preview',
  aspectRatio = 'auto',
  className = '',
  onError,
  onLoad,
  objectFit = 'cover',
}: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [debouncedUrl, setDebouncedUrl] = useState(normalizeImageUrl(imageUrl));

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    const timer = setTimeout(() => {
      setDebouncedUrl(normalizeImageUrl(imageUrl));
    }, 300);

    return () => clearTimeout(timer);
  }, [imageUrl]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (onError) onError();
  };

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: 'min-h-[4rem]',
  };

  const objectFitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  if (!debouncedUrl || debouncedUrl.trim() === '') {
    return (
      <div
        className={`
          flex items-center justify-center max-w-full
          bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700
          ${aspectRatioClasses[aspectRatio]}
          ${className}
        `}
      >
        <p className="text-xs text-zinc-500 dark:text-zinc-400 px-2 text-center">No image URL</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        className={`
          flex items-center justify-center max-w-full
          bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800
          ${aspectRatioClasses[aspectRatio]}
          ${className}
        `}
      >
        <div className="text-center p-4">
          <svg
            className="w-8 h-8 mx-auto text-red-500 dark:text-red-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-xs text-red-600 dark:text-red-400">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700
        bg-zinc-100 dark:bg-zinc-800 max-w-full
        ${aspectRatioClasses[aspectRatio]}
        ${className}
      `}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02abb8]" />
        </div>
      )}
      <img
        src={debouncedUrl}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
        className={`
          w-full h-full max-w-full max-h-full ${objectFitClass} transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
        `}
      />
    </div>
  );
}
