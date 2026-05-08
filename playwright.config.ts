import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'concurrently "vite --host 127.0.0.1 --port 5174 --strictPort" "node --import tsx server.ts"',
    url: 'http://localhost:5174',
    reuseExistingServer: false,
    env: {
      PORT: '3002',
      ALLOWED_ORIGIN: 'http://localhost:5174',
      VITE_API_URL: 'http://localhost:3002',
      TEST_DB: './tests/e2e/e2e-test-db.json'
    }
  },
});
