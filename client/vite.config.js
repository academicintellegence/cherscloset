import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves project sites from /<repo-name>/. Override with VITE_BASE if your repo is named differently.
export default defineConfig({
  base: process.env.VITE_BASE || '/digital-closet/',
  plugins: [react()],
  worker: { format: 'es' }, // the tagging worker uses ES module imports
});
