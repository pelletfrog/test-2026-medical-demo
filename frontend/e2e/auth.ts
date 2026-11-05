import { expect, type Page } from "@playwright/test"

// 預設帳號和後端讀同一份 .env，見 playwright.config.ts
export const admin = {
  username: requireEnv("ADMIN_USERNAME"),
  password: requireEnv("ADMIN_PASSWORD"),
  name: requireEnv("ADMIN_NAME"),
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`沒有設定環境變數 ${name}，E2E 要用預設帳號登入`)
  return value
}

export async function login(page: Page, username = admin.username, password = admin.password) {
  await page.getByLabel("帳號").fill(username)
  await page.getByLabel("密碼", { exact: true }).fill(password)
  await page.getByRole("button", { name: "登入" }).click()
}

export async function loginFromLoginPage(page: Page) {
  await page.goto("/login")
  await login(page)
  await expect(page).toHaveURL("/patients")
}
