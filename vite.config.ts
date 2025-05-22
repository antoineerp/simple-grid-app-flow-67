
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { randomBytes } from "crypto";

// Polyfill for crypto.getRandomValues
if (!globalThis.crypto) {
  // @ts-ignore - Add crypto polyfill for Node environment
  globalThis.crypto = {
    // Implémentation générique qui fonctionne avec n'importe quel TypedArray
    getRandomValues: function(array) {
      if (!array || !array.length) {
        return array;
      }
      
      // Générer des octets aléatoires
      const bytes = randomBytes(array.length);
      
      // Copie octet par octet pour éviter les problèmes de typage
      for (let i = 0; i < array.length; i++) {
        array[i] = bytes[i];
      }
      
      return array;
    }
  };
}

// Configuration pour Vite (compatible avec v5 et v6)
export default defineConfig(({ mode }) => {
  // Configuration spécifique pour Infomaniak
  const isInfomaniak = process.env.VITE_HOSTING === 'infomaniak' || process.env.NODE_ENV === 'production';
  const basePath = isInfomaniak ? '/' : '/';
  
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
    optimizeDeps: {
      include: ['jspdf', 'jspdf-autotable', 'react-beautiful-dnd']
    },
    publicDir: 'public',
    base: basePath,
  };
});
