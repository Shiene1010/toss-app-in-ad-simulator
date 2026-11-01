import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Toss web framework harness requirements:
// - assetsDir: keep assets under root for webview consumption
// - base: sub-path base for Toss app-in-ad harness deployment
// - rollupOptions: externalize non-essential deps, keep SDK bridge globals
// - define: Toss runtime globals
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify--file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // Toss webview harness: keep assets relative to output dir for in-ad consumption
      assetsDir: '.',
      // Relative public path for Toss app-in-ad harness
      // Set to '.' so assets resolve relative to the built JS location
      rollupOptions: {
        output: {
          // Asset filename with hash for cache busting
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          // Preserve relative paths for webview consumption
          entryFileNames: 'assets/[name]-[hash].js',
        },
        // Externalize heavy deps that Toss harness provides globally
        external: ['@google/genai', 'express', 'motion'],
        // Preserve process env for Toss bridge
        preserveEntryPoints: true,
      },
    },
    // Toss runtime globals available in-bundle
    define: {
      'process.env.GEMINI_API_KEY': process.env.GEMINI_API_KEY || JSON.stringify(''),
      'process.env.APP_URL': process.env.APP_URL || JSON.stringify(''),
    },
  };
});
