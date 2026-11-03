# 部署到 AWS

> 狀態：草稿

## 1. 架構

見 [architecture.md](architecture.md) §3.2。EC2（Ubuntu）主機上裝 Nginx 與 Certbot；資料庫、後端、前端用 `compose.prod.yaml` 跑在 Docker。

## 2. 事前準備

1. EC2 綁定 **Elastic IP**
2. 網域 DNS 設 A 紀錄 `vitals.<網域>` → Elastic IP（提早設定，等待生效）
3. 安全群組只開 22（限自己的 IP）、80、443；5432 不對外
4. AWS 設定帳單警示

## 3. 第一次部署

1. 先在本機跑一次 `compose.prod.yaml`，確認 image 能正常運作
2. `compose.prod.yaml` 的 port 只綁 `127.0.0.1:8080`、`127.0.0.1:3000`，只讓 Nginx 連得到
3. 後端用多階段 Dockerfile：Maven 編譯 → `eclipse-temurin:25-jre` 執行

## 4. Nginx 與 HTTPS

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

```nginx
server {
    server_name vitals.<網域>;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}
```

1. `sudo certbot --nginx -d vitals.<網域>`：會自動加上 443 與 80→443 轉址，前後用 diff 看它改了什麼
2. `sudo certbot renew --dry-run`：測試自動續期

## 5. 更新部署

```bash
docker compose -f compose.prod.yaml up -d --build
```

## 6. 注意事項

- **不要執行 `docker compose down -v`**：`-v` 會刪掉 volume，資料庫裡的資料會全部消失
