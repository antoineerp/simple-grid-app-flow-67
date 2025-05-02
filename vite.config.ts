
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
          // Désactiver complètement le hachage des noms de fichiers
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name]-chunk.js',
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) return 'assets/[name].[ext]';
            
            const info = assetInfo.name.split('.');
            const ext = info.pop();
            const name = info.join('.');
            
            if (ext === 'css') {
              return `assets/${name}.css`;
            }
            
            return `assets/${name}.${ext}`;
          },
          // Forcer les scripts à être des modules ES
          format: 'es'
        },
        external: []
      }
    },
    publicDir: 'public',
    base: basePath,
    optimizeDeps: {
      include: ['jspdf', 'jspdf-autotable']
    }
  };
});
