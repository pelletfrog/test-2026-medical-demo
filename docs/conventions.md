# 開發規範

> 狀態：草稿

## 1. 後端

### 1.1 套件結構

依功能分包（package by feature）。程式都放在 `@SpringBootApplication` 所在的 package 底下，否則 Spring 掃描不到。

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

- 成功直接回傳資料；錯誤一律回 **ProblemDetail**（RFC 9457），用 HTTP 狀態碼表示成功或失敗
- 例外集中在 `@RestControllerAdvice` 處理，Controller 不寫 try-catch
- 驗證失敗（`MethodArgumentNotValidException`）統一轉成 400

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail handleNotFound(NotFoundException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }
}
```

### 1.5 資料庫結構

- 用 **Flyway** 管理資料表變更：SQL 檔放在 `backend/src/main/resources/db/migration/`，命名 `V<版本>__<說明>.sql`，應用程式啟動時自動執行
- 已經執行過的 migration 不修改，要改資料表就新增下一個版本
- `ddl-auto: validate`：Hibernate 只檢查 Entity 和資料表是否一致，不自動改資料表；對不上時啟動就失敗
- 改了 Entity 要自己寫對應的 SQL（Spring 沒有 Django `makemigrations` 這種自動產生）

### 1.6 測試

## 2. 前端

TypeScript、Next.js App Router、shadcn/ui。頁面一律在瀏覽器渲染（`"use client"`），用一般的 `next build` + `next start` 執行。

TypeScript 只用基本寫法：替 API 的請求與回應定型別，其他地方不追求複雜的型別技巧。

### 2.1 資料夾結構

### 2.2 呼叫 API

- API 呼叫集中在 `lib/api/`，型別對應後端 DTO；頁面不直接寫 `fetch`
- 一律呼叫相對路徑 `/api/...`（原因見 [architecture.md](architecture.md) §3.2）

### 2.3 登入狀態

- JWT 由後端放在 httpOnly cookie，前端不儲存、不讀取 token（原因見 [architecture.md](architecture.md) §4）
- 不用 Next.js `proxy.ts`（舊名 middleware）在頁面載入前檢查登入；未登入、token 過期或無效時 API 回 401，前端導向 `/login`
  - 為什麼：前端全部在瀏覽器渲染，資料由後端驗證把關；未登入時最多先看到頁面框架，不會看到資料，換來前端少一層邏輯
- 登出要呼叫後端清除 cookie，前端 JavaScript 刪不掉 httpOnly cookie

### 2.4 錯誤顯示

讀 ProblemDetail 的 `detail` 顯示給使用者。

### 2.5 配色

shadcn/ui 用 Base UI 當元件底層（`base-nova` 樣式）。顏色都定義在 `frontend/app/globals.css` 的 `:root`，選色時要求文字對比達到 WCAG AA。

- 只用語意變數（`bg-primary`、`text-muted-foreground`⋯），不在元件裡直接寫色碼，也不另外定義帶品牌名稱的變數
- 只做淺色模式，不加 `.dark`
- 畫面上不放任何公司的 logo 或名稱

| 變數 | 色碼 | 用途 |
|---|---|---|
| `primary` / `primary-foreground` | `#00506e` / `#ffffff` | 主要按鈕、連結 |
| `secondary`、`accent` / 對應的 `-foreground` | `#eef8f8` / `#002e4f` | 次要按鈕、滑過時的底色 |
| `foreground` | `#353e5c` | 主要文字 |
| `muted-foreground` | `#6d758f` | 說明文字；放在 `muted` 淡底上只有 4.1:1，小字盡量放白底 |
| `input`、`ring` | `#6d758f`、`#00506e` | 輸入框外框、focus 外框，至少 3:1 才看得清楚 |
| `destructive` / `destructive-foreground` | `#ff7d39` / `#002e4f` | 刪除、異常 |
| `success` / `success-foreground` | `#83e254` / `#353e5c` | 正常 |
| `warning` / `warning-foreground` | `#fed906` / `#353e5c` | 需注意 |

`destructive`、`success`、`warning` 三種顏色配白字或直接當文字色，對比都不夠，所以只能當底色，上面一律配對應的 `-foreground`。生命徵象異常時，用「底色徽章 + 圖示 + 文字」表示，不要只靠改數字顏色，色弱的人也才分得出來。

`components/ui/` 是 shadcn 產生的檔案，不直接修改，因為重新安裝或升級時會被覆蓋。樣式不符合上面的規則時，在 `components/` 包一層：

- 危險操作的按鈕用 `components/danger-button.tsx` 的 `DangerButton`，不直接用 `<Button variant="destructive">`
- 生命徵象狀態用 `components/status-badge.tsx` 的 `StatusBadge`，不直接用 `<Badge variant="destructive">`

所有元件與配色的實際樣子，看 `/design-system` 頁。

### 2.6 測試
