# dev 環境（EC2）

> 狀態：草稿｜資料庫、後端、前端都跑在 Docker，主機上的 Nginx 負責轉發與 HTTPS

## 1. 架構

```
瀏覽器 ── HTTPS ──→ Nginx（EC2 主機上，Certbot 憑證）
                     ├─ /      → frontend 容器（Next.js，127.0.0.1:3000）
                     └─ /api/*、Swagger → backend 容器（Spring Boot，127.0.0.1:8080）──→ db 容器（PostgreSQL 18）
```

| 服務 | 跑在哪 | 用途 |
|---|---|---|
| Nginx | EC2 主機 | 轉發、HTTPS |
| `frontend` | Docker（`vitals-frontend`） | Next.js |
| `backend` | Docker（`vitals-backend`） | Spring Boot |
| `db` | Docker（`postgres:18`） | 資料庫 |

- 主機：Ubuntu Server 24.04 LTS（arm64），`t4g.medium`（4 GB）加 2 GB swap
- image 在 Mac 上建置，經 SSH 傳到 EC2；伺服器上沒有原始碼與 git，也不建置
- image 的 tag 是 git commit 的短 hash，伺服器上 `.env` 的 `VERSION` 決定跑哪一版
- 伺服器上的檔案都在 `~/vitals/`：`compose.yaml`（repo 的 `compose.dev.yaml`）、`.env`、`nginx.dev.conf`
- 記憶體上限：db 1 GB、backend 1 GB、frontend 512 MB，其餘留給主機，設定在 `compose.dev.yaml`
- 環境變數：伺服器上的 `.env`，意思與預設值看 `.env.example`
- 資料庫連線用 `SPRING_DATASOURCE_URL`、`SPRING_DATASOURCE_USERNAME`、`SPRING_DATASOURCE_PASSWORD`：Spring Boot 內建認得的名稱，在 `compose.dev.yaml` 裡由 `DB_*` 組成
- 安全群組只開 22（限自己的 IP）、80、443；資料庫與容器的連接埠不對外
- Swagger UI：`https://<子網域>/swagger-ui.html`，和網站一樣經過 Nginx，不另外開連接埠
- 公有 IP 是自動分配的：重新開機不變，**停止（stop）再啟動會換 IP**

## 2. 部署

指令裡的 `<子網域>`（例如 `vitals.example.com`）、`<金鑰檔>`、`<IP>`、`<email>` 換成實際的值。

### 2.1 建立 EC2

AWS Console → EC2 → Launch instance：

| 項目 | 設定 |
|---|---|
| AMI | Ubuntu Server 24.04 LTS，架構 64-bit (Arm) |
| Instance type | `t4g.medium` |
| Key pair | 新建一把，下載的 `.pem` 放到 Mac 的 `~/.ssh/` |
| Network | Auto-assign public IP：Enable |
| Security group | 新建：SSH 22 來源 My IP；HTTP 80、HTTPS 443 來源 Anywhere |
| Storage | 20 GiB gp3 |

建好後記下 Public IPv4 address。

在 Mac 上設定 SSH 別名，之後的指令都用 `vitals-dev`：

```bash
chmod 400 ~/.ssh/<金鑰檔>.pem
cat >> ~/.ssh/config <<'EOF'

Host vitals-dev
  HostName <IP>
  User ubuntu
  IdentityFile ~/.ssh/<金鑰檔>.pem
EOF
ssh vitals-dev                                # 第一次連線回答 yes
```

### 2.2 Route 53 設定子網域

Route 53 → Hosted zones → 網域 → Create record：

| 項目 | 設定 |
|---|---|
| Record name | 子網域的前綴（例如 `vitals`） |
| Record type | A |
| Value | EC2 的 Public IPv4 address |
| TTL | 300 |

```bash
dig +short <子網域>                           # Mac 上查，回傳 EC2 的 IP 才繼續 2.6
```

### 2.3 安裝主機上的工具

以下在 EC2 上執行（`ssh vitals-dev`）：

```bash
# swap：主機上其他程式用量突然變大時當緩衝，記憶體不足時才不會直接砍掉程序
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Docker：官方 apt 套件庫，見 https://docs.docker.com/engine/install/ubuntu/
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker ubuntu                # 不用 sudo 就能下 docker 指令

# Nginx、Certbot；envsubst（gettext-base）用來把子網域填進 Nginx 設定
sudo apt-get install -y nginx certbot python3-certbot-nginx gettext-base

mkdir -p ~/vitals
exit                                          # 重新登入，docker 群組才會生效
```

