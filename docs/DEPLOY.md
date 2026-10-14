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

## 6. Backup, restore, rollback

The container runs `prisma migrate deploy` on every start (`docker-entrypoint.sh`, 10 retries, then exit). Take a dump **before** any deploy that includes a migration or a backfill script.

### Backup

```bash
cd /opt/mindora
mkdir -p backups
docker compose exec -T db pg_dump -U "${POSTGRES_USER:-mindora}" "${POSTGRES_DB:-mindora}" \
  | gzip > "backups/mindora-$(date +%F-%H%M).sql.gz"
ls -lh backups | tail -n 3
```

Check that the new file is not tiny, and copy it off the server (the Postgres volume `mindora_pgdata` is on the same disk).

### Restore

Stop the app first so nothing writes during the restore:

```bash
cd /opt/mindora
docker compose stop app cron
docker compose exec -T db psql -U "${POSTGRES_USER:-mindora}" -d postgres \
  -c "DROP DATABASE IF EXISTS ${POSTGRES_DB:-mindora};" \
  -c "CREATE DATABASE ${POSTGRES_DB:-mindora};"
gunzip -c backups/<file>.sql.gz | docker compose exec -T db psql -U "${POSTGRES_USER:-mindora}" -d "${POSTGRES_DB:-mindora}"
docker compose start app cron
```

### Rollback

Migrations for the areas redesign are additive, so the previous build still runs on the new schema. To roll the code back:

```bash
cd /opt/mindora
git log --oneline -n 10          # pick the previous good commit
git checkout <commit>
docker compose up -d --build
```

Restore the database from a dump only if data was damaged. Destructive changes (dropping legacy area columns) happen only in the final cleanup phase described in [`AREAS.md`](./AREAS.md), after a soak period and with a fresh dump.

### Backfill scripts

Backfills are separate, idempotent scripts, not migrations. Run them by hand after the migration is deployed and before reads are switched, then run the matching verification script:

```bash
docker compose exec app npx tsx scripts/areas/backfill-modules.ts
docker compose exec app npx tsx scripts/areas/verify-areas.ts
```

The first one (`backfill-modules.ts`, areas phase P0) makes every existing member's module policy explicit; run it with `--dry` first to see the count. Invite links need `NEXT_PUBLIC_APP_URL` to be your public origin when SMTP is configured; without SMTP the admin copies the link from the UI.

Each script can be re-run safely. A non-zero exit from `verify-areas.ts` means do not proceed to the next phase.

## Notes

- Change default seed admin passwords after first login.
- Never commit `.env`.
- Bale bot settings live in the admin page «ربات بله» (`/bale-bot`). Until that row is saved, `BALE_BOT_TOKEN`, `BALE_BASE_URL`, `BALE_ADMIN_CHAT_ID`, and `BALE_CHANNELS_TASKS` still apply. Linking a member needs the code shown under Settings → Profile. Set `CRON_SECRET` so the Compose `cron` sidecar can call `/api/cron/deadline-reminders` every 5 minutes (deadlines, vocab nudges, Bale morning brief / habit nudge). Optional `BALE_WEBHOOK_SECRET` is registered with `setWebhook` and checked on inbound updates. Container start registers the webhook only while the bot is on and a public URL is set; a Bale outage does not stop the app. Do not put tokens in docs or the client.
- Old `nazarbin-net` external network is no longer required.
