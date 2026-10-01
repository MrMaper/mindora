# Mindora — deferred / later work

Features intentionally **not** implemented yet. Do not start these unless the product owner asks.

## Vocab from papers + AI (deferred)

**Goal:** Extract academic terms from a doc / DocSource (and later PDF text) → review UI → `LangCard`s, with optional AI glosses (FA/EN).

**Do not implement now.** PDF → quote annotator already shipped; this builds on that later.

### Planned phases

#### Phase A — No AI (foundation)
- Extract text from `doc.contentText` and/or PDF.js `getTextContent()`
- Candidate terms: EN frequency + stopwords; optional multi-word academic phrases
- Review UI: checkbox list (front / empty back / example from surrounding sentence)
- Persist via batch `LangCard` create with tags `doc:{id}` / `source:{id}` and language `projectId`
- Entry points: docs side panel + research library — “استخراج واژگان”

#### Phase B — AI gloss
- Provider TBD (OpenAI / OpenRouter / Anthropic) via `AI_API_KEY` in `.env`
- Server action e.g. `extractVocabWithAiAction({ text, targetLang, max })`
- Strict JSON output: `{ front, back, example, difficulty }`
- Token caps; send selected text / page window only — never log full PDFs
- UX: “پیشنهاد AI” on the same review list; user edits before save
- Fallback to Phase A if no API key

#### Phase C — Research quality
- Domain-aware glosses (PhD / CS context from doc area)
- Dedup against existing cards (normalized `front`)
- “Build vocab from this quote” (reuse PDF annotator selection)
- Deck key `from-papers` in catalog-meta
- Optional streaming suggestions

#### Phase D — Optional later
- OCR for scanned PDFs
- Batch across multiple sources in one research project
- Initial SRS difficulty from model score

### Open decisions (before Phase B)
1. Which LLM provider?
2. Who owns the API key / billing?
3. Default `back` language: always FA, or bilingual?

### Related shipped work
- In-app PDF text select → `DocQuote` (`src/components/docs/pdf-annotator-dialog.tsx`)

---

## Areas & paths hub (shipped)

Overview at `/projects` + area dashboard at `/projects/areas/[area]`:
- Compact empty cards + desktop **2×2** grid; DnD paths within and across areas; area reorder via menu
- `Project.pinned` / `sortOrder`; pinned strip on hub
- `UserAreaPreference`: color, icon, sortOrder, archived (per user, four fixed areas)
- Path statuses: ACTIVE / PLANNED / ON_HOLD / COMPLETED / ARCHIVED
- Area menu: open dashboard, edit, cycle color/icon, move up/down, archive area
- Related-space links + shared `AREA_VISUAL`; progress / next action from tasks

### Still deferred
1. **Custom areas** beyond the four defaults (+ حوزه as a 5th LifeArea)
2. Manual next-action override (derived from open tasks today)

Isolation note: Today focus/priority pickers must compose ownership with `AND` (never overwrite `OR`); see `personalLifeTaskWhere` in `src/lib/task-access.ts`.

---

## Mobile UX (in progress)

Goal: every member surface is usable one-handed on a phone — no clipped filters, no desktop-only tables, drawers that fit the screen, calendar that doesn’t force a huge empty scroll.

### Shipped in this pass
- App shell: larger menu/search targets, safe-area padding
- Drawers: full width on small screens
- Board + task filters: stack into a 1/2-column grid
- Tasks: card rows on phones; table from `md` up
- **Projects list:** card rows on phones; table from `md` up
- Calendar: day view default on narrow screens; week/day hour grids; conflict badges; minute snap drag + resize duration (preview live, save on pointerup); TouchSensor
- Calendar hydration: SSR always starts in month view (no `matchMedia` in `useState`); `initialTodayKey` from the server; client syncs local midnight after mount
- Menu triggers: Base UI `render` merges into IconButton so menus are not nested `<button>`s
- Schedule math covered by `src/lib/calendar-schedule.test.ts` (snap, conflicts, clock parse, clamp)
- Language hub tabs: horizontal scroll instead of wrapping
- Today week strip: tighter type on small screens
- Review / work-logs / settings / notifications / project tabs: overflow and wrap fixes
- Settings is the single place for profile, password, notifications, theme, and language. `/profile` redirects to `/settings?tab=profile`. Theme applies only when the user changes it (plus a boot script from saved prefs) so opening Settings does not flip light/dark.
- Settings UI: grouped notifications (general / task events / reminder channels), sprint prefs hidden from the member UI, theme cards with mini preview, copyable Bale link code, PageHeaderBar + shared form controls.
- Guide + CAPTURE updated for hour-grid calendar behavior

