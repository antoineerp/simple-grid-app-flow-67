
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { randomBytes } from "crypto";

// Polyfill for crypto.getRandomValues
if (!globalThis.crypto) {
  // Add crypto polyfill for Node environment
  globalThis.crypto = {
    getRandomValues: function(array) {
      if (!array || !array.length) {
        return array;
      }
      
      // Generate random bytes
      const bytes = randomBytes(array.length);
      
      // Copy bytes one by one to avoid type issues
      for (let i = 0; i < array.length; i++) {
        array[i] = bytes[i];
      }
      
      return array;
    }
  };
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
});
