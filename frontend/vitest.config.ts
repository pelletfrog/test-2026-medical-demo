import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    // 和 tsconfig.json 的 paths 一致，測試裡的 @/ 才找得到檔案
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["**/*.test.ts"],
    // e2e/ 是 Playwright 的測試，node_modules 裡也有套件自己的 *.test.ts
    exclude: ["node_modules/**", "e2e/**"],
  },
})
