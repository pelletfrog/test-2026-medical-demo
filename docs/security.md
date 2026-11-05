# 安全

> 狀態：草稿

- 跨功能的安全規則寫在這裡；單一功能的實作細節寫在該功能的 spec，這裡只放連結
- 撰寫程式參考 ISO 27002:2022 與 OWASP ASVS Level 1

## 1. 原則

- 一定要 HTTPS（dev 環境由 Nginx + Certbot 提供，見 [devops/](devops/README.md)）
- 除了登入，所有 `/api/**` 都要帶有效的 JWT；是否登入一律由後端檢查，前端只決定畫面怎麼顯示
- 密碼、JWT 簽章密鑰、預設帳號的密碼從環境變數讀取，不寫在程式與文件裡
- 病患資料一律虛構，種子資料與測試資料也一樣，不使用真實個人資料

## 2. 帳號與密碼

- 密碼用 BCrypt 雜湊後儲存
- 預設帳號在後端啟動時建立，做法見[登入 spec](specs/auth/login/spec.md) §5

## 3. 登入憑證

- JWT 放在 httpOnly cookie：前端 JavaScript 讀不到，XSS 偷不走；前後端同網域，瀏覽器呼叫 `/api` 時自動帶上
- cookie 設 `SameSite=Strict`：其他網站發出的請求不會帶 cookie，用來防 CSRF，所以不另外用 CSRF token
- cookie 的其他屬性（`Path`、`Secure`）與登出怎麼清除，見[登入 spec](specs/auth/login/spec.md) §5

## 4. 網路

- dev 環境的安全群組只開必要的連接埠，資料庫不對外，見 [devops/setup-dev.md](devops/setup-dev.md) §1
- 本機的連接埠只綁 `127.0.0.1`，見 [devops/setup-local.md](devops/setup-local.md) §1
