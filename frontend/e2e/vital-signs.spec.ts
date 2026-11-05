import { expect, test, type Page } from "@playwright/test"

import { loginFromLoginPage } from "./auth"

// 和病患的 E2E 相同：不清空資料庫，每個測試用自己的病歷號前綴，搜尋前綴就只看到自己的資料
// 依序執行：「新增的紀錄在最上面」不能被同時新增的紀錄擠下去
test.describe.configure({ mode: "serial" })

function uniquePrefix() {
  const time = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 4).toUpperCase()
  return `E2E${time}${random}`
}

// 姓名的搜尋也要能隔開：用不會出現在病歷號裡的中文字組出唯一的姓名
function uniqueName(prefix: string) {
  const digits = "零一二三四五六七八九"
  return "林" + [...prefix.slice(-6)].map((c) => digits[c.charCodeAt(0) % 10]).join("")
}

type Values = { measuredAt: string; heartRate?: number }

async function createPatient(page: Page, medicalRecordNo: string, name = "測試") {
  const res = await page.request.post("/api/patients", { data: { medicalRecordNo, name } })
  expect(res.status()).toBe(201)
  return (await res.json()).id as number
}

async function createRecord(page: Page, patientId: number, { measuredAt, heartRate = 78 }: Values) {
  const res = await page.request.post("/api/vital-signs", {
    data: {
      patientId,
      measuredAt,
      bodyTemperature: 36.8,
      heartRate,
      respiratoryRate: 16,
      systolicPressure: 122,
      diastolicPressure: 78,
      oxygenSaturation: 98,
    },
  })
  expect(res.status()).toBe(201)
}

function table(page: Page) {
  return page.getByRole("table", { name: "生命徵象紀錄" })
}

function rows(page: Page) {
  return table(page).getByRole("row").filter({ hasNot: page.getByRole("columnheader") })
}

// 用 role 找：重新整理後 Next.js 會暫時留一份隱藏的伺服器版畫面，getByLabel 連隱藏的也會找到
function searchInput(page: Page) {
  return page.getByRole("textbox", { name: "搜尋病歷號或姓名" })
}

async function search(page: Page, keyword: string) {
  await searchInput(page).fill(keyword)
  await searchInput(page).press("Enter")
}

async function openCreate(page: Page) {
  await page.getByRole("button", { name: "新增紀錄" }).click()
  return page.getByRole("dialog", { name: "新增紀錄" })
}

async function fillValues(dialog: ReturnType<Page["getByRole"]>, heartRate = "80") {
  await dialog.getByLabel("體溫").fill("36.5")
  await dialog.getByLabel("心跳").fill(heartRate)
  await dialog.getByLabel("呼吸").fill("18")
  await dialog.getByLabel("血氧").fill("97")
  await dialog.getByLabel("收縮壓").fill("120")
  await dialog.getByLabel("舒張壓").fill("80")
}

async function choosePatient(page: Page, dialog: ReturnType<Page["getByRole"]>, medicalRecordNo: string) {
  await dialog.getByRole("combobox", { name: "病患" }).fill(medicalRecordNo)
  await page.getByRole("option", { name: new RegExp(`^${medicalRecordNo}`) }).click()
}

function watchPosts(page: Page) {
  const posts: string[] = []
  page.on("request", (req) => {
    if (["POST", "PUT"].includes(req.method()) && req.url().includes("/api/vital-signs")) posts.push(req.url())
  })
  return posts
}

test.beforeEach(async ({ page }) => {
  await loginFromLoginPage(page)
})

