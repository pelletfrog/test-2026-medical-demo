# 本機開發環境

> 狀態：草稿｜資料庫與 pgAdmin 跑在 Docker，後端與前端直接在本機執行

- 第一次在 Mac 上安裝工具，看 [setup-mac.md](setup-mac.md)

## 1. 架構

```
瀏覽器
 ├─ http://localhost:3000 → 前端（npm run dev）
 ├─ http://localhost:8080 → 後端（./mvnw spring-boot:run）──→ db（PostgreSQL 18，:5432）
 └─ http://localhost:5050 → pgadmin ─────────────────────────┘
```

| 服務 | 跑在哪 | 用途 |
|---|---|---|
| `db` | Docker（`postgres:18`） | 資料庫 |
| `pgadmin` | Docker（`dpage/pgadmin4:9`） | 資料庫管理介面 |
| 後端 | 本機 | Spring Boot |
| 前端 | 本機 | Next.js |

- API 文件：後端啟動後開 <http://localhost:8080/swagger-ui.html>
- 前端呼叫的 `/api/*` 由 Next.js rewrites 轉到後端的 8080（只在開發模式啟用；登入功能時加上）
- 設定檔：repo 根目錄的 `compose.yaml`；帳密與密鑰在 `.env`（不進 git，範本是 `.env.example`），後端也從這裡讀預設帳號與 JWT 密鑰
- 連接埠只綁 `127.0.0.1`，同網路的其他電腦連不到
- 資料庫與 pgAdmin 的資料放在 named volume，刪掉容器資料仍在

## 2. 啟動

- 後端與前端啟動後會一直佔住終端機，各開一個終端機，都從 repo 根目錄開始

```bash
cp .env.example .env                          # 只有第一次；之後 .env.example 新增的變數要自己補進 .env
```

```bash
cd backend && ./mvnw spring-boot:run          # 終端機 1；看到 Started VitalsApiApplication 即成功
```

```bash
cd frontend && npm install && npm run dev     # 終端機 2
```

- 後端啟動時，Spring Boot 的 Docker Compose Support 會自動啟動 `compose.yaml` 的服務；後端停止時不關資料庫，重啟後端不用等資料庫

## 3. 常用操作

### 3.1 常用指令

| 指令 | 在哪執行 | 用途 |
|---|---|---|
| `./mvnw spring-boot:run` | `backend/` | 開發模式啟動後端 |
| `./mvnw test` | `backend/` | 跑後端測試（Testcontainers 另開臨時資料庫，Docker Desktop 要開著） |
| `./mvnw test -Dtest='<類別>#<方法>'` | `backend/` | 只跑指定的測試，例如 `-Dtest='LoginTest#invalidCredentials'`；省略 `#<方法>` 跑整個類別 |
| `./mvnw clean package` | `backend/` | 打包成 `target/*.jar` |
| `./mvnw dependency:tree` | `backend/` | 看依賴樹 |
| `./mvnw spring-boot:run -Dspring-boot.run.arguments=--debug` | `backend/` | 看自動設定報告：哪些設定生效、為什麼 |
| `npm run dev` | `frontend/` | 開發模式啟動前端 |
| `npm run lint` | `frontend/` | 檢查前端程式 |
| `docker compose up -d` | repo 根目錄 | 只啟動資料庫與 pgAdmin，不跑後端 |

### 3.2 用 pgAdmin 看資料庫

1. 啟動後端時會一起啟動 pgAdmin；只想看資料庫時用 `docker compose up -d`
2. 開 <http://localhost:5050>，用 `.env` 的 `PGADMIN_EMAIL`、`PGADMIN_PASSWORD` 登入
3. 新增伺服器：主機填 `db`（容器之間用服務名稱連，不是 `localhost`），埠 `5432`，帳密與資料庫名稱看 `.env` 的 `DB_USER`、`DB_PASSWORD`、`DB_NAME`

## 4. 常見問題

- 安裝與第一次啟動的問題見 [setup-mac.md](setup-mac.md) §11
