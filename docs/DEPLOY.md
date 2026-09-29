# Mindora — deploy on VPS (Docker)

Domain example: `https://mindoraos.ir`  
App listens on host port **3080**.

## 1. Server prerequisites

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git nginx certbot python3-certbot-nginx
sudo usermod -aG docker "$USER"   # re-login after
```

## 2. Clone & configure

```bash
sudo mkdir -p /opt/mindora
sudo chown "$USER":"$USER" /opt/mindora
cd /opt/mindora
git clone https://github.com/MrMaper/mindora.git .
cp .env.production.example .env
nano .env   # set AUTH_SECRET, POSTGRES_PASSWORD, URLs
```

Generate secrets:

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -base64 24   # POSTGRES_PASSWORD
```

First boot only — allow seed once:

```env
DISABLE_DB_SEED=0
```

After first successful start, set `DISABLE_DB_SEED=1` and recreate the app container.

## 3. Build & run

```bash
cd /opt/mindora
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Postgres is included (`mindora-db`). Data volume: `mindora_pgdata`.

## 4. Nginx + HTTPS

```nginx
server {
  listen 80;
  server_name mindoraos.ir www.mindoraos.ir;
  location / {
    proxy_pass http://127.0.0.1:3080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/mindora /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d mindoraos.ir -d www.mindoraos.ir
```

## 5. Updates

```bash
cd /opt/mindora
git pull
docker compose up -d --build
```

## Notes

- Change default seed admin passwords after first login.
- Never commit `.env`.
- Bale bot settings live in the admin page «ربات بله» (`/bale-bot`). Until that row is saved, `BALE_BOT_TOKEN`, `BALE_BASE_URL`, `BALE_ADMIN_CHAT_ID`, and `BALE_CHANNELS_TASKS` still apply. Linking a member needs the code shown under Settings → Profile. The daily cron also sends the morning brief and habit nudge once the member’s hour has passed. Container start registers the webhook only while the bot is on and a public URL is set; a Bale outage does not stop the app. Do not put the token in docs or the client.
- Old `nazarbin-net` external network is no longer required.