test.describe("REQ-VIT-001 生命徵象列表", () => {
  test("VIT-001 AC1 列出紀錄", async ({ page }) => {
    const prefix = uniquePrefix()
    const id = await createPatient(page, `${prefix}01`, "陳測試")
    await createRecord(page, id, { measuredAt: "2026-01-01 08:00" })
    await createRecord(page, id, { measuredAt: "2026-01-01 12:00", heartRate: 95 })

    await page.goto("/vital-signs")
    await search(page, prefix)

    await expect(rows(page)).toHaveCount(2)
    await expect(rows(page).nth(0)).toHaveText(
      new RegExp(`${prefix}01.*陳測試.*2026-01-01 12:00.*36\\.8.*95.*16.*122/78.*98`)
    )
    await expect(rows(page).nth(1)).toContainText("2026-01-01 08:00")
  })

  test("VIT-001 AC2 分頁", async ({ page }) => {
    const prefix = uniquePrefix()
    const id = await createPatient(page, `${prefix}01`)
    for (let minute = 0; minute <= 20; minute++) {
      await createRecord(page, id, { measuredAt: `2026-01-01 08:${String(minute).padStart(2, "0")}` })
    }

    await page.goto(`/vital-signs?q=${prefix}`)

    await expect(rows(page)).toHaveCount(20)
    await expect(page.getByText("共 21 筆")).toBeVisible()
    await page.getByRole("button", { name: "下一頁" }).click()
    await expect(page).toHaveURL(`/vital-signs?q=${prefix}&page=2`)
    await expect(rows(page)).toHaveCount(1)
    await expect(rows(page).first()).toContainText("2026-01-01 08:00")
  })

  test("VIT-001 AC3 沒有紀錄", async ({ page }) => {
    // 共用的資料庫不會是空的，只有這條用攔截模擬，見 conventions §3.1
    await page.route("**/api/vital-signs?**", (route) =>
      route.fulfill({ json: { content: [], page: 1, size: 20, totalElements: 0, totalPages: 0 } })
    )

    await page.goto("/vital-signs")

    // 寬螢幕的表格和手機的卡片各有一份，只看顯示出來的那份
    await expect(page.getByText("目前沒有紀錄").filter({ visible: true })).toBeVisible()
  })
})

test.describe("REQ-VIT-002 搜尋紀錄", () => {
  test("VIT-002 AC1 病歷號或姓名部分符合", async ({ page }) => {
    const prefix = uniquePrefix()
    const name = uniqueName(prefix)
    const a = await createPatient(page, `${prefix}A01`, "陳測試")
    const b = await createPatient(page, `${prefix}B02`, name)
    await createRecord(page, a, { measuredAt: "2026-01-01 08:00" })
    await createRecord(page, b, { measuredAt: "2026-01-01 09:00" })
    await page.goto("/vital-signs")

    // 病歷號不分大小寫
    await search(page, `${prefix}a`.toLowerCase())
    await expect(rows(page)).toHaveCount(1)
    await expect(rows(page).first()).toContainText(`${prefix}A01`)

    await search(page, name)
    await expect(rows(page)).toHaveCount(1)
    await expect(rows(page).first()).toContainText(`${prefix}B02`)
  })

  test("VIT-002 AC2 找不到", async ({ page }) => {
    await page.goto("/vital-signs")

    await search(page, `${uniquePrefix()}NONE`)

    // 寬螢幕的表格和手機的卡片各有一份，只看顯示出來的那份
    await expect(page.getByText("找不到符合的紀錄").filter({ visible: true })).toBeVisible()
    await expect(rows(page)).toHaveCount(0)
  })
})

