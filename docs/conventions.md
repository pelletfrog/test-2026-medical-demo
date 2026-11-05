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
├── auth/                        ← 登入、JWT、使用者
├── common/
│   ├── BaseEntity.java          ← 共用欄位（§1.7）
│   ├── TimeZones.java           ← Asia/Taipei 常數與 API 時間格式（§1.8）
│   ├── PageResponse.java        ← 列表的分頁回應（§1.9）
│   ├── GlobalExceptionHandler.java
│   ├── NotFoundException.java   ← 找不到資料，回 404
│   └── FieldErrorException.java ← 要查資料庫才知道的欄位錯誤，回 400 並放進 errors
└── config/
    ├── SecurityConfig.java
    ├── JpaAuditingConfig.java   ← @EnableJpaAuditing、AuditorAware（§1.7）
    ├── JacksonConfig.java       ← Instant 的 API 格式（§1.8）
    ├── ClockConfig.java         ← Asia/Taipei 的 Clock（§1.8）
    └── ValidationConfig.java    ← 時間的驗證註解用注入的 Clock（§1.8）
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
- `detail` 是給使用者看的訊息，用繁體中文；有欄位錯誤時只寫摘要「請修正標示的欄位」，不重複欄位訊息；有不能歸給欄位的錯誤時，寫那則錯誤
- 欄位錯誤放在擴充欄位 `errors`，格式 `{ "<欄位>": "<訊息>" }`：key 和 Request DTO 的欄位同名，每個欄位一則；前端直接用欄位名稱放到對應欄位下方
  - 跨欄位的錯誤能歸給某個欄位時，在自訂驗證器用 `addPropertyNode` 指定欄位，一樣放進 `errors`；不能歸給某個欄位時，只寫在 `detail`
