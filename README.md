# Vitals：病患生命徵象紀錄系統

病房護理師登入後，替病患記錄生命徵象並查看歷次紀錄。

## 截圖

<!-- 登入、病患列表、生命徵象紀錄；功能做完再補 -->

## 功能

- 登入
- 病患：列表、新增、查看
- 生命徵象：新增紀錄（體溫、心跳、呼吸、血壓、血氧）、查看病患的歷次紀錄

## 技術

| 項目 | 選擇 |
|---|---|
| 後端 | Spring Boot 4.x（Java 25、Maven） |
| 前端 | Next.js、shadcn/ui |
| 資料庫 | PostgreSQL 18 |
| 資料表變更 | Flyway |
| 測試 | JUnit 5 + Testcontainers、Vitest、Playwright |
| API 文件 | springdoc-openapi（Swagger UI） |

開發文件見 [docs/](docs/README.md)。

## TODO

- 非功能性需求
- 資訊安全管理：須遵守 ISO 27001（ISMS）
