# Vitals：病患生命徵象紀錄系統

> 狀態：草稿

<!-- 一段話：做什麼、給誰用、Demo 網址 -->

## 截圖

## 功能

- 登入
- 病患：列表、新增、查看
- 生命徵象：新增紀錄（體溫、心跳、呼吸、血壓、血氧）、查看病患的歷次紀錄

## 技術

<!-- 一行列出，細節連到 docs/architecture.md -->

## 系統架構

<!-- 一句話 + 連到 docs/architecture.md -->

## 本機啟動

### 需要的工具

JDK 25、Docker、Node.js。第一次在 Mac 上建置環境，看 [docs/setup-mac.md](docs/setup-mac.md)。

### 啟動

```bash
cp .env.example .env
cd backend && ./mvnw spring-boot:run      # 看到 Tomcat started on port 8080 即成功
cd frontend && npm install && npm run dev
```

### 常用指令

| 指令 | 用途 |
|---|---|
| `./mvnw spring-boot:run` | 開發模式啟動後端 |
| `./mvnw test` | 跑後端測試 |
| `./mvnw clean package` | 打包成 `target/*.jar` |
| `./mvnw dependency:tree` | 看依賴樹 |
| `./mvnw spring-boot:run -Dspring-boot.run.arguments=--debug` | 看自動設定報告：哪些設定生效、為什麼 |
| `docker compose up -d` | 只啟動資料庫與 pgAdmin，不跑後端 |

### 用 pgAdmin 看資料庫

1. 啟動後端時會一起啟動 pgAdmin；只想看資料庫時用 `docker compose up -d`
2. 開 <http://localhost:5050>，用 `.env` 的 `PGADMIN_EMAIL`、`PGADMIN_PASSWORD` 登入
3. 新增伺服器：主機填 `db`（容器之間用服務名稱連，不是 `localhost`），埠 `5432`，帳密與資料庫名稱看 `.env` 的 `DB_USER`、`DB_PASSWORD`、`DB_NAME`

## 設計考量

<!-- 為什麼這樣設計：登入與 JWT、錯誤格式、病患資料一律虛構 -->

## 之後規劃

以下功能這次沒有做，說明為什麼需要、打算怎麼做：

- **角色權限**：醫師、護理師、管理者的權限不同
- **紀錄的更正歷程**：醫療紀錄不刪除、不覆寫，更正時保留原值、更正者與原因
- **audit log**：記錄誰在什麼時候看了、改了哪筆資料
- **異常值標示**：超出參考範圍的數值要醒目標示
- **早期警示分數（NEWS2）**：多項數值綜合評估病患是否惡化
- **住院紀錄**：病房、床號、入出院時間；生命徵象改掛在住院紀錄底下
- **趨勢圖**：同一位病患的數值隨時間變化
- **欄位命名參考 HL7 FHIR**（`Patient`、`Observation`）

<!-- 每項再補一句「打算怎麼做」 -->
