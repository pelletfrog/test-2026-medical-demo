---
name: c-docs-check
description: 檢查文件本身：spec 的 AC 格式與測試標記、編號、寫作規則、文件分工、連結與 § 編號、帳密與個資，並一併檢查相關聯的文件。不比對程式與測試（那是 /c-dev 的檢查）。列出發現等使用者確認後才修改。僅限 /c-docs-check 直接觸發。
disable-model-invocation: true
---

# 文件檢查

只檢查文件，不執行測試、不看程式內容；只在測試裡搜尋 REQ 編號。每個「停下來」的地方都必須真的停下來。

用法：

| 用法 | 例子 | 檢查對象 |
|---|---|---|
| 帶一份或多份 spec | `/c-docs-check auth/login` | 這些 spec（`docs/specs/<路徑>/spec.md`） |
| 不帶參數 | `/c-docs-check` | 還沒 push 的修改裡的文件 |
| `full` | `/c-docs-check full` | `docs/**/*.md`、`CLAUDE.md`、`README.md`、`.claude/skills/**/*.md` 全部 |

## 1. 讀規則

每次都重新讀，不憑記憶：

- `docs/README.md`：各文件放什麼、以誰為準、寫作規則
- `docs/conventions.md` §3.2：AC 與測試的對應
- `docs/specs/README.md`、`docs/specs/_template/spec.md`：spec 的結構與編號

## 2. 找出範圍

**檢查對象**

- 帶 spec：那幾份 spec
- 不帶參數：
  - 有 upstream（`git rev-parse --abbrev-ref @{u}` 成功）：`git diff @{u} --name-status` 加上 `git status --short`
  - 沒有 upstream：`git diff HEAD --name-status` 加上 `git status --short`
  - 只看 `docs/`、`CLAUDE.md`、`README.md`、`.claude/skills/` 底下的 `.md`；沒有這類修改時告知使用者並停止
  - 有檔案搬移、改名、刪除，或章節標題、§ 編號改變時，記下舊的檔名與標題
- `full`：全部，不需要找關聯文件

**關聯文件**（帶 spec 與不帶參數時都要找）

- 檢查對象連到的文件
- 連到檢查對象的文件：用檔名在 `docs/`、`CLAUDE.md`、`README.md`、`.claude/skills/` 搜尋
- 寫到同一個主題的文件：取檢查對象裡修改或新增內容的關鍵字（技術名詞、規則的主詞），在上述範圍搜尋
- 第一步記下的舊檔名、舊標題、舊 § 編號出現的地方

關聯文件做第 4 步的檢查，但只看和檢查對象有關的段落，不檢查整份。

## 3. spec 檢查

檢查對象裡的每份 spec，以及 `full` 時的全部 spec：

- 章節和模板一致；模板標為選填的章節可以刪，其他沒有內容的保留標題
- REQ 編號 `REQ-<代碼>-NNN`，代碼和 `docs/specs/README.md` 功能清單一致；沒有重複
- AC 有編號與標題，格式照模板；有 Given / When / Then
- 每條 AC 都有測試標記，只用 `conventions.md` §3.1 表裡的標記，可以組合
- 標記和 AC 的內容相符，依 `conventions.md` §3.2：
  - Then 是畫面看得到的結果（「畫面顯示」「導向」「按鈕」）：要有〔E2E〕
  - Then 是系統的規則（拒絕、記錄、視為未登入）：要有〔後端〕
  - 兩者都有：〔後端〕加〔E2E〕
  - 判斷不了要標什麼：表示 AC 寫得不夠清楚，列出來並建議改寫，不自己決定
- AC 可以測：沒有「快速」「適當」「合理」這類沒有標準的字眼
- AC 不寫 HTTP 狀態碼等技術細節
- 編號穩定：測試裡搜得到這份 spec 的 REQ 編號時，和 git 紀錄比對，沒有重新編號、刪除的編號沒有被再用；標記改了，提醒使用者用 `/c-dev` 讓測試跟上
- `docs/specs/README.md` 功能清單有這份 spec，狀態一致

## 4. 所有文件都檢查

- 連結：相對路徑的檔案存在；「見 xxx §n」的 § 編號存在，標題和內容相符
- 第二步記下的舊檔名、舊標題、舊 § 編號：指向它們的地方都已更新
- 寫作規則：照 `docs/README.md`，包括格式、只寫規則、不寫歷史、狀態行、保留待辦標題
- 文件分工：內容放在 `docs/README.md` 文件地圖規定的文件，例如
  - `security.md` 只寫不綁技術、不分環境的要求
  - `conventions.md` 只寫寫程式時要遵守、從程式看不出來的規則
  - 單一功能的做法寫在該功能的 spec
  - 各環境的實際設定寫在 `devops/`
- 一個主題只寫一處：同一條規則在兩份文件都寫了內容（不是連結）時列出，建議留哪一處；`CLAUDE.md` 依 `docs/README.md` 列為例外的規則不算
- 沒有實際的值：密碼、金鑰、token、真實 IP 與主機名稱；要寫成看哪個環境變數
- 病患資料都是虛構的：沒有格式正確的身分證字號、真實的電話或 email
- 繁體中文
- 改到 `CLAUDE.md` 或 skill 時：流程、指令、檔案路徑和 `docs/` 的寫法一致

## 5. 回報（停下來等確認）

不自行修改任何檔案。依發現的位置分段，沒有問題的併成一行；編號跨段落連續：

```
## 文件檢查結果

範圍：<spec 路徑、「未 push 的修改：N 個檔案」或 full>
關聯文件：<檔案列表；沒有則寫「無」>

### <檔案，例如 docs/specs/auth/login/spec.md>
- [1] <檔案:行號>：<問題>；建議：<怎麼改>

### <下一個檔案>
- [2] ...

### 已檢查、沒有問題
<一行列出>

要修改哪些？（輸入編號、all，或 skip）
```

要使用者決定的項目（AC 寫得不清楚、標記判斷不了、該留哪一處）放在最前面。

## 6. 修改

- 只改使用者選的項目，照原文件的格式，不擴大範圍
- 改完列出改了哪些檔案；動到 AC 或標記時，提醒用 `/c-dev` 讓測試跟上
- 不自己 commit
