
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
          // Configurer les noms de fichiers pour qu'ils soient cohérents
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
          manualChunks: {
            react: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast', '@radix-ui/react-tooltip']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'jspdf', 'jspdf-autotable']
    },
    publicDir: 'public',
    base: basePath,
  };
});
