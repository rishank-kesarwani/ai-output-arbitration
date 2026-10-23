'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { shouldBypassOptimization } from '../lib/image-utils';

export type SafeImageSrc = ImageProps['src'];

export interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: SafeImageSrc;
}

/**
 * SafeImage: A performance-hardened, transformation-aware wrapper around next/image that:
 * 1. Automatically enforces `unoptimized` for vector SVGs, small icons/thumbnails (<= 64px),
 *    and when NEXT_PUBLIC_UNOPTIMIZED_IMAGES is active.
 * 2. Gracefully falls back to a raw static source or fallbackSrc if Vercel's transformation
 *    fails (e.g., due to team quota exhaustion HTTP 402).
 * 3. Preserves intrinsic aspect ratio, responsive `sizes`, lazy loading, and Core Web Vitals.
 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  unoptimized,
  fallbackSrc,
  className,
  ...rest
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState<SafeImageSrc>(src);
  const [failedOptimization, setFailedOptimization] = useState(false);

  // Extract URL string for inspection (handling string paths and static imports)
  let srcString = '';
  if (typeof currentSrc === 'string') {
    srcString = currentSrc;
  } else if (currentSrc && typeof currentSrc === 'object') {
    if ('src' in currentSrc) {
      srcString = (currentSrc as { src: string }).src;
    } else if ('default' in currentSrc) {
      srcString = (currentSrc as { default: { src: string } }).default?.src || '';
    }
  }

  const numWidth = typeof width === 'number' ? width : undefined;
  const numHeight = typeof height === 'number' ? height : undefined;

  // Determine if Vercel image optimization should be bypassed
  const shouldBypass =
    failedOptimization ||
    shouldBypassOptimization({
      src: srcString,
      width: numWidth,
      height: numHeight,
      explicitUnoptimized: unoptimized,
    });

  const handleError = () => {
    if (!failedOptimization) {
      // First fallback: Retry the exact same source as unoptimized
      // (bypasses /_next/image which may have failed with HTTP 402)
      setFailedOptimization(true);
    } else if (fallbackSrc && fallbackSrc !== currentSrc) {
      // Second fallback: Use designated fallback asset
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      unoptimized={shouldBypass}
      onError={handleError}
      className={className}
      {...rest}
    />
  );
}
