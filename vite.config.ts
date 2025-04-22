
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
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Disable sourcemap in production for better performance
    sourcemap: mode === 'development',
    minify: true,
    // Optimize chunks for production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      }
    },
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

