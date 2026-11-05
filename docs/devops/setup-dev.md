# dev 環境（EC2）

> 狀態：草稿｜資料庫、後端、前端都跑在 Docker，主機上的 Nginx 負責轉發與 HTTPS

## 1. 架構

```
瀏覽器 ── HTTPS ──→ Nginx（EC2 主機上，Certbot 憑證）
                     ├─ /      → frontend 容器（Next.js）
                     └─ /api/* → backend 容器（Spring Boot）──→ db 容器（PostgreSQL 18）
```

| 服務 | 跑在哪 | 用途 |
|---|---|---|
| Nginx | EC2 主機 | 轉發、HTTPS |
| `frontend` | Docker | Next.js |
| `backend` | Docker | Spring Boot |
| `db` | Docker（`postgres:18`） | 資料庫 |

- 設定檔：repo 根目錄的 `compose.dev.yaml`；Nginx 裝在主機上，不在 compose 裡
- 環境變數：伺服器上的 `.env`，意思與預設值看 `.env.example`
- 安全群組只開 22（限自己的 IP）、80、443；資料庫不對外

## 2. 部署

<!-- 建 EC2、裝 Docker 與 Nginx、Certbot 申請憑證、建置 image、啟動 compose、更新版本；實際部署時寫 -->

## 3. 常用操作

<!-- 看各容器的 log、重啟服務、進資料庫 -->

## 4. 常見問題
