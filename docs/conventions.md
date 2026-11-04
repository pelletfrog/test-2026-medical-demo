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

### 2.5 測試
