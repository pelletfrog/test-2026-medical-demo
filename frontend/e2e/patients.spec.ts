import { expect, test, type Page } from "@playwright/test"

import { loginFromLoginPage } from "./auth"

// E2E 用本機的資料庫，不清空資料：每個測試用自己的病歷號前綴，搜尋前綴就只看到自己建的病患
// 依序執行：「新的在最上面」的測試，不能被同時新增的病患擠下去
test.describe.configure({ mode: "serial" })

function uniquePrefix() {
  // 「E2E」+ 時間 + 亂數，大寫英數字；後面再接 2 碼流水號，總長不超過病歷號的 20 個字
  const time = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 4).toUpperCase()
  return `E2E${time}${random}`
}

async function createPatients(page: Page, prefix: string, count: number) {
  // 準備資料直接呼叫 API：和瀏覽器共用登入的 cookie
  for (let i = 1; i <= count; i++) {
    const res = await page.request.post("/api/patients", {
      data: { medicalRecordNo: `${prefix}${String(i).padStart(2, "0")}`, name: "測試" },
    })
    expect(res.status()).toBe(201)
  }
}

function rows(page: Page) {
  return page.getByRole("table").getByRole("row").filter({ hasNot: page.getByRole("columnheader") })
}

// 用 role 找，不用 getByLabel：重新整理後 Next.js 會暫時留一份隱藏的伺服器版畫面，getByLabel 連隱藏的也會找到
function searchInput(page: Page) {
  return page.getByRole("textbox", { name: "搜尋病歷號" })
}

async function search(page: Page, keyword: string) {
  await searchInput(page).fill(keyword)
  await searchInput(page).press("Enter")
}

test.beforeEach(async ({ page }) => {
  await loginFromLoginPage(page)
})

test.describe("REQ-PAT-001 病患列表", () => {
  test("PAT-001 AC1 列出病患", async ({ page }) => {
    const prefix = uniquePrefix()
    await page.request.post("/api/patients", { data: { medicalRecordNo: `${prefix}01`, name: "陳測試" } })
    await page.request.post("/api/patients", { data: { medicalRecordNo: `${prefix}02`, name: "林範例" } })

    await page.goto("/patients")

    await expect(rows(page).nth(0)).toHaveText(new RegExp(`${prefix}02.*林範例`))
    await expect(rows(page).nth(1)).toHaveText(new RegExp(`${prefix}01.*陳測試`))
  })

  test("PAT-001 AC2 分頁", async ({ page }) => {
    const prefix = uniquePrefix()
    await createPatients(page, prefix, 21)

    await page.goto(`/patients?q=${prefix}`)

    await expect(rows(page)).toHaveCount(20)
    await expect(page.getByText("共 21 筆")).toBeVisible()
    await page.getByRole("button", { name: "下一頁" }).click()
    await expect(page).toHaveURL(`/patients?q=${prefix}&page=2`)
    await expect(rows(page)).toHaveCount(1)
    await expect(rows(page).first()).toContainText(`${prefix}01`)
  })

  test("PAT-001 AC3 頁碼超過最後一頁", async ({ page }) => {
    const prefix = uniquePrefix()
    await createPatients(page, prefix, 21)

    await page.goto(`/patients?q=${prefix}&page=5`)

    await expect(page).toHaveURL(`/patients?q=${prefix}&page=2`)
    await expect(rows(page)).toHaveCount(1)
  })

  test("PAT-001 AC4 沒有病患", async ({ page }) => {
    // 共用的資料庫不會是空的，只有這條用攔截模擬，見 conventions §3.1
    await page.route("**/api/patients**", (route) =>
      route.fulfill({ json: { content: [], page: 1, size: 20, totalElements: 0, totalPages: 0 } })
    )

    await page.goto("/patients")

    await expect(page.getByText("目前沒有病患")).toBeVisible()
  })
})

