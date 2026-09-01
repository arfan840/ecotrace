import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
        statements: 70,
        branches: 60,
        functions: 65,
        lines: 70
      }
    }
  }
});
