import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Le mode "demo" produit un fichier HTML unique, sans Supabase, pour l'aperçu.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'demo' ? [react(), viteSingleFile()] : [react()],
  build: { outDir: mode === 'demo' ? 'dist-demo' : 'dist', assetsInlineLimit: mode === 'demo' ? 100_000_000 : 4096 },
}));
