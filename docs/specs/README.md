# 功能規格

> 狀態：草稿

## 1. 功能清單

| 功能 | 資料夾 | 代碼 | 狀態 |
|---|---|---|---|
| 登入 | [auth/login](auth/login/spec.md) | AUT | 定案 |
| 病患 | [patients](patients/spec.md) | PAT | 草稿 |
| 生命徵象 | [vital-signs](vital-signs/spec.md) | VIT | 草稿 |

## 2. 新增功能

- 複製 [`_template/spec.md`](_template/spec.md) 到 `specs/<功能>/spec.md`（同一領域有多個功能時再分一層，例如 `auth/login`），並在 §1 功能清單加一列
- 需求用到的資料表，和 REQ、AC 一起寫進 [data-model.md](../data-model.md)
- 使用者確認 REQ 與 AC 後，spec 開頭與 §1 功能清單的狀態改成「定案」；`/c-dev` 只開發定案的 spec
- 定案後修改 REQ 或 AC，狀態維持定案，用 `/c-dev` 讓測試與程式跟上

## 3. 編號規則

- 開始實作後編號就不變：不重新編號；刪除的編號空著，不再使用
- 草稿階段還沒有測試引用，可以重新編號

## 4. AC 與測試

- AC 的寫法照[模板](_template/spec.md)；測試種類的標記、測試名稱等規則見 [conventions.md](../conventions.md) §3
