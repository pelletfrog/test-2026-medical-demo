# Commit 訊息格式

遵循 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/zh-hant/v1.0.0/)。

## 格式

```
<類型>[(<範圍>)][!]: <描述>

[正文（選填）]

[頁腳（選填）]
```

- 標題、正文、頁腳之間各空一行
- 標題一行寫完，盡量在 50 個字元內

## 類型

| 類型 | 使用時機 | 範例 |
|------|----------|------|
| `feat` | 使用者看得到的新功能、新頁面、新 API | 新增生命徵象紀錄頁、新增登入 API |
| `fix` | 修正錯誤行為 | 體溫上限判斷錯誤、未登入仍可呼叫 API |
| `refactor` | 調整結構但行為不變 | 抽出共用的驗證邏輯 |
| `style` | 只改程式碼格式（空白、分號），不影響行為 | 重新排版 |
| `perf` | 效能改善 | 歷次紀錄查詢加索引 |
| `test` | 只新增或修改測試 | 補齊 AC 對應的測試 |
| `docs` | 文件：spec、規範、README、部署說明 | 新增生命徵象 spec |
| `build` | 套件、建置設定、Dockerfile | 升級 Spring Boot、新增套件 |
| `ci` | CI 設定 | |
| `chore` | repo 維護 | `.gitignore`、`.claude/` 設定 |
| `revert` | 還原先前的 commit | |

判斷不確定時：使用者或 API 呼叫端感受得到差異 → `feat` 或 `fix`；感受不到 → `refactor`。

UI 調整（顏色、版面、文案）是使用者看得到的變更，用 `feat` 或 `fix`，**不是** `style`。

功能和它的測試一起 commit 時用 `feat` 或 `fix`，不另外拆成 `test`。

## 規則

- 描述用繁體中文、祈使句、現在式（「新增」而非「新增了」）
- 程式識別名稱（類別、函式、檔名、API 路徑）保留原文，用反引號標示
- 描述寫「做了什麼」；**原因不明顯時加正文說明「為什麼」**，例如踩到的錯誤、醫療上的判斷依據、取捨的理由。原因只留在對話裡，之後就無從查起
- 變更項目多時，正文用 `- ` 條列重點
- 實作依據某份 spec 時，正文最後註明，例如 `Spec: docs/specs/vital-signs/spec.md`
- 重大變更：類型或範圍後加 `!`，並在頁腳加 `BREAKING CHANGE: <說明>`。用於 API 契約改變、資料表需要 migration 才能相容、環境變數改名等情況

## Scope

依序判斷：

1. **屬於某個功能**：用功能名，前後端一起改也是同一個 scope。名稱沿用 `docs/specs/` 的資料夾名稱，例如 `auth`、`patients`、`vital-signs`
2. **不屬於任何功能**：用所在的層
   - `backend`：後端共用設定、共用類別、`pom.xml`
   - `frontend`：共用元件、layout、前端設定
   - `deploy`：`compose.yaml`、Dockerfile、Nginx
   - `docs`：跨功能的文件（規範、架構、資料模型）
   - `claude`：`.claude/`、`CLAUDE.md`
3. **只改 repo 根目錄的檔案，或跨多個不相關範圍**：省略 scope

決定前先用 `git log --format=%s` 查已用過的 scope，**有既有寫法就沿用**，沒有才依上面規則命名。

## 頁腳署名

- 由 AI 協作產生的 commit，訊息結尾一律加上固定署名，不帶模型版本，避免隨模型或工具更新而失真：

  ```
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

  這是專案規範，優先於工具內建的預設署名；即使 harness 指示帶特定模型名稱，仍以這行為準。
- 純人工的 commit 不需要

## 範例

**變更**：生命徵象紀錄功能，前後端一起完成
```
feat(vital-signs): 新增生命徵象紀錄與歷次查詢

- 可記錄體溫、脈搏、呼吸、血壓、血氧
- 數值超出合理範圍時擋下並提示
- 歷次紀錄依時間倒序顯示，每條 AC 都有測試

Spec: docs/specs/vital-signs/spec.md

Co-Authored-By: Claude <noreply@anthropic.com>
```

**變更**：修正血壓驗證
```
fix(vital-signs): 收縮壓不可低於舒張壓

原本只各自檢查上下限，收縮壓 80、舒張壓 90 也能存入。

Co-Authored-By: Claude <noreply@anthropic.com>
```

**變更**：密碼雜湊改用 Spring Security 內建的 encoder，行為不變
```
refactor(auth): 改用 `DelegatingPasswordEncoder` 處理密碼雜湊

Co-Authored-By: Claude <noreply@anthropic.com>
```

**變更**：API 回傳的欄位改名
```
feat(patients)!: 病患 API 的 `bedNo` 改名為 `bedNumber`

BREAKING CHANGE: 前端需同步改用 `bedNumber`
Co-Authored-By: Claude <noreply@anthropic.com>
```

**變更**：新增 commit skill
```
chore(claude): 新增 c-commit skill

Co-Authored-By: Claude <noreply@anthropic.com>
```