test.describe("REQ-PAT-002 搜尋病歷號", () => {
  test("PAT-002 AC1 部分符合", async ({ page }) => {
    const prefix = uniquePrefix()
    for (const no of ["A01", "A02", "B01"]) {
      await page.request.post("/api/patients", { data: { medicalRecordNo: `${prefix}${no}`, name: "測試" } })
    }
    await page.goto("/patients")

    // 輸入小寫也找得到
    await search(page, `${prefix}a0`.toLowerCase())

    await expect(rows(page)).toHaveCount(2)
    await expect(rows(page).nth(0)).toContainText(`${prefix}A02`)
    await expect(rows(page).nth(1)).toContainText(`${prefix}A01`)
  })

  test("PAT-002 AC2 搜尋後回到第 1 頁", async ({ page }) => {
    const prefix = uniquePrefix()
    await createPatients(page, prefix, 21)
    // 剛建了 21 筆，不搜尋時一定有第 2 頁
    await page.goto("/patients?page=2")

    await search(page, prefix)

    await expect(page).toHaveURL(`/patients?q=${prefix}`)
    await expect(rows(page).first()).toContainText(`${prefix}21`)
  })

  test("PAT-002 AC3 保留搜尋條件", async ({ page }) => {
    const prefix = uniquePrefix()
    await createPatients(page, prefix, 21)
    await page.goto("/patients")
    await search(page, prefix)
    // 等搜尋結果出來再換頁：太快按的話，按到的是搜尋前那份列表的「下一頁」
    await expect(page.getByText("共 21 筆")).toBeVisible()
    await page.getByRole("button", { name: "下一頁" }).click()
    await expect(rows(page)).toHaveCount(1)

    await page.reload()

    await expect(page).toHaveURL(`/patients?q=${prefix}&page=2`)
    await expect(searchInput(page)).toHaveValue(prefix)
    await expect(rows(page)).toHaveCount(1)
    await expect(rows(page).first()).toContainText(`${prefix}01`)
  })

  test("PAT-002 AC4 清除搜尋", async ({ page }) => {
    const prefix = uniquePrefix()
    await createPatients(page, prefix, 1)
    await page.goto(`/patients?q=${prefix}&page=1`)

    await page.getByRole("button", { name: "清除" }).click()

    await expect(page).toHaveURL("/patients")
    await expect(searchInput(page)).toHaveValue("")
    // 清除前只有 1 筆；列出所有病患後一定更多（這個測試前面已經建了其他病患）
    await expect
      .poll(async () => Number((await page.getByText(/^共 \d+ 筆$/).textContent())?.match(/\d+/)?.[0] ?? 0))
      .toBeGreaterThan(1)
    await expect(rows(page)).toHaveCount(20)
  })

  test("PAT-002 AC5 找不到", async ({ page }) => {
    await page.goto("/patients")

    await search(page, `${uniquePrefix()}NONE`)

    await expect(page.getByText("找不到符合的病患")).toBeVisible()
    await expect(rows(page)).toHaveCount(0)
  })
})