- 驗證註解的訊息照 §2.5 的格式寫，例如 `@NotBlank(message = "請輸入帳號")`：前後端顯示的文字一致

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "請修正標示的欄位",
  "instance": "/api/patients",
  "errors": { "medicalRecordNo": "請輸入病歷號" }
}
```

| 狀態碼 | 情況 | `errors` |
|---|---|---|
| 400 | 驗證失敗 | 有 |
| 401 | 未登入、登入過期；登入時帳號或密碼錯誤 | 無 |
| 404 | 找不到資料 | 無 |
| 409 | 和現有資料衝突，例如病歷號已存在 | 有，對應到欄位 |
| 500 | 未預期的錯誤，`detail` 一律是「系統發生錯誤，請稍後再試」 | 無 |

- 500 不回傳例外訊息與 stack trace，只記在 log：避免洩漏系統內部資訊

### 1.5 資料庫結構

- 用 Flyway 管理資料表變更：SQL 檔放在 `backend/src/main/resources/db/migration/`，命名 `V<版本>__<說明>.sql`，應用程式啟動時自動執行
- 已經執行過的 migration 不修改，要改資料表就新增下一個版本
- `ddl-auto: validate`：Hibernate 只檢查 Entity 和資料表是否一致，對不上時啟動就失敗；改了 Entity 要自己寫對應的 migration
- 唯一約束命名為 `uk_<表>_<欄位>`：`GlobalExceptionHandler` 從約束名稱找出欄位，放進 `errors`
- 外鍵欄位要建索引：PostgreSQL 不會自動建立；共用欄位 `createdBy`、`updatedBy` 例外，很少用來查詢
- 為了查詢速度建的索引不寫進文件，在 migration 用 SQL 註解寫原因

### 1.6 設定

- 只有一份 `application.yaml`，不分環境建檔；會因環境不同的值寫成 `${環境變數:預設值}`，本機用預設值，dev 用環境變數
- 例外：帳號、密碼、密鑰等機密不給預設值，本機也從 `.env` 讀取：給了預設值就等於公開的密碼
  - 寫成 `${環境變數:}`（冒號後面空白），並用 `@NotBlank` 檢查：沒設定時 Spring 會把 `${…}` 原字串當成值，檢查不出來

### 1.7 Entity 共用欄位

- 欄位見 [data-model.md](data-model.md) §2
- 共用欄位放在 `common/BaseEntity`（`@MappedSuperclass`），每個 Entity 都繼承它
- `id` 用 PostgreSQL identity（`@GeneratedValue(strategy = GenerationType.IDENTITY)`）
- 時間欄位的型別見 §1.8
- `createdAt`、`updatedAt`、`createdBy`、`updatedBy` 用 Spring Data JPA Auditing（`@CreatedDate`、`@LastModifiedDate`、`@CreatedBy`、`@LastModifiedBy`）自動填入
  - `AuditorAware` 從 JWT 的 `sub` 取得使用者 `id`；未登入時回傳 `Optional.empty()`，例如啟動時建立預設帳號
- 資料不實體刪除；查詢一律排除已刪除的資料
  - 每個 Entity 加 `@SoftDelete(strategy = SoftDeleteType.TIMESTAMP, columnName = "deleted_at")`：刪除與查詢排除由 Hibernate 處理，不靠每個查詢自己加條件
  - 刪除用 `delete` / `deleteById`，不用 `deleteAllInBatch` 等批次刪除：批次刪除是否轉成軟刪除未確認
  - 原生 SQL 不會自動排除已刪除的資料，要自己加 `deleted_at IS NULL`
- 唯一約束包含已刪除的資料：避免病歷號、帳號被重複使用
  - `existsBy…` 查不到已刪除的資料，撞號時以資料庫的約束錯誤（`DataIntegrityViolationException`）為準，在 `GlobalExceptionHandler` 轉成「已存在」的訊息

### 1.8 時間

- Java 用 `Instant`、資料庫用 `timestamptz`：都表示明確的時間點，不受伺服器時區影響
- 程式不依賴伺服器時區：需要台灣時間的地方明確使用 `common/` 的 `Asia/Taipei` 常數；伺服器、容器的時區設定不一定是台北
- API 的時間一律是 `yyyy-MM-dd HH:mm`（`Asia/Taipei`），日期是 `yyyy-MM-dd`；時間由 Jackson 全域轉換，輸入輸出同格式：前端直接顯示，不處理時區
- 判斷「今天」用注入的 `Clock`（`Asia/Taipei`），不直接呼叫 `LocalDate.now()`：`now()` 用的是伺服器時區；測試也能固定時間

### 1.9 分頁

- 列表 API 用 `page`、`size` 參數，頁碼從 1 開始：和畫面、網址上的頁碼相同，前端不用換算
  - 設定 `spring.data.web.pageable.one-indexed-parameters: true`
- 回應用 `common/PageResponse`：`content`、`page`（從 1 開始）、`size`、`totalElements`、`totalPages`；Spring 內建的分頁回應頁碼從 0 開始，和參數不一致

## 2. 前端

- 頁面一律在瀏覽器渲染（`"use client"`）
- TypeScript 只用基本寫法：替 API 的請求與回應定型別，其他地方不追求複雜的型別技巧

### 2.1 資料夾結構

### 2.2 呼叫 API

- API 呼叫集中在 `lib/api/`，型別對應後端 DTO；頁面不直接寫 `fetch`
- 一律呼叫相對路徑 `/api/...`，由各環境的轉發送到後端（見 [devops/](devops/README.md)）：前後端同網域，不用處理 CORS
- `lib/api/` 的共用請求函式依狀態碼分辨成功與失敗：成功回傳資料，失敗丟出 `ApiError`（`status`、`detail`、`errors`）；頁面與表單只處理這兩種結果
- 收到 401 時導向 `/login`；登入 API 例外，顯示 `detail`：帳號或密碼錯誤也是 401，導向登入頁會讓錯誤訊息消失

### 2.3 錯誤顯示

- 有 `detail` 就顯示在表單上方的 `FormAlert`，有 `errors` 就顯示在對應欄位下方，格式見 §1.4：後端的錯誤在送出後才出現，上方摘要讓使用者知道送出失敗
- 錯誤不用視窗或 `alert()`：視窗擋住表單，關掉後就看不到要改哪裡；視窗只用在需要使用者做決定時，例如刪除確認

| 情況 | 顯示在哪 |
|---|---|
| 單一欄位錯誤 | 該欄位下方 |
| 跨欄位錯誤，能歸給某個欄位 | 最相關的欄位下方 |
| 跨欄位錯誤，不能歸給某個欄位 | 表單上方的 `FormAlert` |
| 系統錯誤（網路斷線、500） | 表單上方的 `FormAlert` |

### 2.4 配色

- 顏色都定義在 `frontend/app/globals.css` 的 `:root`，實際樣子看 `/design-system` 頁
- 改色時文字對比要達到 WCAG AA，輸入框與 focus 外框至少 3:1
- 只用語意變數（`bg-primary`、`text-muted-foreground`⋯），不在元件裡直接寫色碼，也不另外定義帶品牌名稱的變數
- 只做淺色模式，不加 `.dark`
- 畫面上不放任何公司的 logo 或名稱
- `destructive`、`success`、`warning` 只能當底色，上面一律配對應的 `-foreground`：配白字或直接當文字色，對比都不夠
- `muted-foreground` 放在 `muted` 淡底上對比不夠，小字盡量放白底
- `components/ui/` 是 shadcn 產生的檔案，不直接修改，重新安裝或升級時會被覆蓋；樣式不符合上面的規則時，在 `components/` 包一層：
  - 危險操作的按鈕用 `components/danger-button.tsx` 的 `DangerButton`，不直接用 `<Button variant="destructive">`
- 例外：`hooks/use-mobile.ts` 為了通過 lint 改寫過；重新安裝 sidebar 會被覆蓋，屆時照檔案裡的註解改回來

### 2.5 表單

- 用 React Hook Form + Zod + shadcn `Field`：shadcn 官方的表單寫法；不用舊的 `<Form>` / `<FormField>`
- 頁面只用 `components/form/` 的共用元件，不直接組 `Input` + `Label`：每頁的排版與錯誤位置一致；元件的樣子看 `/design-system` 頁，用到新的欄位類型時先加共用元件與 `/design-system` 範例
  - `TextField`：去掉前後空白
  - `PasswordField`：可切換顯示，不去掉前後空白
  - `NumberField`：單位放在輸入框右側；不用 `type="number"`，表單值是字串，由 Zod 檢查與轉換
  - `DateTimeField`：到分鐘，表單值是 `yyyy-MM-ddTHH:mm`，送出前用 `lib/date-time.ts` 轉成 API 的格式
  - `ComboboxField`：選項很多時用，邊輸入邊向後端查詢
  - `FormAlert`：表單上方的訊息
  - `SubmitButton`：處理中停用並顯示載入中
- 前端檢查必填、長度、格式、範圍，讓使用者馬上看到；後端用 `@Valid` 再檢查一次，以後端為準；業務規則（例如病歷號重複）只由後端檢查
- 送出時第一次檢查；有錯之後，該欄位邊輸入邊重新檢查（`mode: "onSubmit"`、`reValidateMode: "onChange"`）
- 跨欄位的規則用 Zod 的 `refine`，以 `path` 指定錯誤顯示在哪個欄位
- 驗證訊息格式：
  - 必填：「請輸入〇〇」；下拉選單「請選擇〇〇」
  - 長度：「〇〇最多 N 個字」
  - 範圍：「〇〇需介於 a～b」
  - 格式：「〇〇只能是△△」，例如「病歷號只能是英文字母與數字」

### 2.6 列表

- 搜尋用 `components/search-box.tsx` 的 `SearchBox`，分頁用 `components/list-pagination.tsx` 的 `ListPagination`；樣子看 `/design-system` 頁
- 按 Enter 或「搜尋」才查詢，不邊打字邊查
- 搜尋條件與頁碼放在網址的查詢參數（例如 `?q=A00&page=2`）：重新整理、按上一頁時停在原本的位置
- 重新搜尋時回到第 1 頁

## 3. 測試

- 執行指令見 [setup-local.md](devops/setup-local.md) §3.1

### 3.1 測試種類與工具

| 標記 | 種類 | 工具 | 測什麼 | 放哪裡 |
|---|---|---|---|---|
| 〔後端〕 | 後端整合測試 | JUnit 5 + Spring Boot Test（MockMvc）+ Testcontainers | 從 API 打進去、接真的 PostgreSQL，例如帳密檢查、資料驗證、存取資料 | `backend/src/test/java/` |
| 〔後端〕 | 後端單元測試 | JUnit 5 | 不需要 Spring 與資料庫的純邏輯，例如時間格式的轉換 | `backend/src/test/java/` |
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
- [data-model.md](data-model.md) 的欄位約束與不變條件也至少各有一個測試
