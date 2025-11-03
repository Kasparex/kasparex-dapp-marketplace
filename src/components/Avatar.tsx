'use client';

import { useEffect, useRef } from 'react';

interface AvatarProps {
  address: string;
  size?: number;
  className?: string;
}

// Simple blockies-like identicon generator
function generateIdenticon(address: string, size: number = 8): string {
  // Create a simple hash from address
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate colors based on hash
  const hue = Math.abs(hash) % 360;
  const sat = 50 + (Math.abs(hash >> 8) % 30);
  const light = 40 + (Math.abs(hash >> 16) % 20);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Generate pattern based on hash
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const bit = (Math.abs(hash + x + y * size) % 2) === 0;
      if (bit) {
        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
      } else {
        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light + 20}%)`;
      }
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return canvas.toDataURL();
}

export function Avatar({ address, size = 40, className = '' }: AvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && address) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = size;
      canvas.height = size;

      // Create a simple hash from address
      let hash = 0;
      for (let i = 0; i < address.length; i++) {
        hash = address.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
      }

      // Generate colors based on hash
      const hue = Math.abs(hash) % 360;
      const sat = 50 + (Math.abs(hash >> 8) % 30);
      const light = 40 + (Math.abs(hash >> 16) % 20);

      // Generate pattern
      const gridSize = 8;
      const cellSize = size / gridSize;

      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          const bit = (Math.abs(hash + x + y * gridSize) % 2) === 0;
          if (bit) {
            ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
          } else {
            ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light + 20}%)`;
          }
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [address, size]);

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