### Still to do (polish)
1. Pass each page in a real phone viewport and fix leftover horizontal scroll
2. ~~Users admin table card rows (if admins use phones)~~ — shipped (card list under `md`)

### Admin panel (shipped)
- `/admin` overview: online/login stats, Bale health, recent logins
- Login history (`UserLoginEvent`) + presence fields
- Force logout / deactivate bumps `sessionVersion` (JWT invalidation)
- Users table: desktop grid + mobile cards; presence columns
- Admin audit log (create/deactivate/modules/password/broadcast/plan)
- System broadcast (in-app + email) with audience filters
- System health: migrations, disk, S3/SMTP, cron heartbeat, storage ledger usage
- Login lock after 5 failed attempts (15 min) + admin unlock
- Plan/quota (`SystemSettings`: personal/team/custom) with member cap on create

### Shipped later in mobile polish
- Docs editor: secondary toolbar tools behind a ⋯ menu on xs
- Research: pipeline aside collapsed under a disclosure on phone; library secondary actions in a menu; tighter board columns

### Reminders (shipped)
- Day buckets (overdue / today / approaching) + **timed** reminders (~15 min before clock dues)
- In-app + Bale (when linked) + optional browser Notification while shell is open
- Cron `/api/cron/deadline-reminders` should run every 5–10 minutes (not only daily)
- Optional **batch deadline reminders** (`UserPreferences.batchDeadlineReminders`, off by default) merges same-day deadline alerts into one notification; timed reminders stay per-task

---

## Known relationship / auth bugs (audit 2026-09-30)

**Status: fixed** (auth IDOR including comment/attachment, hub planning, capture research path, research sync, recurrence spawn, waitingOn on board moves, path-delete rehome, Bale digest ownership, Bale DONE sync, capture research rollback, doc area→bucket, series ownership). Re-open only if a regression shows up.

---

## Other known later items (not this doc’s focus)

- Universal Capture stays on the local rules in `docs/CAPTURE.md`. Do not add an LLM parser unless asked.

- Stronger citations (CSL / BibTeX pack / Zotero) — R2
- External calendar ICS sync — LF2
- Orphan admin routes cleanup (users / teams / reporting)
- Offline vocab PWA

## Performance (shipped pass)

- Personal area buckets: existence check before upserts (no 8 writes per navigation once set up)
- Session + module flags + planning sync deduped with `React.cache` per RSC request
- Planning sync: `findFirst` then `updateMany` only when rows need change
- Today attention queries skip language/research DB work when those modules are off
- `getLabels()` no longer counts tasks on every picker load
- Command palette loads on first Ctrl/Cmd+K (not in the initial shell bundle)
- Task create/edit/label/delete drawers are `next/dynamic`
- Broader `optimizePackageImports` (Radix extras, recharts, jalaali-js)
- Tab switches: `(dashboard)/loading.tsx` skeleton; workspace ensure cached ~30m via `unstable_cache`; layout warms workspace in parallel; Today reminders via `after()`; `experimental.staleTimes` for soft-nav revisit
- Soft-nav lag is mostly RSC round-trip (not client JS); skeleton makes it feel instant while the page streams

## Research continuity (shipped)

- Due-date planning sync / create-update no longer remaps PhD/Language pipeline stages
- `DocSource.projectId` + path library binders (index-only; filtered from Writing/cite/Today)
- Per-paper source notes; add-source creates note + reading card + DocTask by default (status-aligned; no binder hop)
- Explicit link: library → card (`linkSourceToTask` replaces prior card), card → attach source
- Reading toggle auto-promotes binder hosts + ensures a card so sync is never inert
- Citations/quotes reference canonical sources (no DocSource fork); quotes promote off binder first
- Quote → draft insert from library + PDF annotator «بریز در پیش‌نویس» (empty-draft hint)
- Pipeline ↔ Doc.status ↔ readingStatus sync via DocTask links (one card per note)
- Capture: `/research` links a doc on the research-scope path cookie; `/source` or `/research`+DOI builds source + card with due; preview matches product; hub stages not remapped by due
- Writing desk: truncated resume + cite-from-here opens library cite panel
- Path required when library scope=all; binders filtered from Writing/cite/Today
- Research tabs in URL (`?tab=library|writing`); Today chips for sources + drafts
