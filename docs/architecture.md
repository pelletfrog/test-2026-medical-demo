# 系統架構

> 狀態：草稿

## 1. 架構圖

<!-- Mermaid：瀏覽器 → Nginx → Next.js／Spring Boot → PostgreSQL -->

## 2. 技術選擇

| 項目 | 選擇 | 理由 |
|---|---|---|
| 後端 | Spring Boot 4.x（Java 25、Maven） | 醫療科技職缺的主流需求；3.x 已結束開源維護 |
| 前端 | Next.js | 既有技能 |
| 資料庫 | PostgreSQL 18 | 主流；本機與正式環境都跑在 Docker，不用換資料庫 |
| JDK 管理 | SDKMAN!（Temurin 25） | 可切換多個 JDK 版本；25 是最新的 LTS（長期支援版） |
| 部署 | EC2 + Docker Compose | 便宜、每一步都看得到 |
| 反向代理 | Nginx + Certbot，裝在 EC2 主機上 | 業界主流；同網域轉發 `/api`，不用處理 CORS |
| 資料表變更 | Flyway | Spring Boot 專案最常用；純 SQL，只用 PostgreSQL 一種資料庫，不需要 Liquibase 的跨資料庫功能 |
| API 文件 | springdoc-openapi（Swagger UI） | 由程式產生，不用手寫；面試官可以直接試打 API |

## 3. 環境

### 3.1 專案結構

```
test-2026-medical-demo/
├── backend/            ← Spring Boot
├── frontend/           ← Next.js
├── compose.yaml        ← 本機開發：只跑資料庫
├── compose.prod.yaml   ← 正式環境：資料庫、後端、前端
├── .env                ← 不進 git；範例見 .env.example
└── docs/
```

### 3.2 本機與正式環境

| | 本機開發 | 正式環境（EC2） |
|---|---|---|
| Compose 檔 | `compose.yaml` | `compose.prod.yaml` |
| 後端 | `./mvnw spring-boot:run` | Docker image |
| 前端 | `npm run dev` | Docker image |
| `/api` 轉發 | Next.js rewrites（只在開發模式啟用） | 主機上的 Nginx |
| HTTPS | 不需要 | Certbot |
| 環境變數 | `.env` | 伺服器上的 `.env`，密碼與密鑰另設 |

後端只有一份 `application.yaml`，設定值寫成 `${環境變數:預設值}`：本機用預設值，正式環境用環境變數。

前端一律呼叫相對路徑 `/api/...`，本機由 rewrites、正式環境由 Nginx 轉到後端，所以前後端是同網域，沒有 CORS 問題。

## 4. 安全

- 一定要 HTTPS
- 密碼用 BCrypt 雜湊後儲存
- JWT 簽章密鑰與預設帳號的密碼從環境變數讀取，不寫在程式與文件裡
- JWT 放在 httpOnly cookie，前端 JavaScript 讀不到，XSS 偷不走；前後端同網域，瀏覽器呼叫 `/api` 時自動帶上
- cookie 設 `SameSite=Strict`：其他網站發出的請求不會帶 cookie，用來防 CSRF
- 除了登入，所有 `/api/**` 都要帶有效的 JWT
- 病患資料一律虛構，不使用真實個人資料
- EC2 安全群組只開 22（限自己的 IP）、80、443；資料庫不對外

## 5. 用語

| 中文 | 英文 | 單位 |
|---|---|---|
| 體溫 | Body Temperature | °C |
| 心跳 | Heart Rate | 次/分 |
| 呼吸 | Respiratory Rate | 次/分 |
| 收縮壓／舒張壓 | Systolic / Diastolic Blood Pressure | mmHg |
| 血氧 | SpO₂ | % |
