import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 40000,
  workers: 1,
  webServer: {
    command: 'npm run dev -- --port 5180 --strictPort',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: true,
  },
  use: {
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 810 },
  },
})
