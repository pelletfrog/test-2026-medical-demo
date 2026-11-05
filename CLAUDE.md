# Vitals：病患生命徵象紀錄系統

病房護理師登入後，替病患記錄生命徵象並查看歷次紀錄。
技術見 `README.md`。

## 文件在哪

| 要找 | 看哪裡 |
|---|---|
| 文件地圖、以誰為準、寫作規則 | `docs/README.md` |
| 功能規格與功能清單 | `docs/specs/README.md` |
| 前後端規範、測試規則 | `docs/conventions.md` |
| 寫前端程式前先看（Next.js 產生，要 AI 依已安裝版本的文件寫程式） | `frontend/AGENTS.md` |
| 各環境怎麼跑（本機、dev） | `docs/devops/README.md` |
| 本機啟動與常用指令 | `docs/devops/setup-local.md` |
| commit 訊息格式 | `.claude/skills/c-commit/conventions.md`（用 `/c-commit`） |

## 開發流程

1. **spec**：每個功能先寫 REQ 與 AC，用 `/c-docs-check <spec>` 檢查後，和使用者確認才開發。
2. **開發**：一個功能前後端一起做；先依 AC 寫測試，再寫程式（規則見 `docs/conventions.md` §3）。
3. **commit**：功能完成、測試通過後，用 `/c-commit`。

## 工作規則

- 用繁體中文回覆與撰寫文件。
- 一次討論一件事；每完成一個步驟，說明改了什麼、需要使用者決定什麼，然後停下來。
- commit、push、開始新階段都要等使用者同意。
- 選技術或套件時，選使用者多、仍在維護的版本。
- 病患資料一律虛構，不使用真實個人資料。
- 密碼、密鑰等實際的值不寫進程式與文件，改寫「看哪個環境變數」。
- 程式註解寫「為什麼」，不寫「做了什麼」。
