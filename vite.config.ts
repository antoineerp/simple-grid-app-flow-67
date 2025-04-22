
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Define the configuration with proper typing
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    hmr: {
      clientPort: 443
    }
  },
  plugins: [
    react(),
    // Lovable tagger n'est pas utilisé car il n'est pas installé,
    // et il n'est pas nécessaire pour le fonctionnement de base
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: mode === 'development',
    minify: mode === 'production',
    cssCodeSplit: true,
    target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari13'],
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          return undefined;
        },
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  publicDir: 'public',
  base: '/',
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true
  },
  define: {
    '__APP_MODE__': JSON.stringify(mode)
  }
}));
