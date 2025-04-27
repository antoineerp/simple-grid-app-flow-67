
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  // Forcer le chemin de base en production
  const basePath = '/';
  
  return {
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
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      minify: true,
      sourcemap: false,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: undefined,
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
        // Exclure les chemins PHP de l'analyse statique et les placeholders
        external: [
          /^\/assets\//,
          /placeholder\.(js|css)$/
        ]
      }
    },
    publicDir: 'public',
    base: basePath,
  };
});
