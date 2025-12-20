// vite.config.js - Configuration Vite
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Configuration des alias
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@data': path.resolve(__dirname, './src/data')
    }
  },
  
  // Configuration du serveur de développement
  server: {
    port: 3000,
    open: true, // Ouvre automatiquement le navigateur
    host: true, // Permet l'accès depuis d'autres appareils sur le réseau
  },
  
  // Configuration de build
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimisations pour la performance
    rollupOptions: {
      input: './index.html',
      output: {
        manualChunks: {
          // Séparer les dépendances vendor
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react']
        }
      }
    }
  },
  
  // Configuration PWA (optionnelle)
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react']
  },
  
  // Variables d'environnement
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
