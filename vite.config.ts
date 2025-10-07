import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    host: true,
  },
  build: {
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@react-three/fiber', '@react-three/drei', 'three'],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
});

