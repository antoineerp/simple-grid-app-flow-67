
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Configuration pour Vite (compatible avec v5 et v6)
export default defineConfig(({ mode }) => {
  // Configuration spécifique pour Infomaniak
  const isInfomaniak = process.env.VITE_HOSTING === 'infomaniak' || process.env.NODE_ENV === 'production';
  const basePath = isInfomaniak ? '/' : '/';
  
  // Liste des plugins avec vérification conditionnelle
  const plugins = [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean);
  
  return {
    server: {
      host: "0.0.0.0",
      port: 8080,
      strictPort: true,
      hmr: {
        clientPort: 443
      }
    },
    plugins: plugins,
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
          // Configuration spécifique pour Infomaniak
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
        // Configuration explicite des dépendances externes pour éviter les erreurs de compilation
        external: []
      }
    },
    publicDir: 'public',
    base: basePath,
    optimizeDeps: {
      // Inclure jspdf et jspdf-autotable pour s'assurer qu'ils sont correctement traités
      include: ['jspdf', 'jspdf-autotable']
    }
  };
});
