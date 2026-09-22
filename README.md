# Mindora

Personal life OS for tasks, research writing, and language practice — with Jalali calendar, Docs, and a kanban board.

**Think. Plan. Grow**

## Stack

- **Next.js** (App Router) + React 19
- **Prisma** + PostgreSQL
- **NextAuth** (credentials)
- **TipTap** docs editor
- Optional: **S3** attachments, **SMTP** email, **Bale** bot

## Setup

```bash
npm install
cp .env.example .env   # if present; otherwise set DATABASE_URL and AUTH_SECRET
npx prisma migrate deploy
npx prisma db seed     # optional demo/admin
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run db:migrate` | Prisma migrate (dev) |
| `npm run db:generate` | Generate Prisma client |

## Product map

- **Today** — due / focus / capture / habits / Pomodoro
- **Kanban & Tasks** — board with REVIEW/TESTING columns
- **Calendar** — Jalali planning
- **Docs** — writing, folders, versions, sources + PDF
- **Research** — PhD pipeline + source library
- **Language** — vocab SRS, listening, exams
- **Review / Work logs** — weekly reflection

## Auth & roles

First admin is typically created via seed. Notification preferences (in-app, email, per-event including sprint) live under **Settings**. Mentions in task comments create `MENTION` notifications.

## CI

GitHub Actions runs lint, `tsc`, and unit tests on push/PR to `main`/`master`.
