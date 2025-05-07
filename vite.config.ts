
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Only import the componentTagger in development, and only if Node.js version is compatible
const getDevPlugins = (mode) => {
  const plugins = [];
  
  // Only use componentTagger in development mode
  if (mode === 'development') {
    try {
      // Dynamically import to avoid import errors in production or with older Node.js
      const { componentTagger } = require("lovable-tagger");
      plugins.push(componentTagger());
    } catch (error) {
      console.warn("WARNING: componentTagger plugin could not be loaded. This is expected in production or with Node.js < 18.");
    }
  }
  
  return plugins;
};

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
      ...(getDevPlugins(mode)),
    ],
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
      }
    },
    publicDir: 'public',
    base: basePath,
  };
});
