# 資料模型

> 狀態：草稿

## 1. ERD

<!-- Mermaid erDiagram：使用者、病患、生命徵象 -->

## 2. 資料表

### 2.1 使用者

<!-- 帳號、BCrypt 雜湊後的密碼 -->

### 2.2 病患

| 欄位 | 說明 |
|---|---|
| `id` | |
| `medicalRecordNo` | 病歷號，唯一 |
| `name` | 姓名 |
| `birthDate` | 生日 |
| `createdAt` | 建立時間 |

### 2.3 生命徵象

<!-- 欄位名稱與型別等 vital-signs spec 確定後再寫 -->

| 項目 | 英文 | 單位 |
|---|---|---|
| 體溫 | Body Temperature | °C |
| 心跳 | Heart Rate | 次/分 |
| 呼吸 | Respiratory Rate | 次/分 |
| 收縮壓／舒張壓 | Systolic / Diastolic Blood Pressure | mmHg |
| 血氧 | SpO₂ | % |

## 3. 不變條件

- 病歷號不可重複

<!-- 任何時候都必須成立的規則，每條都要有測試 -->