test.describe("REQ-VIT-003 新增紀錄", () => {
  test("VIT-003 AC1 新增成功", async ({ page }) => {
    const prefix = uniquePrefix()
    await createPatient(page, `${prefix}01`, "陳測試")
    await page.goto(`/vital-signs?q=${prefix}NONE`)

    const dialog = await openCreate(page)
    await choosePatient(page, dialog, `${prefix}01`)
    await fillValues(dialog, "88")
    await dialog.getByRole("button", { name: "儲存" }).click()

    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL("/vital-signs")
    await expect(searchInput(page)).toHaveValue("")
    await expect(rows(page).first()).toHaveText(new RegExp(`${prefix}01.*陳測試.*36\\.5.*88`))
  })

  test("VIT-003 AC2 記錄時間預設為現在", async ({ page }) => {
    await page.goto("/vital-signs")
    // 開啟前後各取一次台灣時間，跨分鐘時兩個都算對
    const now = () =>
      new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23",
      }).format(new Date()).replace(" ", "T")
    const before = now()

    const dialog = await openCreate(page)

    const value = await dialog.getByLabel("記錄時間").inputValue()
    expect([before, now()]).toContain(value)
  })

  test("VIT-003 AC3 選擇病患", async ({ page }) => {
    const prefix = uniquePrefix()
    for (let i = 21; i >= 1; i--) {
      await createPatient(page, `${prefix}${String(i).padStart(2, "0")}`, `病患${i}`)
    }
    await page.goto("/vital-signs")
    const dialog = await openCreate(page)
    const combobox = dialog.getByRole("combobox", { name: "病患" })

    // 超過 20 位：依病歷號由小到大列出 20 位，並提示輸入更多字
    await combobox.fill(prefix.toLowerCase())
    await expect(page.getByText("符合的病患超過 20 位，請輸入更多字")).toBeVisible()
    await expect(page.getByRole("option")).toHaveCount(20)
    await expect(page.getByRole("option").first()).toHaveText(`${prefix}01　病患1`)

    await combobox.fill(`${prefix}05`)
    await expect(page.getByRole("option")).toHaveCount(1)
    await expect(page.getByText("符合的病患超過 20 位，請輸入更多字")).toBeHidden()
    await page.getByRole("option").click()

    await expect(combobox).toHaveValue(`${prefix}05　病患5`)

    // 選好之後再打開選單，仍然有選項可以換
    // 先等過查詢的延遲（0.3 秒）與回應：有問題的版本會在這段時間拿「病歷號　姓名」去查，把選項清空
    await page.waitForTimeout(1000)
    await combobox.click()
    await page.keyboard.press("ArrowDown")
    await expect(page.getByRole("option").first()).toBeVisible()
  })

  test("VIT-003 AC4 欄位空白", async ({ page }) => {
    const posts = watchPosts(page)
    await page.goto("/vital-signs")
    const dialog = await openCreate(page)
    await dialog.getByLabel("記錄時間").fill("")

    await dialog.getByRole("button", { name: "儲存" }).click()

    for (const message of ["請選擇病患", "請輸入記錄時間", "請輸入體溫", "請輸入心跳", "請輸入呼吸",
      "請輸入血氧", "請輸入收縮壓", "請輸入舒張壓"]) {
      await expect(dialog.getByText(message)).toBeVisible()
    }
    expect(posts).toEqual([])
  })

  test("VIT-003 AC4 欄位空白：病患不存在", async ({ page }) => {
    // 只有不經畫面直接呼叫 API 才會發生，用攔截模擬後端的回應，見 conventions §3.1
    const prefix = uniquePrefix()
    await createPatient(page, `${prefix}01`)
    await page.route("**/api/vital-signs", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 400,
            json: { status: 400, detail: "請修正標示的欄位", errors: { patientId: "找不到這位病患" } },
          })
        : route.continue()
    )
    await page.goto("/vital-signs")
    const dialog = await openCreate(page)
    await choosePatient(page, dialog, `${prefix}01`)
    await fillValues(dialog)

    await dialog.getByRole("button", { name: "儲存" }).click()

    // 訊息要出現在病患欄位下方，上方的「請修正標示的欄位」才找得到被標示的欄位
    await expect(dialog.getByRole("group").filter({ hasText: "病患" }).getByText("找不到這位病患")).toBeVisible()
  })

  test("VIT-003 AC5 數值格式", async ({ page }) => {
    const posts = watchPosts(page)
    await page.goto("/vital-signs")
    const dialog = await openCreate(page)

    await dialog.getByLabel("體溫").fill("36.85")
    await dialog.getByLabel("心跳").fill("78.5")
    await dialog.getByLabel("呼吸").fill("-1")
    await dialog.getByLabel("血氧").fill("1000")
    await dialog.getByRole("button", { name: "儲存" }).click()

    await expect(dialog.getByText("體溫最多 1 位小數")).toBeVisible()
    await expect(dialog.getByText("心跳只能是整數")).toBeVisible()
    await expect(dialog.getByText("呼吸需介於 0～999")).toBeVisible()
    await expect(dialog.getByText("血氧需介於 0～999")).toBeVisible()

    await dialog.getByLabel("體溫").fill("-0.5")
    await expect(dialog.getByText("體溫需介於 0～999.9")).toBeVisible()

    await dialog.getByLabel("體溫").fill("abc")
    await expect(dialog.getByText("體溫只能是數字")).toBeVisible()
    await dialog.getByLabel("心跳").fill("36.")
    await expect(dialog.getByText("心跳只能是數字")).toBeVisible()
    expect(posts).toEqual([])
  })

  test("VIT-003 AC6 記錄時間不能是未來", async ({ page }) => {
    const posts = watchPosts(page)
    await page.goto("/vital-signs")
    const dialog = await openCreate(page)

    await dialog.getByLabel("記錄時間").fill(`${new Date().getFullYear() + 1}-01-01T08:00`)
    await dialog.getByRole("button", { name: "儲存" }).click()

    await expect(dialog.getByText("記錄時間不能晚於現在")).toBeVisible()
    expect(posts).toEqual([])
  })

  test("VIT-003 AC7 同一時間已有紀錄", async ({ page }) => {
    const prefix = uniquePrefix()
    const id = await createPatient(page, `${prefix}01`)
    await createRecord(page, id, { measuredAt: "2026-01-01 08:00" })
    await page.goto("/vital-signs")

    const dialog = await openCreate(page)
    await choosePatient(page, dialog, `${prefix}01`)
    await dialog.getByLabel("記錄時間").fill("2026-01-01T08:00")
    await fillValues(dialog)
    await dialog.getByRole("button", { name: "儲存" }).click()

    await expect(dialog.getByText("這個時間已經有紀錄")).toBeVisible()
    await expect(dialog.getByRole("alert").filter({ hasText: "請修正標示的欄位" })).toBeVisible()
    await expect(dialog).toBeVisible()
  })
})

