# 開發規範

> 狀態：草稿

## 1. 後端

### 1.1 套件結構

- 依功能分包（package by feature）
- 程式都放在 `@SpringBootApplication` 所在的 package 底下，否則 Spring 掃描不到

```
io.github.pelletfrog.vitals
├── patient/
│   ├── PatientController.java   ← 只處理 HTTP 進出
│   ├── PatientService.java      ← 商業邏輯、@Transactional
│   ├── PatientRepository.java   ← extends JpaRepository
│   ├── Patient.java             ← @Entity
│   └── dto/
│       ├── PatientRequest.java  ← record + 驗證註解
│       └── PatientResponse.java ← record
├── vitalsign/
├── auth/                        ← 登入、JWT
├── common/
│   ├── GlobalExceptionHandler.java
│   └── NotFoundException.java
└── config/
    └── SecurityConfig.java
```

### 1.2 分層

- Controller 只呼叫 Service，不直接用 Repository
- 用建構子注入，不在欄位上加 `@Autowired`
- 先不用 Lombok，讓程式碼看得見

### 1.3 DTO 與驗證

- Entity 不直接回傳給前端，一律轉成 DTO；DTO 用 `record`
- 驗證寫在 Request DTO（`@NotBlank`、`@Size`、`@Past` 等），Controller 參數加 `@Valid`

### 1.4 錯誤格式與例外處理

- 成功直接回傳資料；錯誤一律回 ProblemDetail（RFC 9457），用 HTTP 狀態碼表示成功或失敗
- 例外集中在 `@RestControllerAdvice` 處理，Controller 不寫 try-catch
- 驗證失敗（`MethodArgumentNotValidException`）統一轉成 400

### 1.5 資料庫結構

- 用 Flyway 管理資料表變更：SQL 檔放在 `backend/src/main/resources/db/migration/`，命名 `V<版本>__<說明>.sql`，應用程式啟動時自動執行
- 已經執行過的 migration 不修改，要改資料表就新增下一個版本
- `ddl-auto: validate`：Hibernate 只檢查 Entity 和資料表是否一致，對不上時啟動就失敗；改了 Entity 要自己寫對應的 migration

### 1.6 設定

- 只有一份 `application.yaml`，不分環境建檔；會因環境不同的值寫成 `${環境變數:預設值}`，本機用預設值，dev 用環境變數

## 2. 前端

- 頁面一律在瀏覽器渲染（`"use client"`）
- TypeScript 只用基本寫法：替 API 的請求與回應定型別，其他地方不追求複雜的型別技巧

### 2.1 資料夾結構

### 2.2 呼叫 API

- API 呼叫集中在 `lib/api/`，型別對應後端 DTO；頁面不直接寫 `fetch`
- 一律呼叫相對路徑 `/api/...`，由各環境的轉發送到後端（見 [devops/](devops/README.md)）：前後端同網域，不用處理 CORS

### 2.3 登入狀態

- JWT 由後端放在 httpOnly cookie，前端不儲存、不讀取 token（原因見 [security.md](security.md) §3）
- 不用 Next.js `proxy.ts`（舊名 middleware）在頁面載入前檢查登入；未登入、token 過期或無效時 API 回 401，前端導向 `/login`：資料由後端驗證把關，未登入時最多先看到頁面框架、看不到資料，換來前端少一層邏輯
- 登出要呼叫後端清除 cookie，前端 JavaScript 刪不掉 httpOnly cookie

### 2.4 錯誤顯示

- 讀 ProblemDetail 的 `detail` 顯示給使用者

### 2.5 配色

