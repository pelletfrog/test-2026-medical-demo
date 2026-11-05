---
name: c-dev
description: 依定案的 spec 開發功能（前後端一起），或依一個改變修改已完成的功能；比對 spec 與現有測試、程式的差異，先列計畫等確認，再依 AC 先寫測試、再寫程式，最後檢查程式與文件是否一致。不自己 commit。僅限 /c-dev 直接觸發。
disable-model-invocation: true
---

# 功能開發

用法：

| 用法 | 例子 | 從哪裡開始 |
|---|---|---|
| 帶一份或多份 spec | `/c-dev auth/login` | 這些 spec（`docs/specs/<路徑>/spec.md`） |
| 描述一個改變 | `/c-dev 修改：病歷號改成可以修改` | 從描述找出受影響的 spec、`data-model.md`、測試與程式 |
| 不帶參數 | `/c-dev` | `docs/` 裡還沒 commit 的修改（`git diff HEAD`、`git status --short`） |

- spec 已經實作過時，一律比對 spec 與現有的測試、程式，只做有差異的部分
- 一份 spec 是一個單位：Entity、migration、Service、API、畫面都是這個功能的一部分，不單獨成一步；一個改變動到多份 spec 時，全部列在同一份計畫裡
- 每個「停下來」的地方都必須真的停下來，不自行假設使用者的回答

## 1. 讀文件、找出差異

- 讀這次的 spec；狀態不是「定案」時，告知使用者並停下來
- 讀相關文件：
  - `docs/README.md` §2 以誰為準
  - `docs/conventions.md`：前後端規範與 §3 測試規則
  - `docs/data-model.md`：對應的資料表、欄位約束與不變條件
  - `docs/security.md`
  - 要寫前端時：`frontend/AGENTS.md`
- 比對 spec 與現有的測試、程式；測試名稱是 `<REQ 編號> <AC 編號> <AC 標題>`，用編號搜尋：
  - 有 AC 沒有測試：要新增
  - 有測試但 AC 已移除：要刪除
  - AC 的文字在 git 紀錄裡改過：檢查行為是否改變
  - API、資料表、畫面欄位和程式不一致：要修改
- 找出連帶影響：改到 `data-model.md`、共用的資料表或 API 時，找出其他用到它的 spec、測試與程式

## 2. 列出計畫（停下來等確認）

```
範圍：<spec 路徑、修改說明，或「docs/ 未 commit 的修改」>

要做的 REQ／AC：
| REQ／AC | 動作（新增／修改／刪除） | 要動的程式（Entity、migration、Service、API、畫面） | 測試（spec 的標記） |

影響其他功能：<其他 spec、共用的資料表或 API，以及要一起改的測試與程式；沒有則寫「無」>

待確認：<文件之間不一致、缺少、或要使用者決定的地方；沒有則寫「無」>

第 6 步的行為對照：<自己檢查／交給 subagent，附理由>
```

- 每條 AC 對應哪些程式要寫清楚；沒有 AC 對應的程式不列進來，先問使用者
- 描述一個改變、而 spec 還沒改時：先提出 spec 要怎麼改（AC 的新文字，編號照 `docs/specs/README.md` §3），並列出要新增、修改、刪除的測試；使用者同意後才改 spec，再改測試與程式
- 使用者說這次只做一部分（例如只做後端）時，做完那部分就停下來；功能還沒完成，不進到第 6 步
- 行為對照：規則複雜的功能（登入與未登入的處理、有新增與編輯的資料表單）交給 subagent；小功能或小修改自己檢查

## 3. 測試的寫法

測試的種類、標記、命名見 `docs/conventions.md` §3；這裡只寫開發時的順序。

- 先寫測試並執行，確認它因為功能還沒做而失敗，再寫程式讓它通過
- 控制執行時間：
  - 開發中只跑這次的 AC 的測試，不跑整套；篩選的指令見 `docs/devops/setup-local.md` §3.1，這種直接跑，不用先問
  - 整套測試、E2E、其他功能的測試只在第 6 步跑
- 修改時：
  - AC 只改文字、行為沒變：測試不用改
  - AC 的行為改變：先改測試，確認舊程式在新測試下失敗，再改程式
  - 新增 AC：照上面新增測試
  - 移除 AC：刪掉對應的測試
  - 開發時改了測試種類：spec 的標記一起改
- 其他功能的測試因為這次的修改而失敗時，列出來先問使用者，不直接改

## 4. 後端

- 依第 3 步先寫測試，再寫程式；寫法照 `docs/conventions.md` §1
- 新增或修改資料表時，migration 和 `docs/data-model.md` 一起改
- 需要資料庫的測試要開著 Docker Desktop：Testcontainers 另開臨時資料庫

完成後列出改了什麼、哪些 AC 的測試已通過，停下來。

## 5. 前端

- 依第 3 步先寫測試，再寫程式；寫法照 `docs/conventions.md` §2 與 `frontend/AGENTS.md`
- 畫面需要 `/design-system` 頁沒有的元件時，先討論再做

完成後列出改了什麼、哪些 AC 的測試已通過，停下來。

## 6. 檢查

先列出要執行的項目，等使用者同意後全部執行完再一起回報。這一步可以在新的對話單獨執行：只需要 spec 路徑與這次的 diff。

- 指令（見 `docs/devops/setup-local.md` §3.1）：
  - 後端：`./mvnw test`
  - 前端：`npm --prefix frontend run lint`；有裝 Vitest、Playwright 時也跑單元測試與 E2E
- 文件與程式，逐項比對，自己做：
  - 每條 AC 標記的每種測試都有，位置照 `docs/conventions.md` §3.1 的表；用 REQ 與 AC 編號搜尋測試名稱
  - `docs/data-model.md` 的欄位約束與不變條件都有測試
  - Entity、migration 和 `docs/data-model.md` 一致（欄位、約束）
  - spec 的 API 清單、畫面和程式一致
  - 沒有違反 `docs/conventions.md`
  - 這次改到文件時，讀 `.claude/skills/c-docs-check/SKILL.md`，照第 2 到 4 步檢查那些文件與關聯文件
- 程式的行為與 AC、不變條件一致，依第 2 步計畫的方式：
  - 自己檢查：回報註明「由開發者自己檢查」
  - 交給 subagent：用新開的 subagent，不用 fork（fork 會帶著目前的對話）
    - 給：spec 路徑、`docs/data-model.md` 相關的欄位約束與不變條件、這次的 diff（審查範圍）；需要時可以自己讀 `docs/` 其他文件與整個專案的程式
    - 不給：第 2 步的計畫（AC 對應哪些程式、影響其他功能）、這次的說明與檢查結果（例如「AC2 已完成」「測試都通過」）；避免它被帶著走
    - 請它逐條 AC、欄位約束與不變條件檢查：程式的行為和文件是否一致、測試程式是否真的驗證到
    - diff 改到共用的程式、資料表或 API 時，請它自己找出用到的其他 spec，同樣檢查那些 AC
    - 只檢查、不修改；每條都回報「符合／不符合／無法判斷」，不符合與無法判斷的附原因與檔案:行號
    - 回報的差異先自己讀程式確認，排除誤報再列給使用者

不一致時依 `docs/README.md` §2 判斷改程式還是文件；要改需求時先問使用者。沒通過時列出錯誤，由使用者決定修正或照常繼續。

## 7. 結束

列出這次改了什麼、還有哪些待確認，提醒使用者檢查都通過後用 `/c-commit`，AC 的行為改變時 spec 與測試放在同一個 commit。不自己 commit。