test.describe("REQ-PAT-003 新增病患", () => {
  async function openDialog(page: Page) {
    await page.getByRole("button", { name: "新增病患" }).click()
    const dialog = page.getByRole("dialog", { name: "新增病患" })
    await expect(dialog.getByLabel("病歷號")).toBeFocused()
    return dialog
  }

  test("PAT-003 AC1 新增成功", async ({ page }) => {
    const prefix = uniquePrefix()
    await createPatients(page, prefix, 1)
    await page.goto(`/patients?q=${prefix}`)

    const dialog = await openDialog(page)
    await dialog.getByLabel("病歷號").fill(`${prefix}99`)
    await dialog.getByLabel("姓名").fill("陳測試")
    await dialog.getByRole("button", { name: "新增" }).click()

    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL("/patients")
    await expect(searchInput(page)).toHaveValue("")
    await expect(rows(page).first()).toHaveText(new RegExp(`${prefix}99.*陳測試`))
  })

  test("PAT-003 AC1 新增成功：沒有搜尋、在第 1 頁時，列表也會更新", async ({ page }) => {
    const prefix = uniquePrefix()
    // 網址不會變，列表要自己重新查詢才看得到新病患
    await page.goto("/patients")
    await expect(rows(page)).toHaveCount(20)

    const dialog = await openDialog(page)
    await dialog.getByLabel("病歷號").fill(`${prefix}01`)
    await dialog.getByLabel("姓名").fill("林範例")
    await dialog.getByRole("button", { name: "新增" }).click()

    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL("/patients")
    await expect(rows(page).first()).toHaveText(new RegExp(`${prefix}01.*林範例`))
  })

  test("PAT-003 AC1 新增成功：在其他頁時回到第 1 頁", async ({ page }) => {
    const prefix = uniquePrefix()
    await page.goto("/patients?page=2")
    await expect(rows(page)).toHaveCount(20)

    const dialog = await openDialog(page)
    await dialog.getByLabel("病歷號").fill(`${prefix}01`)
    await dialog.getByLabel("姓名").fill("黃虛構")
    await dialog.getByRole("button", { name: "新增" }).click()

    await expect(page).toHaveURL("/patients")
    await expect(rows(page).first()).toHaveText(new RegExp(`${prefix}01.*黃虛構`))
  })

  test("PAT-003 AC1 新增成功：取消時不新增，再次開啟時欄位是空的", async ({ page }) => {
    const posts: string[] = []
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("/api/patients")) posts.push(req.url())
    })
    await page.goto("/patients")
    let dialog = await openDialog(page)
    await dialog.getByLabel("病歷號").fill("CANCELLED")
    await dialog.getByLabel("姓名").fill("陳測試")
    await dialog.getByRole("button", { name: "取消" }).click()
    await expect(dialog).toBeHidden()
    expect(posts).toEqual([])

    dialog = await openDialog(page)
    await expect(dialog.getByLabel("病歷號")).toHaveValue("")
  })

  test("PAT-003 AC3 欄位空白", async ({ page }) => {
    const posts: string[] = []
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("/api/patients")) posts.push(req.url())
    })
    await page.goto("/patients")
    const dialog = await openDialog(page)

    await dialog.getByRole("button", { name: "新增" }).click()
    await expect(dialog.getByText("請輸入病歷號")).toBeVisible()
    await expect(dialog.getByText("請輸入姓名")).toBeVisible()

    // 只填空白也算沒填
    await dialog.getByLabel("病歷號").fill("   ")
    await dialog.getByLabel("姓名").fill("   ")
    await dialog.getByRole("button", { name: "新增" }).click()
    await expect(dialog.getByText("請輸入病歷號")).toBeVisible()
    await expect(dialog.getByText("請輸入姓名")).toBeVisible()
    expect(posts).toEqual([])
  })

  test("PAT-003 AC4 超過字數", async ({ page }) => {
    await page.goto("/patients")
    const dialog = await openDialog(page)

    // 逐字輸入，輸入框的字數上限才會生效
    await dialog.getByLabel("病歷號").pressSequentially("A".repeat(21))
    await dialog.getByLabel("姓名").pressSequentially("陳".repeat(51))

    await expect(dialog.getByLabel("病歷號")).toHaveValue("A".repeat(20))
    await expect(dialog.getByLabel("姓名")).toHaveValue("陳".repeat(50))
  })

  test("PAT-003 AC5 病歷號格式", async ({ page }) => {
    const posts: string[] = []
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("/api/patients")) posts.push(req.url())
    })
    await page.goto("/patients")
    const dialog = await openDialog(page)

    await dialog.getByLabel("病歷號").fill("A-001")
    await dialog.getByLabel("姓名").fill("陳測試")
    await dialog.getByRole("button", { name: "新增" }).click()

    await expect(dialog.getByText("病歷號只能是英文字母與數字")).toBeVisible()
    expect(posts).toEqual([])
  })

  test("PAT-003 AC6 病歷號已存在", async ({ page }) => {
    const prefix = uniquePrefix()
    await createPatients(page, prefix, 1)
    await page.goto("/patients")
    const dialog = await openDialog(page)

    // 大小寫不同也算同一個病歷號
    await dialog.getByLabel("病歷號").fill(`${prefix}01`.toLowerCase())
    await dialog.getByLabel("姓名").fill("林範例")
    await dialog.getByRole("button", { name: "新增" }).click()

    await expect(dialog.getByText("病歷號已存在")).toBeVisible()
    await expect(dialog.getByRole("alert").filter({ hasText: "請修正標示的欄位" })).toBeVisible()
    await expect(dialog).toBeVisible()
  })
})
