/**
 * Image Optimization Utilities
 * Helper functions to determine when Next.js images should bypass Vercel's
 * dynamic transformation endpoint (/_next/image) to avoid quota consumption and 402 errors.
 */

export interface ImageOptimizationCheckOptions {
  src: string;
  width?: number;
  height?: number;
  explicitUnoptimized?: boolean;
  envFlag?: boolean;
}

/**
 * Determines whether an image should be marked as `unoptimized: true`.
 *
 * Rules:
 * 1. Explicit unoptimized flag: if caller explicitly passes unoptimized: true.
 * 2. Environment kill-switch: if NEXT_PUBLIC_UNOPTIMIZED_IMAGES is true.
 * 3. Vector format: SVGs do not benefit from rasterization and should always be unoptimized.
 * 4. Micro-assets / icons: assets with width or height <= 64px provide negligible bandwidth
 *    savings when resized but consume valuable transformation credits.
 */
export function shouldBypassOptimization(options: ImageOptimizationCheckOptions): boolean {
  const { src, width, height, explicitUnoptimized, envFlag } = options;

  if (explicitUnoptimized) {
    return true;
  }

  if (envFlag || process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES === 'true') {
    return true;
  }

  if (!src) {
    return true;
  }

  // Check for SVG extension (handling query params if any)
  const cleanPath = src.split('?')[0].toLowerCase();
  if (cleanPath.endsWith('.svg')) {
    return true;
  }

  // Check for small icons or thumbnails (<= 64px)
  if (typeof width === 'number' && width > 0 && width <= 64) {
    return true;
  }
  if (typeof height === 'number' && height > 0 && height <= 64) {
    return true;
  }

  return false;
}

/**
 * Returns the recommended device sizes for responsive image breakpoints.
 * Pruned from Next.js default 8 variants down to 5 to avoid creating redundant
 * transformations on Vercel.
 */
export function getPrunedDeviceSizes(): number[] {
  return [640, 768, 1024, 1280, 1920];
}

/**
 * Returns recommended imageSizes for smaller elements.
 * Pruned from default 8 variants down to 6.
 */
export function getPrunedImageSizes(): number[] {
  return [16, 32, 48, 64, 96, 128, 256];
}
