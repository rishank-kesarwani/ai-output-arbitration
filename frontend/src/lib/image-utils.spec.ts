import {
  shouldBypassOptimization,
  getPrunedDeviceSizes,
  getPrunedImageSizes,
} from './image-utils';

describe('image-utils', () => {
  const originalEnv = process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES;

  afterEach(() => {
    process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES = originalEnv;
  });

  describe('shouldBypassOptimization', () => {
    it('should bypass optimization if explicitUnoptimized is true', () => {
      const result = shouldBypassOptimization({
        src: '/hero.png',
        width: 1200,
        height: 800,
        explicitUnoptimized: true,
      });
      expect(result).toBe(true);
    });

    it('should bypass optimization if envFlag is true', () => {
      const result = shouldBypassOptimization({
        src: '/hero.png',
        width: 1200,
        height: 800,
        envFlag: true,
      });
      expect(result).toBe(true);
    });

    it('should bypass optimization if NEXT_PUBLIC_UNOPTIMIZED_IMAGES is set to true', () => {
      process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES = 'true';
      const result = shouldBypassOptimization({
        src: '/hero.png',
        width: 1200,
        height: 800,
      });
      expect(result).toBe(true);
    });

    it('should bypass optimization for SVG assets regardless of dimensions', () => {
      expect(
        shouldBypassOptimization({
          src: '/icon.svg',
          width: 512,
          height: 512,
        }),
      ).toBe(true);

      expect(
        shouldBypassOptimization({
          src: '/logo.SVG?v=1',
          width: 800,
          height: 200,
        }),
      ).toBe(true);
    });

    it('should bypass optimization for small icons (width <= 64)', () => {
      const result = shouldBypassOptimization({
        src: '/favicon-32x32.png',
        width: 32,
        height: 32,
      });
      expect(result).toBe(true);
    });

    it('should bypass optimization for small thumbnails (height <= 64)', () => {
      const result = shouldBypassOptimization({
        src: '/thumbnail.png',
        width: 120,
        height: 48,
      });
      expect(result).toBe(true);
    });

    it('should NOT bypass optimization for large raster photography/hero images', () => {
      delete process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES;
      const result = shouldBypassOptimization({
        src: '/hero.png',
        width: 1200,
        height: 630,
      });
      expect(result).toBe(false);
    });

    it('should bypass optimization if src is empty or missing', () => {
      const result = shouldBypassOptimization({
        src: '',
      });
      expect(result).toBe(true);
    });
  });

  describe('deviceSizes and imageSizes pruning', () => {
    it('should return 5 pruned deviceSizes matching layout breakpoints', () => {
      const sizes = getPrunedDeviceSizes();
      expect(sizes).toEqual([640, 768, 1024, 1280, 1920]);
      expect(sizes.length).toBe(5);
      // Confirms unnecessary default variants 750, 828, 1080, 2048, 3840 were pruned
      expect(sizes).not.toContain(750);
      expect(sizes).not.toContain(828);
      expect(sizes).not.toContain(3840);
    });

    it('should return 7 pruned imageSizes', () => {
      const sizes = getPrunedImageSizes();
      expect(sizes).toEqual([16, 32, 48, 64, 96, 128, 256]);
      expect(sizes).not.toContain(384);
    });
  });
});
