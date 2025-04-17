
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && {
      name: 'dev-only-plugin',
      apply: 'serve',
      // Suppression du composant tagger en production
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Generate more predictable filenames for assets
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          // Add a null check for assetInfo.name
          const extType = assetInfo.name?.split('.').pop() || 'unknown';
          return `assets/[name].[hash].[ext]`;
        },
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler') || id.includes('prop-types')) {
              return 'react-vendor';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  publicDir: 'public',
  base: '/',
}));
