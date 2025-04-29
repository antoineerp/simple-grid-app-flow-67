
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const isInfomaniak = process.env.VITE_HOSTING === 'infomaniak' || process.env.NODE_ENV === 'production';
  const basePath = isInfomaniak ? '/' : '/';
  
  return {
    server: {
      host: "::",
      port: 8080,
      strictPort: true,
      hmr: {
        clientPort: 443
      },
      // Ajout de la configuration pour autoriser tous les hôtes
      cors: true,
      proxy: {},
      // Configuration explicite des hôtes autorisés
      allowedHosts: true, // Changed from 'all' to true to match the expected type
    },
    preview: {
      // Également autoriser tous les hôtes pour le mode preview
      port: 8080,
      host: true,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "jspdf": path.resolve(__dirname, "node_modules/jspdf/dist/jspdf.es.min.js"),
        "jspdf-autotable": path.resolve(__dirname, "node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.js")
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
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) {
              return 'assets/[name].[hash].[ext]';
            }
            const info = assetInfo.name.split('.');
            const ext = info.pop();
            const name = info.join('.');
            return `assets/${name}.${ext}`;
          },
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js',
        },
        external: []
      }
    },
    publicDir: 'public',
    base: basePath,
    optimizeDeps: {
      include: ['jspdf', 'jspdf-autotable']
    },
    // Configuration des variables d'environnement
    envPrefix: 'VITE_',
  };
});
