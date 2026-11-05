# Mac 開發環境建置（新手版）

> 狀態：草稿

第一次在 Mac 上開發 Spring Boot：從安裝工具、建立專案，到後端第一次跑起來。
專案建好之後，日常的啟動方式與常用指令看 [setup-local.md](setup-local.md)。

## 0. 會用到的工具

| 工具 | 用途 | Python／Django 的對應 |
|---|---|---|
| SDKMAN! | 安裝與切換 JDK 版本 | pyenv |
| JDK 25（Temurin） | 編譯與執行 Java | Python 直譯器 |
| Maven（專案內附 `mvnw`） | 管理套件、編譯、啟動、測試 | pip + `manage.py` |
| `pom.xml` | 列出專案用到的套件 | `requirements.txt` |
| start.spring.io | 產生 Spring Boot 專案 | `django-admin startproject` |
| Docker Desktop | 在本機跑 PostgreSQL | 同 |
| VS Code | 編輯器 | 同 |

## 1. Homebrew

```bash
brew --version
```

有顯示版本就跳過。沒有的話依 [brew.sh](https://brew.sh/) 首頁的指令安裝。

## 2. SDKMAN! 與 JDK 25

### 2.1 安裝 SDKMAN!

SDKMAN! 的安裝程式需要 Bash 4 以上，但 macOS 內建的是 Bash 3.2，要先用 Homebrew 裝新版 Bash（只是給安裝程式用，終端機預設的 zsh 不受影響）：

```bash
brew install bash
bash --version                    # 確認是 5.x；還是 3.2 就開一個新的終端機再看
```

再安裝 SDKMAN!：

```bash
curl -s "https://get.sdkman.io" | bash
```

裝完**關掉終端機再開一個新的**，讓設定生效，然後確認：

```bash
sdk version
```

### 2.2 安裝 JDK 25

```bash
sdk list java | grep tem          # 列出 Temurin 的版本，找 25 開頭、結尾是 -tem 的
sdk install java 25.0.5.0+8-tem    # 換成上一步看到的完整版本號；問是否設為預設時選 Y
```

確認：

```bash
java -version                     # 應顯示 25.0.x
sdk current java
```

> Temurin 是 Eclipse 基金會發行的免費 JDK，是最常用的版本之一。

## 3. Maven：不用另外安裝

專案裡會附 `mvnw`（Maven Wrapper），第一次執行時會自動下載對應版本的 Maven。之後的指令一律用 `./mvnw`，不用 `mvn`。

## 4. 確認有 Docker Desktop

```bash
docker --version
docker compose version
```

## 5. 安裝 Node.js 24

前端要用 Node 24（LTS）。Node 22.12 以前的版本無法載入 Tailwind 依賴的純 ESM 套件，`npm run build` 會失敗。
版本寫在根目錄的 `.nvmrc`，用 nvm 管理：

```bash
nvm install 24
nvm alias default 24   # 新開的終端機才會預設用 24
node --version         # 應顯示 v24.x
```

沒有 nvm 的話，先照 [nvm 官方說明](https://github.com/nvm-sh/nvm#installing-and-updating) 安裝。

## 6. VS Code

用 VS Code 編輯程式，啟動、測試、打包一律在終端機下 `./mvnw` 指令，每一步做了什麼都看得到。
IDE 的按鈕背後執行的其實也是這些指令；先熟悉指令，之後換任何 IDE 都知道它在做什麼。

### 6.1 擴充套件

在擴充套件頁（`Cmd + Shift + X`）搜尋並安裝這兩個，認明發行者：

| 擴充套件 | 發行者 | 用途 |
|---|---|---|
| **Extension Pack for Java** | Microsoft | Java 的語法檢查、自動完成、除錯、跑測試、Maven 支援；是幾個擴充套件的組合包，裝這一個就好 |
| **Spring Boot Extension Pack** | VMware（Broadcom） | `application.yaml` 的設定提示、Spring 元件的提示 |

注意：

- **先裝好 JDK（第 2 節）再開 VS Code**。Java 擴充套件靠 SDKMAN 設定的 `JAVA_HOME` 找 JDK；JDK 是在 VS Code 開著時才裝的話，要整個關掉重開。
- Spring Boot Extension Pack 側邊欄有啟動按鈕（Spring Boot Dashboard），這個專案不用它，一律用終端機啟動。

## 7. 建立後端專案

用官方的 [start.spring.io](https://start.spring.io/)（Spring Initializr）產生專案，這是 Spring Boot 建立專案的標準方式。

| 欄位 | 選擇 |
|---|---|
| Project | Maven |
| Language | Java |
| Spring Boot | 預設版本（不要選 SNAPSHOT 或 RC，那是還沒正式發布的版本） |
| Group | `io.github.pelletfrog` |
| Artifact | `vitals-api` |
| Name | `vitals-api` |
| Package name | `io.github.pelletfrog.vitals` |
| Packaging | Jar |
| Configuration | YAML |
| Java | 25 |
| Dependencies（右上 ADD DEPENDENCIES） | Spring Web、Spring Data JPA、PostgreSQL Driver、Validation、Flyway Migration、Docker Compose Support、Testcontainers |

按 **GENERATE** 下載 zip，解壓縮後把資料夾改名成 `backend`，放到專案根目錄。

同樣設定的指令版（結果相同，擇一即可）：

```bash
# 專案根目錄下
curl https://start.spring.io/starter.zip \
  -d type=maven-project \
  -d javaVersion=25 \
  -d groupId=io.github.pelletfrog \
  -d artifactId=vitals-api \
  -d name=vitals-api \
  -d packageName=io.github.pelletfrog.vitals \
  -d configurationFileFormat=yaml \
  -d dependencies=web,data-jpa,postgresql,validation,flyway,docker-compose,testcontainers \
  -o backend.zip
unzip backend.zip -d backend && rm backend.zip
```

不指定 `bootVersion` 時，會用 start.spring.io 目前的預設版本（4.x）。

### 7.1 選了哪些套件

| 套件 | 用途 |
|---|---|
| `web` | 寫 REST API，內嵌 Tomcat 伺服器 |
| `data-jpa` | 用 Java 物件存取資料庫（ORM），相當於 Django ORM |
| `postgresql` | PostgreSQL 的連線驅動 |
| `validation` | 欄位驗證（`@NotBlank`、`@Past` 等） |
| `flyway` | 管理資料表變更 |
| `docker-compose` | 後端啟動時自動啟動 `compose.yaml` 裡的資料庫，並自動取得連線資訊；只在開發時生效，打包時會排除 |
| `testcontainers` | 跑測試時自動開一個臨時資料庫，跑完就刪掉；測試資料不會混進開發用的資料庫 |

**先不加 Spring Security。** 一加上去，所有 API 都會被鎖住、需要登入，會讓前面的開發卡住。等做登入功能時再加。

### 7.2 產生了什麼

```
backend/
├── mvnw、mvnw.cmd                  ← Maven Wrapper（Mac 用 mvnw）
├── .mvn/                           ← Maven Wrapper 的設定
├── pom.xml                         ← 套件清單與建置設定
├── HELP.md                         ← 官方說明連結，可以刪掉
└── src/
    ├── main/
    │   ├── java/io/github/pelletfrog/vitals/
    │   │   └── VitalsApiApplication.java   ← 程式進入點（@SpringBootApplication）
    │   └── resources/
    │       └── application.yaml            ← 設定檔
    └── test/java/io/github/pelletfrog/vitals/
        └── VitalsApiApplicationTests.java  ← 確認應用程式能啟動的測試
```

**所有程式都要放在 `io.github.pelletfrog.vitals` 底下**，否則 Spring 掃描不到。

因為勾了 Docker Compose Support 和 Testcontainers，還會多產生幾個檔案，要調整：

| 檔案 | 處理 |
|---|---|
| `backend/compose.yaml` | **刪掉**。資料庫統一用專案根目錄的 `compose.yaml`，這份是範例，帳號密碼還直接寫在檔案裡 |
| `src/test/java/.../TestVitalsApiApplication.java` | **刪掉**。它是「用 Testcontainers 啟動後端」的另一種開發方式，這個專案用 Docker Compose |
| `src/test/java/.../TestcontainersConfiguration.java` | 保留，把 `postgres:latest` 改成 `postgres:18`，和 `compose.yaml` 用同一個版本 |

## 8. 用 Docker 跑資料庫

資料庫的設定在專案根目錄的 `compose.yaml`，帳號密碼在 `.env`（不進 git）。第一次使用先從範本複製：

```bash
cp .env.example .env
```

之後啟動後端時，Spring Boot 會自動啟動資料庫（第 9 節設定），不用自己下指令。
想先確認資料庫能跑，也可以手動啟動：

```bash
docker compose up -d
docker compose ps          # db 的 STATUS 顯示 healthy 就成功
```

## 9. 後端設定檔

把 `backend/src/main/resources/application.yaml` 改成：

```yaml
spring:
  application:
    name: vitals-api
  docker:
    compose:
      # 從 backend/ 啟動，compose.yaml 在上一層
      file: ../compose.yaml
      # 後端停掉時資料庫繼續跑，重啟後端不用等資料庫重新啟動
      lifecycle-management: start-only
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
    show-sql: true
```

這裡**不寫資料庫的網址、帳號、密碼**：

- 本機：Docker Compose Support 會讀 `compose.yaml`，從資料庫容器的設定（也就是 `.env` 的值）自動取得連線資訊。帳號密碼只存在 `.env` 一個地方。
- dev 環境（EC2）：用環境變數 `SPRING_DATASOURCE_URL`、`SPRING_DATASOURCE_USERNAME`、`SPRING_DATASOURCE_PASSWORD` 提供，這是 Spring Boot 內建認得的名稱。

| 設定 | 意思 |
|---|---|
| `docker.compose.file` | `compose.yaml` 的位置。路徑相對於執行指令的位置，所以要在 `backend/` 底下啟動 |
| `docker.compose.lifecycle-management: start-only` | 後端啟動時自動啟動資料庫，後端停止時不關資料庫 |
| `ddl-auto: validate` | Hibernate 只檢查 Entity 和資料表是否一致，不自動改資料表；資料表由 Flyway 建立 |
| `open-in-view: false` | 資料庫連線不要一直開到畫面回應結束；Spring 預設是開著的，啟動時會出現警告 |
| `show-sql: true` | 在終端機印出 JPA 產生的 SQL，方便學習與除錯 |

再建立 Flyway 放 SQL 檔的資料夾：

```bash
mkdir -p backend/src/main/resources/db/migration
```

## 10. 第一次啟動

```bash
cd backend
./mvnw spring-boot:run
```

第一次會下載很多套件，要等幾分鐘。看到這行就是成功：

```
Tomcat started on port 8080
```

另開一個終端機測試：

```bash
curl -i http://localhost:8080
```

回 `404` 是正常的：還沒寫任何 API，但伺服器有回應。

停止：在跑 `spring-boot:run` 的終端機按 `Ctrl + C`。

跑一次測試確認環境正常（Docker Desktop 要開著）：

```bash
./mvnw test
```

測試不會用開發的資料庫，而是由 Testcontainers 另外開一個臨時的 PostgreSQL，跑完就刪掉。
設定在 `src/test/java/io/github/pelletfrog/vitals/TestcontainersConfiguration.java`，需要資料庫的測試類別加上 `@Import(TestcontainersConfiguration.class)`。

## 11. 常見問題

| 狀況 | 原因與解法 |
|---|---|
| `Unable to locate a Java Runtime` | JDK 還沒裝好，或終端機沒重開。開新的終端機，再執行 `sdk current java` 確認 |
| `permission denied: ./mvnw` | 執行 `chmod +x mvnw` |
| `Connection to localhost:5432 refused` 或 Docker Compose 相關錯誤 | Docker Desktop 沒打開。打開後再啟動後端；也要確認是在 `backend/` 底下執行 |
| `port 5432 is already allocated` | 本機已經有別的 PostgreSQL 在跑（例如用 Homebrew 裝的）。先停掉它：`brew services stop postgresql` |
| `Port 8080 was already in use` | 上一次的後端還沒停。找到那個終端機按 `Ctrl + C`，或執行 `lsof -i :8080` 找出程式 |
