/**
 * DecentralizedImage Component
 * 
 * Loads images from decentralized storage (Krex Nodes/Storacha/IPFS)
 * with automatic fallback chain for maximum availability
 */

import { useState, useEffect } from "react";
import { resolveAsset } from "~/lib/storage/decentralized";

interface DecentralizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  cid: string;
  fallback?: string;
  alt: string;
}

export function DecentralizedImage({ 
  cid, 
  fallback, 
  alt,
  className,
  ...props 
}: DecentralizedImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      setIsLoading(true);
      setError(false);

      try {
        // Resolve asset from decentralized storage
        const url = await resolveAsset(cid, fallback);
        
        if (!mounted) return;

        // Preload image to verify it's available
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            if (mounted) {
              setSrc(url);
              setIsLoading(false);
            }
            resolve();
          };
          img.onerror = () => {
            if (mounted) {
              setError(true);
              setIsLoading(false);
            }
            reject(new Error('Image failed to load'));
          };
          img.src = url;
        });
      } catch (err) {
        if (mounted) {
          setError(true);
          setIsLoading(false);
        }
        console.error('Failed to load decentralized image:', err);
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [cid, fallback]);

  if (isLoading) {
    return (
      <div 
        className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 ${className || ''}`}
        style={{ minHeight: '200px' }}
        aria-label="Loading image..."
      />
    );
  }

  if (error || !src) {
    return (
      <div 
        className={`bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center ${className || ''}`}
        style={{ minHeight: '200px' }}
        aria-label={alt || "Image failed to load"}
      >
        <span className="text-zinc-400 dark:text-zinc-600 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      {...props}
    />
  );
}



