import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** Some static hosts use 404.html as SPA shell for unknown paths. */
function spaFallbackHtml(): Plugin {
  return {
    name: 'spa-fallback-html',
    closeBundle() {
      const index = resolve(__dirname, 'dist/index.html');
      const dest = resolve(__dirname, 'dist/404.html');
      if (existsSync(index)) copyFileSync(index, dest);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_PROXY || 'http://localhost:3000';
  return {
    plugins: [react(), spaFallbackHtml()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target, changeOrigin: true },
        '/uploads': { target, changeOrigin: true },
      },
    },
  };
});
