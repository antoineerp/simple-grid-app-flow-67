
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import fs from 'fs'

// Configuration Vite optimisée pour le déploiement sur Infomaniak
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    // Générer les fichiers dans le répertoire racine pour Infomaniak
    outDir: 'dist',
    emptyOutDir: true,
    // Conserver les chemins relatifs au lieu de chemins absolus pour les assets
    assetsDir: 'assets',
    // Améliorer la compatibilité avec les serveurs PHP
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/index.css';
          }
          return 'assets/[name][extname]';
        }
      },
    }
  },
  // Script de post-build pour copier les fichiers PHP dans le répertoire de sortie
  optimizeDeps: {
    exclude: []
  }
})
