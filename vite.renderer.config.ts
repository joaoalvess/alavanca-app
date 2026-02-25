import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  plugins: [
    {
      name: 'dynamic-react',
      async config() {
        const react = await import('@vitejs/plugin-react');
        return {
          plugins: [react.default()],
        };
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
    },
  },
});
