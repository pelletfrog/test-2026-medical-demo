import path from "node:path"

import { defineConfig, devices } from "@playwright/test"

// E2E 用的預設帳號和後端讀同一份 .env，不另外寫一份測試帳密；沒有這個檔時直接用環境變數
try {
  process.loadEnvFile(path.join(__dirname, "../.env"))
} catch {}

export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // 前後端已經在跑就直接用，沒跑才自動啟動
  webServer: [
    {
      command: "./mvnw spring-boot:run",
      cwd: "../backend",
      // 未登入呼叫 me 回 401，Playwright 視為已啟動
      url: "http://localhost:8080/api/auth/me",
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})