### 2.4 放設定檔

在 Mac 的 repo 根目錄執行：

```bash
scp .env.example vitals-dev:~/vitals/.env
scp compose.dev.yaml vitals-dev:~/vitals/compose.yaml
scp nginx.dev.conf vitals-dev:~/vitals/
```

在 EC2 上改 `.env`（`nano ~/vitals/.env`）：

| 變數 | 改成 |
|---|---|
| `DB_PASSWORD` | 隨機產生：`openssl rand -base64 24` |
| `ADMIN_USERNAME`、`ADMIN_PASSWORD`、`ADMIN_NAME` | 登入用的帳號、密碼、顯示名稱 |
| `JWT_SECRET` | 隨機產生：`openssl rand -base64 48` |
| `COOKIE_SECURE` | `true` |
| `PGADMIN_*` | 用不到，刪掉 |

```bash
chmod 600 ~/vitals/.env                       # 只有自己讀得到密碼
```

### 2.5 建置並傳送 image

在 Mac 的 repo 根目錄執行；先 commit 再部署，版本號才對得到程式碼：

```bash
V=$(git rev-parse --short HEAD)
docker build --platform linux/arm64 -t vitals-backend:$V backend
docker build --platform linux/arm64 -t vitals-frontend:$V frontend
docker save vitals-backend:$V vitals-frontend:$V | gzip | ssh vitals-dev 'gunzip | docker load'
ssh vitals-dev "cd ~/vitals && sed -i 's/^VERSION=.*/VERSION=$V/' .env && docker compose up -d"
```

```bash
ssh vitals-dev 'cd ~/vitals && docker compose ps'   # 三個服務都是 Up、db 是 healthy
ssh vitals-dev 'curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/api/auth/me'   # 401 表示後端已啟動
```

### 2.6 Nginx 與 HTTPS

在 EC2 上執行：

```bash
export DOMAIN=<子網域>                         # 要 export，envsubst 才讀得到
envsubst '${DOMAIN}' < ~/vitals/nginx.dev.conf | sudo tee /etc/nginx/sites-available/vitals > /dev/null
sudo ln -s /etc/nginx/sites-available/vitals /etc/nginx/sites-enabled/vitals
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 申請憑證，並自動加上 HTTPS 與 HTTP 轉 HTTPS
sudo certbot --nginx -d $DOMAIN --redirect -m <email> --agree-tos -n
sudo certbot renew --dry-run                  # 確認自動續約可以成功；續約由 apt 安裝的 systemd timer 執行
```

開 `https://<子網域>`，用 `.env` 的 `ADMIN_USERNAME`、`ADMIN_PASSWORD` 登入；Swagger UI 開 `https://<子網域>/swagger-ui.html`。

### 2.7 更新版本

commit 後在 Mac 上重跑 2.5。另外：

- 有改到 `compose.dev.yaml`：先重跑 2.4 的 `scp compose.dev.yaml`
- 有改到 `nginx.dev.conf`：先重跑 2.4 的 `scp nginx.dev.conf`，再重跑 2.6；Certbot 會沿用已申請的憑證
- `.env.example` 有新增變數：自己補進伺服器上的 `.env`

退回上一版：

```bash
ssh vitals-dev 'docker images vitals-backend'       # 看伺服器上有哪些版本
ssh vitals-dev "cd ~/vitals && sed -i 's/^VERSION=.*/VERSION=<上一版的 hash>/' .env && docker compose up -d"
```

## 3. 常用操作

以下在 EC2 的 `~/vitals/` 執行：

```bash
docker compose logs -f backend                # 看 log；frontend、db 同理
docker compose restart backend                # 重啟服務
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'   # 進資料庫

# 備份資料庫，再從 Mac 抓回來：scp vitals-dev:~/vitals/backup-*.sql.gz .
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > backup-$(date +%F).sql.gz

docker image prune -a                         # 清掉沒有在跑的 image，磁碟快滿時用；舊版本也會刪掉，就不能退回
```

不用了就收掉：EC2 → Terminate instance（資料一起刪除，要留就先備份），再刪掉 Route 53 的 A 紀錄。

## 4. 常見問題

<!-- 實際部署遇到的問題再補 -->
