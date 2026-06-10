import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` emits relative asset paths so the static build drops cleanly into
// any IONOS Webhosting subdirectory without rewriting URLs.
export default defineConfig({
  plugins: [react()],
  base: './',
});
