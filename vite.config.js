import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    port: 5173,
    host: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/api/bags.js',
        'src/lib/bagId.js',
        'src/lib/bluetoothScale.js',
        'src/lib/certificate.js',
        'src/lib/errors.js',
        'src/lib/qrGenerator.js',
        'src/lib/auth/permissions.js',
        'src/lib/validation/schemas.js'
      ],
      thresholds: {
        statements: 40
      }
    }
  }
});
