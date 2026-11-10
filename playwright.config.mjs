import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  globalSetup: './tests/browser-server.mjs',
  workers: 1,
  use: {
    channel: process.env.ACCESS_DENIED_BROWSER || 'msedge',
    baseURL: 'http://127.0.0.1:4178',
    viewport: { width: 1280, height: 800 },
  },
});

