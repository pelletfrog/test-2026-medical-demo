import { describe, expect, test } from "vitest"

import { safeRedirect } from "@/lib/safe-redirect"

describe("AUT-003 AC4 登入後回到原頁面", () => {
  test("AUT-003 AC4 登入後回到原頁面：站內網址照原樣回去，包含查詢參數", () => {
    expect(safeRedirect("/patients")).toBe("/patients")
    expect(safeRedirect("/patients/3?tab=vitals")).toBe("/patients/3?tab=vitals")
  })

  test("AUT-003 AC4 登入後回到原頁面：沒有指定網址時進入病患列表", () => {
    expect(safeRedirect(null)).toBe("/patients")
    expect(safeRedirect("")).toBe("/patients")
  })

  test("AUT-003 AC4 登入後回到原頁面：不是站內網址時進入病患列表", () => {
    for (const url of [
      "https://evil.example.com",
      "//evil.example.com",
      "/\\evil.example.com",
      "\\\\evil.example.com",
      "javascript:alert(1)",
      "patients",
      " /patients",
      "/\t/evil.example.com",
    ]) {
      expect(safeRedirect(url), url).toBe("/patients")
    }
  })
})
