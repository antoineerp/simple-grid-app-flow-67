
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
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
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // Garantir que les fichiers sont générés dans le bon dossier
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    target: 'es2018',
    // S'assurer que tous les assets sont dans dist/assets
    emptyOutDir: true,
  },
  publicDir: 'public',
  base: '/', // Utiliser un chemin relatif pour garantir que les assets sont correctement référencés
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
}));
