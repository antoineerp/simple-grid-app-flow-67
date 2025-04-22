
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    // Only apply development settings when not in production
    ...(mode === 'development' ? {
      host: "::",
      port: 8080,
      strictPort: true,
      hmr: {
        clientPort: 443,
        webSocketServer: 'ws'
      }
    } : {}),
  },
  plugins: [
    react(),
    // Only use componentTagger in development
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom']
  },
  define: {
    '__WS_TOKEN__': mode === 'production' ? false : JSON.stringify('lovable-ws-token'),
    '__APP_MODE__': JSON.stringify(mode)
  },
  css: {
    // Ensure CSS is extracted and properly processed
    devSourcemap: true,
    modules: {
      scopeBehaviour: 'local',
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Disable sourcemap in production for better performance
    sourcemap: mode === 'development',
    minify: true,
    // Optimize chunks for production without hashing
    rollupOptions: {
      output: {
        // Désactiver complètement le hachage des fichiers
        entryFileNames: 'assets/index.js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name].[ext]';
          
          const ext = assetInfo.name.split('.').at(-1);
          if (ext === 'css') {
            return 'assets/index.css';
          }
          return 'assets/[name].[ext]';
        },
        chunkFileNames: 'assets/[name].js',
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      }
    },
    // Explicitly ensure CSS extraction
    cssCodeSplit: false,
    // Ensure compatibility with older browsers
    target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari13']
  },
  // Disable certain warnings in production
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Drop console.log in production
    drop: mode === 'production' ? ['console'] : []
  }
}));