- 顏色都定義在 `frontend/app/globals.css` 的 `:root`，實際樣子看 `/design-system` 頁
- 改色時文字對比要達到 WCAG AA，輸入框與 focus 外框至少 3:1
- 只用語意變數（`bg-primary`、`text-muted-foreground`⋯），不在元件裡直接寫色碼，也不另外定義帶品牌名稱的變數
- 只做淺色模式，不加 `.dark`
- 畫面上不放任何公司的 logo 或名稱
- `destructive`、`success`、`warning` 只能當底色，上面一律配對應的 `-foreground`：配白字或直接當文字色，對比都不夠
- 生命徵象異常用「底色徽章 + 圖示 + 文字」表示，不只靠改數字顏色，色弱的人才分得出來
- `muted-foreground` 放在 `muted` 淡底上對比不夠，小字盡量放白底
- `components/ui/` 是 shadcn 產生的檔案，不直接修改，重新安裝或升級時會被覆蓋；樣式不符合上面的規則時，在 `components/` 包一層：
  - 危險操作的按鈕用 `components/danger-button.tsx` 的 `DangerButton`，不直接用 `<Button variant="destructive">`
  - 生命徵象狀態用 `components/status-badge.tsx` 的 `StatusBadge`，不直接用 `<Badge variant="destructive">`
- 例外：`hooks/use-mobile.ts` 原本過不了 lint，已改寫；重新安裝 sidebar 會被覆蓋，屆時照檔案裡的註解改回來

## 3. 測試

- 執行指令見 [setup-local.md](devops/setup-local.md) §3.1

### 3.1 測試種類與工具

| 標記 | 種類 | 工具 | 測什麼 | 放哪裡 |
|---|---|---|---|---|
| 〔後端〕 | 後端整合測試 | JUnit 5 + Spring Boot Test（MockMvc）+ Testcontainers | 從 API 打進去、接真的 PostgreSQL，例如帳密檢查、資料驗證、存取資料 | `backend/src/test/java/` |
| 〔後端〕 | 後端單元測試 | JUnit 5 | 不需要 Spring 與資料庫的純邏輯，例如生命徵象的異常判斷 | `backend/src/test/java/` |
| 〔前端〕 | 前端單元測試 | Vitest | 只由前端決定的邏輯，例如站內網址檢查 | 和被測的檔案放在一起，`*.test.ts` |
| 〔E2E〕 | E2E | Playwright | 跨前後端的主要畫面流程，例如登入後導向 | `frontend/e2e/` |

- 後端以整合測試為主：測試的樣子最接近 AC 描述的行為，Flyway migration、資料庫約束也一起驗證到；不用 mock，不會測試通過、接起來卻不能用
- 畫面一律用 E2E 測，Vitest 不測畫面
- E2E 接真的後端，前後端對不上時才會被發現；只有連不上伺服器這類後端做不出來的情況，用 Playwright 攔截請求模擬

### 3.2 AC 與測試的對應

- AC 寫使用者看得到的行為，不寫 HTTP 狀態碼等技術細節
- AC 就是測試案例，不另外寫測試文件；每條 AC 至少有一個測試
- 每條 AC 標出用哪幾種測試，寫在標題後面，例如 `- **AC2 帳號或密碼錯誤**〔後端、E2E〕：Given …`
  - 寫 spec 時就決定；〔後端〕用整合或單元測試，開發時依 3.1 的表選
  - 開發時改了測試種類，spec 的標記在同一個 commit 修改
- 結果由後端決定、畫面也要顯示的 AC（例如帳密錯誤的訊息），同時標〔後端〕和〔E2E〕：後端測規則的各種情況，E2E 只測畫面有沒有呈現
- 測試名稱三種測試都用 `<REQ 編號> <AC 編號> <AC 標題>`，例如 `AUT-001 AC2 帳號或密碼錯誤`；搜尋 `AUT-001 AC2` 就能找到這條 AC 所有的測試
  - 後端寫在 `@DisplayName`，方法名稱照 Java 慣例用英文 camelCase（例如 `invalidCredentials`）
  - 前端、E2E 寫在 `test("…")` 的名稱
  - AC 標題改文字時，測試名稱可以不跟著改，以編號為準
- AC 的行為改變時，spec 與測試在同一個 commit 修改
- [data-model.md](data-model.md) 的每條不變條件也至少有一個測試
