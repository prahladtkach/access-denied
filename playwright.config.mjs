import { defineConfig } from '@playwright/test';

const hosted = process.env.ACCESS_DENIED_BASE_URL;

export default defineConfig({
  testDir: './tests/browser',
  globalSetup: hosted ? undefined : './tests/browser-server.mjs',
  workers: 1,
  use: {
    channel: process.env.ACCESS_DENIED_BROWSER || 'msedge',
    baseURL: hosted || 'http://127.0.0.1:4178/access-denied/',
    viewport: { width: 1280, height: 800 },
  },
});