test.describe("REQ-VIT-004 編輯紀錄", () => {
  test("VIT-004 AC1 編輯成功", async ({ page }) => {
    const prefix = uniquePrefix()
    const id = await createPatient(page, `${prefix}01`)
    for (let minute = 0; minute <= 20; minute++) {
      await createRecord(page, id, { measuredAt: `2026-01-01 08:${String(minute).padStart(2, "0")}` })
    }
    await page.goto(`/vital-signs?q=${prefix}&page=2`)
    await expect(rows(page)).toHaveCount(1)

    await rows(page).first().getByRole("button", { name: /編輯/ }).click()
    const dialog = page.getByRole("dialog", { name: "編輯紀錄" })
    await expect(dialog.getByLabel("心跳")).toHaveValue("78")
    await dialog.getByLabel("心跳").fill("120")
    await dialog.getByRole("button", { name: "儲存" }).click()

    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(`/vital-signs?q=${prefix}&page=2`)
    await expect(rows(page).first()).toHaveText(/2026-01-01 08:00.*120/)
  })

  test("VIT-004 AC2 不能更換病患", async ({ page }) => {
    const prefix = uniquePrefix()
    const id = await createPatient(page, `${prefix}01`, "陳測試")
    await createRecord(page, id, { measuredAt: "2026-01-01 08:00" })
    await page.goto(`/vital-signs?q=${prefix}`)

    await rows(page).first().getByRole("button", { name: /編輯/ }).click()
    const dialog = page.getByRole("dialog", { name: "編輯紀錄" })

    // 唯讀的輸入框：看得到、螢幕閱讀器念得出是哪位病患，但不能修改
    await expect(dialog.getByLabel("病患")).toHaveValue(`${prefix}01　陳測試`)
    await expect(dialog.getByLabel("病患")).toHaveAttribute("readonly", "")
    await expect(dialog.getByRole("combobox")).toHaveCount(0)
  })

  test("VIT-004 AC4 改成已有紀錄的時間", async ({ page }) => {
    const prefix = uniquePrefix()
    const id = await createPatient(page, `${prefix}01`)
    await createRecord(page, id, { measuredAt: "2026-01-01 08:00" })
    await createRecord(page, id, { measuredAt: "2026-01-01 12:00" })
    await page.goto(`/vital-signs?q=${prefix}`)

    await rows(page).filter({ hasText: "12:00" }).getByRole("button", { name: /編輯/ }).click()
    const dialog = page.getByRole("dialog", { name: "編輯紀錄" })
    await dialog.getByLabel("記錄時間").fill("2026-01-01T08:00")
    await dialog.getByRole("button", { name: "儲存" }).click()

    await expect(dialog.getByText("這個時間已經有紀錄")).toBeVisible()
    await expect(dialog).toBeVisible()
  })
})
