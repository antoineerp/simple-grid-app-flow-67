
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
      cors: true,
      proxy: {},
      allowedHosts: true,
    },
    preview: {
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
            if (!assetInfo.name) return 'assets/[name].[ext]';
            
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(css)$/i.test(assetInfo.name)) {
              return `assets/index.css`;
            }
            return `assets/[name].[ext]`;
          },
          chunkFileNames: 'assets/[name].js',
          entryFileNames: 'assets/main.js',
        },
        external: []
      },
      emptyOutDir: true,
      copyPublicDir: true,
      manifest: true
    },
    publicDir: 'public',
    base: basePath,
    optimizeDeps: {
      include: ['jspdf', 'jspdf-autotable']
    },
    envPrefix: 'VITE_',
    css: {
      // S'assurer que le CSS est correctement extrait
      devSourcemap: true,
    }
  };
});
