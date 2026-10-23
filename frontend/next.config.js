/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Vercel Image Optimization Controls
  images: {
    // When enabled via environment variable, completely bypasses Vercel's Image Optimization
    // service to prevent 402/quota errors during monthly transformation allowance exhaustion.
    unoptimized: process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES === 'true',

    // Support modern formats with better compression ratios
    formats: ['image/avif', 'image/webp'],

    // Prune deviceSizes from default 8 down to the 5 breakpoints used in our Tailwind layout:
    // Defaults: [640, 750, 828, 1080, 1200, 1920, 2048, 3840] (8 variants per image)
    // Pruned:   [640, 768, 1024, 1280, 1920] (eliminates 750, 828, 1080, 2048, 3840)
    deviceSizes: [640, 768, 1024, 1280, 1920],

    // Prune imageSizes to eliminate redundant thumbnail variants
    // Defaults: [16, 32, 48, 64, 96, 128, 256, 384] (8 variants)
    // Pruned:   [16, 32, 48, 64, 96, 128, 256]
    imageSizes: [16, 32, 48, 64, 96, 128, 256],

    // Cache transformed variants at Vercel's Edge for 1 full year (31,536,000s)
    // instead of Next.js default 60 seconds, preventing frequent re-transformations
    minimumCacheTTL: 31536000,

    // Block SVGs from raster transformation pipeline (SVGs should always be unoptimized)
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Set long-lived immutable cache headers on static public assets
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif|ico|json)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
