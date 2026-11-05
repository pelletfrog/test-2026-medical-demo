import { expect, test } from "@playwright/test"

import { admin, login, loginFromLoginPage } from "./auth"

test.describe("REQ-AUT-001 登入", () => {
  test("AUT-001 AC1 登入成功", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByLabel("帳號")).toBeFocused()

    await login(page)

    await expect(page).toHaveURL("/patients")
    await expect(page.getByRole("heading", { name: "病患列表" })).toBeVisible()
  })

  test("AUT-001 AC1 登入成功：在密碼欄按 Enter 送出", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("帳號").fill(admin.username)
    await page.getByLabel("密碼", { exact: true }).fill(admin.password)
    await page.getByLabel("密碼", { exact: true }).press("Enter")

    await expect(page).toHaveURL("/patients")
  })

  test("AUT-001 AC1 登入成功：在帳號欄按 Enter 送出", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("密碼", { exact: true }).fill(admin.password)
    await page.getByLabel("帳號").fill(admin.username)
    await page.getByLabel("帳號").press("Enter")

    await expect(page).toHaveURL("/patients")
  })

  test("AUT-001 AC1 登入成功：瀏覽器可以自動填入帳號密碼", async ({ page }) => {
    await page.goto("/login")

    await expect(page.getByLabel("帳號")).toHaveAttribute("autocomplete", "username")
    await expect(page.getByLabel("密碼", { exact: true })).toHaveAttribute("autocomplete", "current-password")
  })

  test("AUT-001 AC2 帳號或密碼錯誤", async ({ page }) => {
    await page.goto("/login")

    await login(page, admin.username, `${admin.password}-wrong`)

    // Next.js 每頁都有一個空的 role="alert"（換頁時給螢幕閱讀器播報），所以用文字找
    await expect(page.getByRole("alert").filter({ hasText: "帳號或密碼錯誤" })).toBeVisible()
    await expect(page).toHaveURL("/login")
    // 清空密碼、保留帳號，焦點移到密碼欄
    await expect(page.getByLabel("帳號")).toHaveValue(admin.username)
    await expect(page.getByLabel("密碼", { exact: true })).toHaveValue("")
    await expect(page.getByLabel("密碼", { exact: true })).toBeFocused()
  })

  test("AUT-001 AC2 帳號或密碼錯誤：帳號不存在時顯示相同訊息", async ({ page }) => {
    await page.goto("/login")

    await login(page, "no-such-user", admin.password)

    await expect(page.getByRole("alert").filter({ hasText: "帳號或密碼錯誤" })).toBeVisible()
    await expect(page).toHaveURL("/login")
  })

  test("AUT-001 AC3 欄位空白", async ({ page }) => {
    const loginRequests: string[] = []
    page.on("request", (req) => {
      if (req.url().includes("/api/auth/login")) loginRequests.push(req.url())
    })
    await page.goto("/login")

    await page.getByRole("button", { name: "登入" }).click()

    await expect(page.getByText("請輸入帳號")).toBeVisible()
    await expect(page.getByText("請輸入密碼")).toBeVisible()

    // 只填空白也算沒填
    await page.getByLabel("帳號").fill("   ")
    await page.getByLabel("密碼", { exact: true }).fill("   ")
    await page.getByRole("button", { name: "登入" }).click()

    await expect(page.getByText("請輸入帳號")).toBeVisible()
    await expect(page.getByText("請輸入密碼")).toBeVisible()
    expect(loginRequests).toEqual([])
  })

  test("AUT-001 AC4 超過字數", async ({ page }) => {
    await page.goto("/login")

    // 用逐字輸入模擬使用者打字，輸入框的字數上限才會生效
    await page.getByLabel("帳號").pressSequentially("a".repeat(51))
    await page.getByLabel("密碼", { exact: true }).pressSequentially("b".repeat(65))

    await expect(page.getByLabel("帳號")).toHaveValue("a".repeat(50))
    await expect(page.getByLabel("密碼", { exact: true })).toHaveValue("b".repeat(64))
  })
})

test.describe("REQ-AUT-003 未登入時導向登入頁", () => {
  test("AUT-003 AC2 未登入開啟頁面", async ({ page }) => {
    await page.goto("/patients")

    await expect(page).toHaveURL("/login?redirect=%2Fpatients")
  })

  test("AUT-003 AC4 登入後回到原頁面", async ({ page }) => {
    await page.goto("/design-system")
    await expect(page).toHaveURL("/login?redirect=%2Fdesign-system")

    await login(page)

    await expect(page).toHaveURL("/design-system")
  })

  test("AUT-003 AC4 登入後回到原頁面：不是站內網址時進入病患列表", async ({ page }) => {
    await page.goto(`/login?redirect=${encodeURIComponent("https://evil.example.com")}`)

    await login(page)

    await expect(page).toHaveURL("/patients")
  })
})

test.describe("REQ-AUT-004 登出", () => {
  test("AUT-004 AC1 登出", async ({ page }) => {
    await loginFromLoginPage(page)

    await page.getByRole("button", { name: "登出" }).click()

    await expect(page).toHaveURL("/login")
    const me = await page.request.get("/api/auth/me")
    expect(me.status()).toBe(401)
  })
})

test.describe("REQ-AUT-005 目前登入者", () => {
  test("AUT-005 AC1 顯示姓名", async ({ page }) => {
    await loginFromLoginPage(page)
    const sidebar = page.locator("[data-slot=sidebar]")

    await expect(sidebar.getByText(admin.name)).toBeVisible()

    await page.goto("/design-system")
    await expect(sidebar.getByText(admin.name)).toBeVisible()
  })

  test("AUT-005 AC2 已登入開啟登入頁", async ({ page }) => {
    await loginFromLoginPage(page)

    await page.goto("/login")

    await expect(page).toHaveURL("/patients")
  })
})
