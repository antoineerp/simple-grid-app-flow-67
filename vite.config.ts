
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",  // Changé de "::" à "0.0.0.0" pour une meilleure compatibilité
    port: 8080,
    strictPort: true, // Assure que Vite n'essaie pas un autre port si 8080 est occupé
    hmr: {
      clientPort: 443  // Pour le hot-reloading dans Codespaces
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    target: 'es2015',
    cssCodeSplit: true,
  },
  publicDir: 'public',
  base: '/',
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
}));

