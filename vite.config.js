import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    env: {
      VITE_POKEAPI_URL: 'https://pokeapi.test/api/v2/',
    },
  },
});