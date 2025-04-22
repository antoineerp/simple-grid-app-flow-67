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
    devSourcemap: true,
    modules: {
      scopeBehaviour: 'local',
      localsConvention: 'camelCase',
      generateScopedName: '[local]_[hash:base64:5]'
    },
    preprocessorOptions: {
      postcss: {
        plugins: [
          'tailwindcss',
          'autoprefixer'
        ]
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: mode === 'development',
    minify: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name].[ext]';
          const ext = assetInfo.name.split('.').at(-1);
          if (ext === 'css') {
            return 'assets/[name].css';
          }
          return 'assets/[name].[ext]';
        },
        chunkFileNames: 'assets/[name].js',
      }
    },
    cssCodeSplit: false,
    target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari13']
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Drop console.log in production
    drop: mode === 'production' ? ['console'] : []
  }
}));
