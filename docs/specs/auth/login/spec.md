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
- JWT 放在 cookie：`HttpOnly`、`SameSite=Strict`、`Path=/`，正式環境加 `Secure`；`Path=/` 是為了讓 Next.js middleware 看得到 cookie
- 預設的 `BearerTokenResolver` 只讀 `Authorization` header，要改成從 cookie 讀
- Session 設為 stateless；CSRF 靠 `SameSite=Strict` 防護，關閉 Spring 的 CSRF token
- 預設帳號用 `CommandLineRunner` 在啟動時建立，帳號密碼從環境變數讀取
