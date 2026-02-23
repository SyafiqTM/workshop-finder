import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'Workshop Finder',
        short_name: 'Workshops',
        description: 'Find nearby workshops, save favorites, and leave reviews.',
        theme_color: '#111827',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        icons: []
      }
    })
  ]
});
