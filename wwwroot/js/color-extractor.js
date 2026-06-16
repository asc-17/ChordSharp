/**
 * color-extractor.js
 * Extracts a dominant, vibrant color from an image element.
 * Guarantees the output is bright enough to be visible on dark backgrounds.
 */
(function () {
    'use strict';

    /**
     * Convert RGB to HSL
     */
    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    /**
     * Convert HSL to RGB
     */
    function hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    /**
     * Extract the dominant vibrant color from an image element.
     * Returns { r, g, b, h, s, l, hex, hexGlow } 
     * The color is guaranteed to have L >= 55% so it pops on dark backgrounds.
     * 
     * @param {HTMLImageElement} img - A loaded image element (must be same-origin or CORS-enabled)
     * @returns {Object|null} Color object or null if extraction fails
     */
    function extractDominantColor(img) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            // Sample at small size for performance
            const size = 64;
            canvas.width = size;
            canvas.height = size;
            ctx.drawImage(img, 0, 0, size, size);

            const imageData = ctx.getImageData(0, 0, size, size);
            const pixels = imageData.data;

            // Group pixels into hue buckets (18 buckets of 20° each)
            const bucketCount = 18;
            const buckets = [];
            for (let i = 0; i < bucketCount; i++) {
                buckets.push({ totalH: 0, totalS: 0, totalL: 0, count: 0, weight: 0 });
            }

            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
                if (a < 128) continue; // Skip transparent pixels

                const hsl = rgbToHsl(r, g, b);

                // Skip very dark (shadows), very light (highlights), and low-saturation (grey) pixels
                if (hsl.s < 12) continue;  // Too grey
                if (hsl.l < 8) continue;   // Too dark
                if (hsl.l > 92) continue;  // Too bright/white

                const bucketIndex = Math.min(Math.floor(hsl.h / 20), bucketCount - 1);
                const bucket = buckets[bucketIndex];
                // Weight by saturation — more vivid pixels contribute more
                const weight = hsl.s * (0.5 + 0.5 * (1 - Math.abs(hsl.l - 50) / 50));
                bucket.totalH += hsl.h * weight;
                bucket.totalS += hsl.s * weight;
                bucket.totalL += hsl.l * weight;
                bucket.count++;
                bucket.weight += weight;
            }

            // Find the bucket with highest combined weight (count * avg saturation)
            let bestBucket = null;
            let bestScore = 0;
            for (const bucket of buckets) {
                if (bucket.count < 5) continue; // Need a meaningful sample
                const avgSat = bucket.totalS / bucket.weight;
                const score = bucket.weight; // Weight already factors in saturation
                if (score > bestScore) {
                    bestScore = score;
                    bestBucket = bucket;
                }
            }

            if (!bestBucket || bestBucket.count === 0) return null;

            let h = bestBucket.totalH / bestBucket.weight;
            let s = bestBucket.totalS / bestBucket.weight;
            let l = bestBucket.totalL / bestBucket.weight;

            // === Brightness guarantee ===
            // Ensure lightness is at least 55% so it pops on dark backgrounds
            if (l < 55) l = 55;
            // Boost saturation to at least 45% for vibrancy
            if (s < 45) s = 45;
            // Cap lightness to avoid washing out
            if (l > 80) l = 80;

            const rgb = hslToRgb(h, s, l);
            const hex = '#' + [rgb.r, rgb.g, rgb.b].map(c => c.toString(16).padStart(2, '0')).join('');
            const hexGlow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;

            // Generate a darker container variant
            const containerRgb = hslToRgb(h, Math.max(s * 0.8, 30), Math.max(l * 0.55, 25));
            const hexContainer = '#' + [containerRgb.r, containerRgb.g, containerRgb.b].map(c => c.toString(16).padStart(2, '0')).join('');

            return { r: rgb.r, g: rgb.g, b: rgb.b, h, s, l, hex, hexGlow, hexContainer };
        } catch (e) {
            console.warn('Color extraction failed:', e);
            return null;
        }
    }

    /**
     * Apply extracted color as CSS custom properties on the document root.
     * Falls through to defaults when no cover/color is available.
     */
    function applyDynamicTheme(color) {
        const root = document.documentElement;
        if (!color) {
            // Remove dynamic overrides — falls back to default violet
            root.style.removeProperty('--accent-dynamic');
            root.style.removeProperty('--accent-dynamic-glow');
            root.style.removeProperty('--accent-dynamic-container');
            root.style.removeProperty('--accent-dynamic-r');
            root.style.removeProperty('--accent-dynamic-g');
            root.style.removeProperty('--accent-dynamic-b');
            return;
        }

        root.style.setProperty('--accent-dynamic', color.hex);
        root.style.setProperty('--accent-dynamic-glow', color.hexGlow);
        root.style.setProperty('--accent-dynamic-container', color.hexContainer);
        root.style.setProperty('--accent-dynamic-r', color.r);
        root.style.setProperty('--accent-dynamic-g', color.g);
        root.style.setProperty('--accent-dynamic-b', color.b);
    }

    /**
     * Load an image from URL and extract its dominant color.
     * @param {string} url - Image URL (must be same-origin or CORS)
     * @returns {Promise<Object|null>}
     */
    function extractColorFromUrl(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(extractDominantColor(img));
            img.onerror = () => resolve(null);
            img.src = url;
        });
    }

    // Expose globally
    window.ColorExtractor = {
        extractDominantColor,
        applyDynamicTheme,
        extractColorFromUrl
    };
})();
