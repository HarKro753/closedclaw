import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./e2e",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3901",
    headless: true,
    screenshot: "only-on-failure",
  },
};

export default config;
