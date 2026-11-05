---
name: c-commit
description: 分析 git 變更，依 Conventional Commits 產生繁體中文 commit 訊息，commit 與 push 前各自等使用者確認。僅限 /c-commit 直接觸發。
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(./mvnw *), Bash(npm --prefix frontend run *)
---

# Commit 流程

每個「停下來等待」的地方都必須真的停下來，不可自行假設使用者的回答。

## 1. 檢查狀態

執行：

- `git branch --show-current`
- `git status -sb`
- `git log --oneline -10`

有設定 remote 時，先 `git fetch`，再用 `git status -sb` 看與 upstream 的 ahead/behind。**不要執行 `git pull`**：工作區有未 commit 的變更時，pull 可能失敗或產生非預期的 merge。若 behind，告知落後幾個 commit，由使用者決定先整合還是照常 commit。

staged 與 unstaged 都是空的：告知沒有變更，結束流程。

否則顯示變更全貌，**停下來等待使用者回應**：

```
Branch：<branch-name>

已暫存（將被 commit）：
<staged 檔案列表，沒有就寫「（無）」>

未暫存（不會被 commit）：
<unstaged 檔案列表（含 untracked「??」新檔案），沒有就寫「（無）」>

要加入哪些未暫存的檔案？（輸入檔案路徑、all 加入全部，或 skip 略過）
```

untracked 是目錄時，用 `git status --short -uall` 展開成檔案列表，讓使用者看到實際會加入哪些檔案。

unstaged 為空時省略提問，直接進入步驟 2。收到回應後執行對應的 `git add`（或略過）。

**拆分建議**：變更橫跨多個不相關的主題（例如生命徵象功能，加上部署設定的修正），先列出分組方案、建議拆成多個 commit，由使用者決定。確定拆分時，步驟 2〜6 對每個 commit 依序執行（訊息可以一次全部給使用者確認）；步驟 7 的 push 詢問在**全部 commit 完成後只問一次**。

## 2. 機敏資料檢查

執行 `git diff --staged --name-only` 與 `git diff --staged` 後檢查：

- **路徑**：staged 檔案不可是
  - `.env`、`.env.*`（`.env.example` 除外）
  - 建置產物與套件：`backend/target/`、`frontend/node_modules/`、`frontend/.next/`
- **內容**：新增的行裡是否有
  - 密碼、token、JWT secret、金鑰的實際值（例如 `password=` 後面接的不是環境變數或佔位字串、`-----BEGIN ... PRIVATE KEY-----`）
  - AWS access key（`AKIA` 開頭的 20 碼字串）、伺服器的實際 IP 或主機名稱
  - 含帳密的連線字串（例如 `jdbc:postgresql://` 後面接上實際的帳號密碼）
  - 看起來像真實個人資料的病患資料：格式正確的身分證字號、真實的手機號碼或 email、真實醫院名稱搭配的病歷號。病患資料一律虛構，種子資料與測試資料也一樣

有疑慮時列出檔案與行號，**停下來等待使用者決定**是否移除；沒有疑慮就不顯示任何訊息，直接進入步驟 3。

## 3. 程式檢查

依 staged 檔案決定要跑什麼，沒改到的那一端略過：

- **後端**（`backend/` 底下的 `.java`、`pom.xml`、`src/main/resources/` 設定檔）：在 `backend/` 執行 `./mvnw test`
- **前端**（`frontend/` 底下的 `.ts`、`.tsx`、`.js`、`.mjs` 或設定檔）：執行 `npm --prefix frontend run lint`；`frontend/package.json` 有 `typecheck` script 時也執行

任一失敗時顯示錯誤摘要，**停下來等待使用者決定**：修正後再繼續，或照常 commit。測試若因 Docker 連不上而失敗，提醒使用者打開 Docker Desktop：測試由 Testcontainers 另開臨時資料庫。

## 4. 產生 commit 訊息

依 [conventions.md](conventions.md) 分析步驟 2 的 diff，產生 commit 訊息。

## 5. 等待確認（必須）

顯示以下資訊後**停下來等待使用者回應，不執行 commit**：

```
Branch：<branch-name>

將要 commit 的檔案：
<git diff --staged --stat 輸出>

建議的 commit 訊息：
---
<完整 commit 訊息>
---

請確認：ok（執行）／修改後告知／取消
```

## 6. 執行 commit

收到確認（或修改後的訊息）後執行：

```bash
git commit -m "$(cat <<'EOF'
<完整 commit 訊息>
EOF
)"
```

失敗時（例如 hook 擋下）顯示錯誤並停止，不要加 `--no-verify` 重試。

## 7. 詢問是否 push（必須）

commit 成功後顯示以下資訊，**停下來等待使用者回應，不執行 push**：

```
Commit 完成：<git log --oneline -1 輸出>

Branch：<branch-name>
Remote：<git remote get-url origin>

要 push 嗎？（ok／不用）
```

沒有設定 remote 時，告知目前沒有 remote，結束流程。

## 8. 執行 push

收到確認後執行 `git push -u origin $(git branch --show-current)`，顯示結果後結束流程。

被拒絕時（例如 remote 有本機沒有的 commit）顯示錯誤並停止，說明原因，由使用者決定如何整合。**不可使用 `--force`。**
