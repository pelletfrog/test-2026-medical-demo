# 登入

> 狀態：草稿

## 1. 目的

## 2. 需求

<!-- 不做註冊；系統啟動時建立預設帳號；登入成功後進入病患列表；沒登入或登入過期時導向登入頁；登出 -->

## 3. API

| 方法 | 路徑 | 用途 | 對應 REQ |
|---|---|---|---|
| POST | `/api/auth/login` | 登入，成功時把 JWT 放進 cookie | |
| POST | `/api/auth/logout` | 登出，清除 cookie | |

## 4. 畫面

- `/login`

## 5. 做法

- 用 Spring Security 內建的 `oauth2-resource-server` 驗證 JWT，用 `JwtEncoder` 簽發，不另外引入第三方 JWT 套件
- 預設帳號用 `CommandLineRunner` 在啟動時建立，帳號密碼從環境變數讀取
- Session 設為 stateless

### JWT cookie

- JWT 放在 cookie：前後端同網域，瀏覽器呼叫 `/api` 時自動帶上
- `HttpOnly`：前端 JavaScript 讀不到
- `SameSite=Strict`：其他網站發出的請求不會帶 cookie，用來防 CSRF，所以關閉 Spring 的 CSRF token
- `Path=/api`：只送給後端 API，前端頁面的請求不帶；登出清除時 `Path` 要相同，否則瀏覽器會當成另一個 cookie，刪不掉
- `Secure`：dev 環境（HTTPS）加上
- 預設的 `BearerTokenResolver` 只讀 `Authorization` header，要改成從 cookie 讀

### 前端

- 不儲存、不讀取 token
- 不用 Next.js `proxy.ts`（舊名 middleware）在頁面載入前檢查登入；未登入、token 過期或無效時 API 回 401，前端導向 `/login`：資料由後端驗證把關，未登入時最多先看到頁面框架、看不到資料，換來前端少一層邏輯
- 登出呼叫 `POST /api/auth/logout`，由後端清除 cookie：前端 JavaScript 刪不掉 httpOnly cookie
