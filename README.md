# Mindora

**Think. Plan. Grow**

Personal life OS for planning work, research writing, language practice, and daily habits — with Jalali calendar, rich docs, and a kanban board.

<p align="center">
  <img src="public/logo.png" alt="Mindora" width="96" />
</p>

## Features

| Area | What you get |
|------|----------------|
| **Today** | Due items, focus, quick capture, habits, Pomodoro |
| **Kanban & Tasks** | Board with REVIEW / TESTING columns, assignees, labels, work logs |
| **Calendar** | Jalali (Persian) planning |
| **Docs** | TipTap editor, folders, versions, sources, export |
| **Research** | PhD-oriented writing pipeline + source library |
| **Language** | Vocab SRS, listening clips, exam tracks / mocks |
| **Review** | Weekly reflection and work-log insights |
| **Teams / Projects** | Multi-project namespaces (life areas: PhD, Work, Life, Lang) |
| **Notifications** | In-app + optional email; Bale bot linking |

Default UI language is Persian (FA), with English available.

## Stack

- **Next.js 16** (App Router) + **React 19** + TypeScript
- **Prisma 7** + **PostgreSQL**
- **Auth.js / NextAuth** (credentials)
- **TipTap** for docs
- **Tailwind CSS 4**
- Optional: **S3-compatible** storage, **SMTP**, **Bale** bot

## Requirements

- Node.js **20+**
- PostgreSQL **16/17**
- npm

## Quick start

```bash
git clone https://github.com/MrMaper/mindora.git
cd mindora
npm install
cp .env.example .env
```

Edit `.env` (minimum):

```env
AUTH_SECRET=          # openssl rand -base64 32
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/mindora?schema=public
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Then:

```bash
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default seed account

| Role | Email | Password |
|------|--------|----------|
| System admin | `admin@mindora.app` | `Admin@1234` |

Override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` if needed. **Change these in production** (Profile → Change password). There is only one system admin; members are created from the Users page with per-user module toggles.

## Environment variables

| Variable | Required | Notes |
|----------|----------|--------|
| `AUTH_SECRET` | Yes | Session signing secret |
| `DATABASE_URL` | Yes | Postgres connection string |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL (auth callbacks, links) |
| `POSTGRES_*` / `DB_HOST` / `DB_PORT` | Docker | Used by `docker-compose` to build `DATABASE_URL` |
| `SMTP_*` | No | If unset, emails log to console in development |
| `S3_*` | No | Attachments / doc source files |
| `BALE_*` / `APP_URL` | No | Bale bot + webhook (`APP_URL` for production webhook) |
| `DISABLE_DB_SEED` | No | Set `1` in production after first deploy to skip seed |

See `.env.example` for the full list.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:seed` | Seed roles, admin, sample data |
| `npm run db:studio` | Prisma Studio |
| `npm run bale:set-webhook` | Register Bale webhook |

## Docker

Self-contained stack: **Postgres + app** (no external Docker network required).

```bash
cp .env.production.example .env
# set AUTH_SECRET, POSTGRES_PASSWORD, NEXT_PUBLIC_APP_URL, APP_URL

docker compose up -d --build
```

App: host port **3080**. Entrypoint runs `prisma migrate deploy`, optional seed, then `npm start`.

First deploy seed:

```env
DISABLE_DB_SEED=0
```

Then set `DISABLE_DB_SEED=1` for subsequent restarts.

Full VPS + Nginx/HTTPS steps: [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Deploy checklist (VPS)

1. Clone this repo on the server  
2. Configure `.env` with real `AUTH_SECRET`, DB, and `NEXT_PUBLIC_APP_URL` / `APP_URL`  
3. Provide PostgreSQL (same host or managed)  
4. `docker compose up -d --build` **or** `npm run build && npm start`  
5. Put Nginx/Caddy in front with HTTPS → app port (`3000` or `3080`)  
6. Minimum sizing: ~**2 GB RAM**, 1–2 vCPU, 20 GB disk  

## Auth & roles

- Credentials login via NextAuth  
- Seed creates admin users and default roles (`ADMINISTRATOR`, `TEAM_LEAD`, `MEMBER`)  
- Notification preferences (in-app / email / events) live under **Settings**  
- `@mentions` in task comments create `MENTION` notifications  

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main` / `master`:

- ESLint  
- Typecheck (`tsc`)  
- Unit tests (Vitest)  

## Project layout (high level)

```
src/app/           # App Router pages & API routes
src/features/      # Domain actions & queries
src/components/    # UI (docs, language, life, …)
prisma/            # Schema, migrations, seed
public/            # Static assets (logo, favicons)
docs/              # Product notes & deferred roadmap
```

## Deferred work

Planned but **not** started yet (including vocab-from-papers + AI): see [`docs/ROADMAP.md`](docs/ROADMAP.md).

## License

Private repository — all rights reserved unless otherwise stated.
