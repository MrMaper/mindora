# Mindora — Areas, modules, access, and first-run

**Status:** Design source of truth, version 2. **P0 is implemented and committed; P1 is implemented (uncommitted)** (see "Implementation status" below); P2–P7 are not started.
**Rule:** Build only the phase the product owner names. Each phase below is shippable on its own.

### Implementation status

| Phase | State |
|---|---|
| P0 Foundation | Committed (`781a6e9`), not deployed. Local dev DB migrated, backfilled, and `verify-areas.ts` green. |
| P1 Helper seam | Done in code, not committed. Server/logic code is fully migrated; 14 UI files remain on an ESLint baseline (see below). |
| P2 – P7, S-track | Not started |

**P1 as built (differences from the text below):**

- `src/lib/areas/` is the seam. `legacy.ts` is the only non-test file that holds the `PHD|WORK|LIFE|LANG` literals (`LIFE_AREAS`, `DEFAULT_AREA`, `RESEARCH_AREA`, `LANGUAGE_AREA`, `WORK_AREA`, `HUB_AREAS`, `WORKSPACE_AREAS`, `AREA_META`, `AREA_ORDER`, `emptyAreaCounts`, `coerceLifeArea`, `isLifeAreaValue`). `buckets.ts` holds the bucket-id helpers, `hub.ts` the predicates and Prisma fragments (`isHubArea`, `isResearchArea`, `isLanguageArea`, `isHubTask`, `resolveTaskArea`, `taskAreaOrNull`, `hubTaskExclusion`, `areaWhere`, `researchTaskWhere`, `languageTaskWhere`). `member-context.ts` holds the pure `buildMemberContext` / `buildAreaRefs`.
- Two entry points: `@/lib/areas` is pure and safe for client components. `@/lib/areas/server` adds `getMemberContext` (React.cache'd), `listUserAreas`, `ensureDefaultArea` (today an alias of `ensurePersonalWorkspace`), and `getEffectiveFlagsForUser`.
- `src/lib/life.ts`, `project-namespace.ts`, `area-projects.ts` and `features/life/workspace.ts` re-export from the seam, so old imports still work. Nothing moved behavior: `hubTaskExclusion()` is byte-for-byte the old `taskWhereExcludeHub()` fragment (a test checks `isHubTask` against it).
- Hub identity is still static (`RESEARCH_AREA = "PHD"`, `LANGUAGE_AREA = "LANG"`) and does not look at module flags. The `ctx`-aware versions (`MemberContext.hubAreas`, flags) arrive in P6. `AreaRef.id` is the enum value today and must be treated as opaque; it becomes a `UserArea` id in P4.
- Lint: `eslint.config.mjs` forbids the four literals (as strings, object keys, and `X.PHD` members) in `src/**`, except `src/lib/areas/**` and tests. The 14 UI files that still switch on literals (label chains, visual maps, calendar/habits/focus components) are listed in `eslint.area-baseline.mjs`. P5 removes them; the list may only shrink.
- `ensurePersonalWorkspace` and the request-cache wrapper still create four bucket projects per member. Reshaping that into "one default area" is P4.

**P0 as built (differences from the text below):**

- Migration `20261014160000_module_policy_provisioning` is additive (no backfill). Until `backfill-modules.ts` runs, a missing policy key falls back to the legacy `enabledModules` flag at read time, so behavior is identical either way.
- Resolution and presets live in `src/lib/modules.ts` (unit-tested in `modules.test.ts`, including backfill equivalence). The guard lives in `src/lib/module-guard.ts`: `getModuleAccess`, `getEffectiveFlagsForUser`, `assertModule`, `moduleGuardError`, and `authForModule` (a drop-in for `auth()` in module actions).
- Guarded: all research, language, habits and work-log server actions; `createDoc` (Docs, and Research for PHD docs); reporting export; per-task work-log API; `/api/search` (omits disabled modules); vocab reminders; Bale digest and habit nudge. Capture already read effective flags.
- Disabled module pages redirect to `/module-disabled` (two variants) instead of redirecting silently.
- Member Capabilities tab (S-1) was pulled forward into P0, because Starter has `member_choice` modules that need a UI. `uiProfile` and the `uiProfile` system defaults stay in P2.
- Admin create form: blank password means a one-time invite link (`/accept-invite`, 7 days, `PasswordResetToken.purpose = INVITE`); a filled password is a temporary password with `mustChangePassword`. Temporary passwords are no longer logged or emailed. New members get the system default preset (Starter).
- Forced password change is enforced where the dashboard layout renders (every member page). It does not block a direct server-action call made with a valid session.
- Admin can issue a new invite link or a new temporary password per member; module policy changes notify the member in-app and are audited.
- Not guarded yet (later phases touch these anyway): kanban/projects/calendar actions (derived from `tasks`), Bale reply handlers (they go through Capture).
**Language:** Structure in English; user-facing copy in Persian (FA) with English (EN) where it matters.
**Related docs:** [`CAPTURE.md`](./CAPTURE.md), [`TODAY.md`](./TODAY.md), [`BOARD.md`](./BOARD.md), [`DEPLOY.md`](./DEPLOY.md), [`ROADMAP.md`](./ROADMAP.md).

---

## 0. How to read this document

| If you want… | Read |
|---|---|
| The decisions and why | §1–§5 |
| What the user sees and when | §6, §15 |
| Who can turn what on or off | §7 |
| How accounts are created | §8 |
| Tables, fields, invariants | §9 |
| How Research/Language attach to an area | §10 |
| Shared projects | §11 |
| Create/merge/archive/delete area rules | §12 |
| The code seam that makes migration safe | §13 |
| Per-surface changes and acceptance criteria | §14–§15 |
| Rollout safety and tests | §18–§19 |
| Build order | §20 |

---

## 1. Executive summary

Mindora started as one person’s system, and that is visible in the product. Four fixed life areas (`PHD`, `WORK`, `LIFE`, `LANG`) do three jobs at once:

1. They are a **personal filing system** (work vs home).
2. They are **navigation and filters** (`/projects/areas/phd`, calendar chips, capture chips).
3. They are a **capability lock** (Research is the PhD area; Language is the LANG area).

A person who does not study for a PhD still lands in a world built around it. A new user also meets a dense sidebar, undefined words (حوزه، مسیر، اینباکس، پایپلاین), and a power-user Today page before they have written a single task.

**Target model**

| Concept | Meaning | Owner |
|---|---|---|
| **Area (حوزه / قسمت زندگی)** | A personal life bucket the member names | Each member |
| **Path (مسیر / پروژه)** | Optional project inside one area | Creator and path members |
| **Module** | A product capability (`research`, `language`, …) | Admin policy, narrowed by the member |
| **Hub area** | The one area a specialized hub (Research or Language) operates on | System, on enabling the module |

**Three things change at once, in this order of importance**

1. **First-run:** value in under 60 seconds, structure second, power later (§6).
2. **Access:** the admin has full control; the member may narrow only what the admin allowed (§7).
3. **Data:** areas become per-member rows; Research and Language stop depending on area names (§9–§10).

---

## 2. Product context and persona

### 2.1 Positioning

- **Today:** invite-only. One system admin creates members (`createUser`), up to `SystemSettings.maxActiveMembers` (default 25).
- **Later:** public self-serve sign-up. The architecture must be sign-up-ready now (§8, §22), but the sign-up page itself is a later track.

### 2.2 Primary persona (design target)

A Persian-speaking adult who wants one calm place for daily tasks across work, home, study, and health. They:

- know Todoist, Notion, or a paper planner, not “areas and paths”;
- use Jalali dates and Tehran time;
- want reminders in Bale;
- will leave if the first minute feels like configuration.

### 2.3 Secondary personas (opt-in, never default)

- **Researcher:** wants the Research hub (pipeline, library, writing).
- **Language learner:** wants the Language hub (sessions, vocab, listening, exams).

### 2.4 One-line value proposition (FA)

«هر روز فقط همان چیزی را ببین که امروز مهم است.»

### 2.5 Non-goals

Teams as an organization product, multi-assignee workflow, external calendar sync, AI parsing. See §21.

---

## 3. Diagnosis: how the current system is wired

Facts verified in code and schema:

- Prisma `enum LifeArea { PHD WORK LIFE LANG }` is used by `Project.area`, `Task.area`, `Habit.area`, `Doc.area`, `DocFolder.area`, `UserAreaPreference.area`. About 90 source files read `area` directly.
- `ensurePersonalWorkspace` creates one personal team and four bucket projects (`area-{phd|work|life|lang}-{userId}`). A cached existence check avoids re-upserting on every navigation, but the four buckets are always created.
- `HUB_AREAS = ["PHD","LANG"]` and `taskWhereExcludeHub()` decide which tasks are kept out of Today lists.
- Language data (`LangSession`, `LangCard`, `LangListeningClip`, `ExamTrack`, `MockAttempt`) has only `projectId`; the language hub filters by `project.area = LANG`.
- Research is wired to `area: "PHD"` in `src/features/research/**`, sync rules, and the `phd-library:` doc system key.
- Modules live in `User.enabledModules` (JSON, default `{}`) and are edited only by the admin. `parseModuleFlags` fills missing keys from `DEFAULT_MODULE_FLAGS` (all `true`), so changing defaults silently changes existing users whose JSON is missing keys.
- Module gating happens in pages (`requireModule`) and in `capture/actions`. Server actions in research, language, docs, habits, work-logs and reporting do not check it.
- `requireModule` redirects silently to `memberHomePath`.
- `OnboardingTour` is a read-only five-step modal that lists the four fixed areas, then promotes Language and Research. “Skip” only sets `onboardingCompletedAt`.
- Accounts are created by the admin with a temporary password. There is no forced change on first login. When SMTP is not configured, `createUser` writes the temporary password to the server log.
- `docker-entrypoint.sh` runs `prisma migrate deploy` on every container start (10 retries, then exit). `docs/DEPLOY.md` has no backup, restore, or rollback section.
- Tests: 11 vitest files (pure logic only). No database tests and no end-to-end tests.

### 3.1 Why this fails a general audience

1. Renaming “PhD” does not remove Research, because Research is coded to `PHD`.
2. Defaults turn Research and Language on for everyone, and onboarding advertises both.
3. Four fixed areas are too many for some people and too few for others.
4. `UserAreaPreference` is a half-migration: color, icon, and archive exist, but the enum and URLs stay fixed.
5. Skipping onboarding changes nothing visible.
6. Today is a power dashboard even when empty.

---

## 4. Locked decisions

| # | Decision |
|---|---|
| D1 | Areas are per-member rows (`UserArea`), not a global enum, as the end state. |
| D2 | Templates only suggest names. They never grant capabilities. |
| D3 | Module access is two-layer: admin policy (`off` / `on` / `member_choice`) then member preference (§7). |
| D4 | The admin has full control of every module for every member, at any time. |
| D5 | Research and Language each attach to exactly one **hub area** (`UserArea.hubFor`). The two hub areas are different areas. |
| D6 | First-run order is value → structure → power. No tour before the first task. |
| D7 | New members start with `uiProfile = starter`. Existing members are `full`. |
| D8 | Moving from starter to full is explicit and member-driven. There is no silent graduation. |
| D9 | All account creation goes through one service, `provisionMember`, so admin invites and future sign-up share it. |
| D10 | Migrations are additive and fast; backfills are separate idempotent scripts; a `pg_dump` precedes every rollout (§18). |
| D11 | A helper layer (`src/lib/areas/*`) is introduced before any schema change (§13). |
| D12 | A “fifth `LifeArea` value” is rejected permanently. |
| D13 | Capability-per-space (several Research packs on several spaces) is out of scope. Paths under the hub area cover several research lines. |
| D14 | Documentation is updated in the same phase as the behavior it describes. |

---

## 5. Hostile review summary (what this document already answers)

| Attack | Answer |
|---|---|
| “Grandfathering is a lie: defaults are filled at read time.” | P0 writes explicit policy for every existing user before any default changes (§7.6). |
| “Disabled modules still work through server actions.” | One guard for every action and API route (§7.7). |
| “The admin and the member both toggle; who wins?” | Policy ceiling from the admin, preference inside it (§7.1–§7.3). |
| “A new member’s first touch is a temp password in a log.” | Invite link, forced password set, no password logging (§8). |
| “Three representations of area already exist; you added a fourth.” | One source of truth and a 1:1 bucket (§9.3). |
| “A guest’s task will be judged by the owner’s hub binding.” | Hub is evaluated only for the viewer’s own areas (§10.2). |
| “Binding Research to ‘Work’ hides all work tasks.” | Hub areas are dedicated, distinct, never the default area (§10.3). |
| “A 90-file flag day.” | Helper seam first, behavior-preserving (§13). |
| “Day 1 hides the calendar but Capture understands dates.” | Starter Today has an «به‌زودی» section; Calendar appears with the first dated task (§15.1). |
| “Layout changes under the user’s feet.” | `uiProfile` is a visible, explicit switch (§6.5). |
| “A migration at boot can take the site down.” | Additive-only migrations, separate backfill, dump first (§18). |
| “Nothing proves it works.” | `verify-areas.ts`, golden tests, two-user manual script (§19). |

---

## 6. First-run and retention

Assume the user is in a hurry, does not know the product vocabulary, fears breaking something, and leaves if value is unclear within 30–90 seconds.

### 6.1 Why the current first-run loses people

| Time | User thinks | Today | Target |
|---|---|---|---|
| 0:00 | “Now what?” | Long tour over a dense sidebar | No tour; a calm Today with one prompt |
| 0:20 | “What is حوزه / مسیر / تمرکز?” | Jargon everywhere | One field: «الان چیکار داری؟» |
| 0:40 | “Skip” | Flag set, nothing quieter | Skip lands on the same calm shell |
| 1:00 | “Is it broken?” | Empty power widgets | One list and one action |
| 1:30 | “This looks like a command line” | `/research`, PhD chips | Plain box; slash commands later |
| 2:00 | Opens Research by accident | Alien pipeline | Entry absent unless the member enabled it |

### 6.2 Vocabulary (Day 1)

| Avoid on Day 1 | Say instead |
|---|---|
| حوزه، مسیر، اینباکس، پایپلاین، هاب، بورد | «قسمت زندگی»، «بدون تاریخ»، «بعداً»، (پروژه فقط بعداً و اختیاری) |
| دکتری، PhD، منبع، DOI | Nothing, unless Research is enabled |
| اولویت ۱–۳، تمرکز، نمودار هفته | A simple list with «انجام شد» |
| `/task` `/research` in the first hint | One sentence box |

### 6.3 Fears the product must defuse

- “A wrong choice breaks it” → every Day-1 choice is reversible; copy: «بعداً می‌توانی عوضش کنی.»
- “I must understand everything first” → write first, organize second.
- “This is for specialists” → the default identity is an ordinary person.
- “Empty means broken” → every empty state offers one next action.
- “Fake urgency” → no research or vocabulary counters on Day 1.
- “The admin gave me everything” → the invite applies the **Starter** preset (§7.4).

### 6.4 Journey

```text
Minute 0–1   Write one thing  → it appears on Today (the win)
Minute 1–2   “Which part of life?” chips → creates or reuses a UserArea
Day 1        Simple loop: list + done. Nav: Today | Tasks | Settings
Day 2–3      Yesterday’s leftover on top. Calendar appears after the first dated task
Week 1+      Member opts into more: “Show more features” or Settings → Capabilities
```

Day-1 success is “wrote one thing, saw it, did not panic”, not “understood areas”.

### 6.5 Starter and Full (`uiProfile`)

`UserPreferences.uiProfile` is `starter` or `full`.

- **New members:** `starter` (set by `provisionMember`; the system default can be changed by the admin to `full`, §8.4).
- **Existing members at migration time:** `full`.
- **Switch:** a visible control, «امکانات بیشتر نشان بده» (Today footer and Settings → Capabilities). It sets `full` and records `uiProfileChangedAt`.
- **One-time suggestion:** after the member has completed 3 tasks, Today shows a dismissible card offering the switch. It is a suggestion only; it never changes the layout by itself.
- **The admin** may set `uiProfile` for a member.
- Starter and Full are **one Today page with conditional sections**, not two layouts.

### 6.6 What each profile shows

| Surface | Starter | Full |
|---|---|---|
| Sidebar | Today, Tasks, Calendar (only once a task has a due date), Settings; plus any module the member **explicitly turned on** in Capabilities | All groups allowed by effective modules |
| Today | Capture prompt, list, «به‌زودی» (tomorrow and next days), «انجام شد» | Three priorities, focus session, week balance, queues (see `TODAY.md`) |
| Capture | One input, Enter to save | Full dialog, area chips, slash menu, guide |
| Habits | Section appears only if the member has at least one habit | Full habits panel |
| Attention chips (sources, vocab) | None | Only when the module is on and there is real data |
| Hub row | Not shown | One-line «پژوهش: N کار باز» / «زبان: N کار باز» when a hub has open tasks (§10.5) |

### 6.7 Lifecycle timestamps (funnel without third-party analytics)

Stored on `UserPreferences`, set once and never overwritten:

- `firstAreaChosenAt`
- `firstCaptureAt`
- `firstDoneAt`
- `uiProfileChangedAt`

With existing `User.createdAt`, `lastLoginAt`, `lastSeenAt`, the admin overview shows an aggregate funnel (§14, surface **S-11**): invited → first login → first capture (within 24 h) → returned on a later day → switched to full. Split by `createdVia`.

---

## 7. Module access model

### 7.1 Two layers

**Layer 1: admin policy** (per member, per module)

| State | Meaning for the member |
|---|---|
| `off` | Disabled. Hidden everywhere, including Capabilities. |
| `on` | Enabled. The member cannot turn it off. |
| `member_choice` | The admin allows it. The member decides. |

**Layer 2: member preference** (only for modules in `member_choice`)

A map `{ moduleKey: boolean }`. A missing key means the code default in `DEFAULT_MEMBER_CHOICE`:

| Module | Default when the member has not chosen |
|---|---|
| tasks | on |
| docs | on |
| projects | on |
| habits | on |
| research | off |
| language | off |
| workLogs | off |
| reporting | off |

### 7.2 Effective module resolution

```text
raw(m) = policy[m] == "off"           → false
         policy[m] == "on"            → true
         policy[m] == "member_choice" → prefs[m] ?? DEFAULT_MEMBER_CHOICE[m]

effective = apply dependencies to raw (§7.3)
```

### 7.3 Dependencies (applied after `raw`)

- `calendar`, `kanban`, `review` follow `tasks`.
- `workLogs`, `reporting` require `tasks`.
- `research` requires `docs`.
- `language` has no dependency.
- Turning a parent off shows a cascade preview in the UI («پژوهش هم خاموش می‌شود»). Turning it back on restores the dependent module to its previous preference.

### 7.4 Presets (constants in code, not a table)

| Preset | Policy |
|---|---|
| **Starter** (default for new members) | tasks, docs, projects `on`; habits, workLogs, reporting, research, language `member_choice` |
| **Full** | all `on` |
| **Custom** | the admin sets each module |

Presets exist for the create-member form, the member editor, and bulk apply.

### 7.5 Rules

1. The admin can change any member’s policy at any time. Admin changes never delete data and never delete the member’s stored preference.
2. Turning a module off hides it and blocks its actions. It never deletes data.
3. A member cannot raise a module above the policy (`off` stays off; `on` cannot be turned off).
4. The member is notified in-app when the admin changes a module policy that affects them («ادمین قابلیت «X» را فعال کرد»).
5. The admin has no access to the member’s area content and has no impersonation. The admin can reset the password, change policy, set `uiProfile`, change status, and force logout.

### 7.6 Storage and backfill (P0, step zero)

- New columns: `User.modulePolicy Json @default("{}")`, `UserPreferences.moduleMemberPrefs Json @default("{}")`.
- Legacy `User.enabledModules` stays until P7 as a **mirror** (`policy != off`), rewritten on every policy change so an older build still reads correctly.
- **Backfill (explicit, for every existing user, before any default changes):**
  - old flag `true` → policy `member_choice` and preference `true`;
  - old flag `false` → policy `off`.
- **Acceptance:** for every existing user the effective flags before and after the backfill are identical (§19.2).
- Only after the backfill is verified do the defaults and the Starter preset apply, and only to new members.

### 7.7 Enforcement

One shared guard, used by every server action, API route, cron path, and bot handler that touches a module:

- `assertModule(module)` for session-bound code.
- `getEffectiveFlagsForUser(userId)` for session-less code (cron, Bale webhook, digests, `/api/search`).

Both read the cached member context (§13.3).

**Files that must adopt the guard** (non-exhaustive, each gets an acceptance test):

- `src/features/research/actions.ts`
- `src/features/language/actions.ts`
- `src/features/docs/actions.ts` (research templates and research-only doc kinds)
- `src/features/habits/actions.ts`
- `src/features/work-logs/*`
- `src/app/api/reporting/export/route.ts`
- `src/app/api/search/route.ts` (omit docs, sources, vocab, listening when the module is off)
- `src/app/api/cron/deadline-reminders/route.ts` and the vocab/habit/digest helpers
- `src/features/external/bots/bale/*` (digest, habit nudge, reply handlers)

**When a member opens a disabled module** (replaces the silent redirect): a short explanatory page.

- Admin-off: «این قابلیت برای حساب تو فعال نشده. اگر لازمش داری از مدیر بخواه.»
- Member-off: «این قابلیت را خودت خاموش کرده‌ای.» with a «روشنش کن» button to Capabilities.

### 7.8 Member Capabilities (Settings tab)

Lists only modules whose policy is `member_choice` or `on`. For `on`, the toggle is locked with the line «مدیر این را فعال نگه داشته». For `member_choice`, a switch with a one-line plain description and the dependency hint. Includes the «امکانات بیشتر نشان بده» switch for `uiProfile`.

---

## 8. Accounts and first touch

### 8.1 `provisionMember`

A single service, called by the admin create form now and by sign-up later. It:

1. creates the user with `createdVia` (`ADMIN_INVITE` or `SELF_SIGNUP`);
2. writes `modulePolicy` from the chosen preset (or the system default for that channel);
3. creates `UserPreferences` with `uiProfile` (system default for that channel) and no `onboardingCompletedAt`;
4. creates the default area (§9.1) and its bucket;
5. returns what the caller needs to deliver the invite.

Nothing else may create members. `ensurePersonalWorkspace` is replaced by `ensureDefaultArea` (§13.2) and is no longer a per-navigation hook that creates four buckets.

### 8.2 Invite flow

- The admin create form issues a **one-time invite link** (7-day expiry). The link opens `/accept-invite?token=…`, where the person chooses their own password and is signed in.
- Implementation reuses the `PasswordResetToken` mechanism with a `purpose` column (`RESET` | `INVITE`).
- Delivery: email when SMTP is configured; otherwise the admin sees the link once in the UI and copies it.
- Temporary-password creation stays available as a fallback. It sets `mustChangePassword = true`.

### 8.3 Forced password change

- `User.mustChangePassword Boolean @default(false)`.
- Set to `true` whenever the admin sets a temporary password (create with password, `resetUserPassword`).
- While `true`, every member route redirects to `/settings?tab=security&required=1`, which explains why and offers only the change-password form.
- Cleared by `changePassword`.

### 8.4 System defaults (`SystemSettings`, editable by the admin)

- `defaultModulePresetAdmin` (default `starter`)
- `defaultModulePresetSignup` (default `starter`, used by the later sign-up track)
- `defaultUiProfileAdmin`, `defaultUiProfileSignup` (default `starter`)
- `signupEnabled` (default `false`; no sign-up page exists until the S-track)

### 8.5 Security fixes included in P0

- Remove `console.log` of temporary passwords. Show a temporary password once, in the admin UI only.
- The create-user form no longer interprets “no module fields” as “everything on”; it applies the selected preset.

### 8.6 Admin create form

Preset selector (Starter / Full / Custom). Choosing Custom reveals the per-module three-state control (§14, surface **S-8**). The default selection is the system default preset, not “all on”.

---

## 9. Data model

### 9.1 `UserArea`

| Field | Type | Notes |
|---|---|---|
| `id` | cuid | Stable; used in URLs |
| `userId` | fk, cascade | Owner |
| `name` | string | Display name |
| `nameIsDefault` | bool | `true` while the name is the untouched template name; render it in the UI language |
| `templateKey` | string? | `life` `work` `study` `research` `language` `health` `custom`; analytics and capture hints only |
| `color`, `icon` | string? | Preset key or `#hex`; IconName or emoji |
| `sortOrder` | int | |
| `archived` | bool | Hidden from pickers; data kept |
| `isDefault` | bool | Exactly one active default per member (partial unique index, raw SQL) |
| `hubFor` | enum? (`RESEARCH`, `LANGUAGE`) | Makes this the hub area. Unique per `(userId, hubFor)` where not null (partial unique index, raw SQL) |
| `bucketProjectId` | fk? unique | The area’s inbox bucket project (1:1) |
| `legacyEnum` | enum? | Old `PHD/WORK/LIFE/LANG`, kept for permanent redirects and backfill |
| `createdAt`, `updatedAt` | datetime | |

Constraints (enforced in a transaction in app code; the two partial unique indexes enforce the rest):

- At least 1 active area per member.
- At most 8 active areas per member. At most 20 archived.
- The default area is never archived, never a hub area.
- Names are unique per member, case-insensitive, among active areas.

### 9.2 Foreign keys on existing models

| Model | Added | Final state |
|---|---|---|
| `Project` | `areaId` (owner’s `UserArea`) | Required for every project; bucket projects point to their own area |
| `Task` | `areaId` nullable | Explicit override only; effective area is `task.areaId ?? project.areaId` (same rule as today’s `area ?? project.area`) |
| `Doc` | `areaId` | Required after backfill (nullable until P7) |
| `Habit` | `areaId` nullable | |
| `DocFolder` | `areaId` nullable | |

The legacy `area` enum columns stay and are dual-written until P7.

### 9.3 One source of truth

- A `UserArea` owns exactly one bucket project; the bucket holds undated/unpathed work (`area-inbox-{userAreaId}`).
- Named paths are `Project` rows with `areaId` set.
- `resolveTaskArea(task)` is the only function that answers “which area is this task in?”.
- `UserAreaPreference` is folded into `UserArea` (color, icon, sortOrder, archived) and removed in P7.

### 9.4 Member-level fields

On `UserPreferences`:

- `uiProfile` (`starter` | `full`, default `full` at column level; `provisionMember` sets `starter` for new members)
- `uiProfileChangedAt`
- `moduleMemberPrefs` (JSON)
- `firstAreaChosenAt`, `firstCaptureAt`, `firstDoneAt`

On `User`:

- `modulePolicy` (JSON), `createdVia`, `mustChangePassword`

### 9.5 Migration mapping from the four fixed areas

| Old | New `UserArea` | `templateKey` | `hubFor` |
|---|---|---|---|
| `LIFE` | «زندگی» | `life` | none; `isDefault = true` |
| `WORK` | «کار» | `work` | none |
| `PHD` | «دکتری» (existing name kept) | `research` | `RESEARCH` |
| `LANG` | «زبان» | `language` | `LANGUAGE` |

- Per member: copy color, icon, sortOrder, archived from `UserAreaPreference`.
- If a member has never used an area (no tasks, docs, habits, paths) and has the preference unarchived, still create it so nothing disappears; the member can archive it.
- Bucket projects: keep the existing project row, set `UserArea.bucketProjectId`, and set `Project.areaId`. Rename the project id only if a later phase requires it; existing `task.projectId` references stay valid. Until then, `area-inbox-{userAreaId}` is the pattern for **new** areas only.
- `Doc.area` conflicts with the bucket (doc says `PHD`, its project is in `WORK`): the doc’s own `area` wins; the doc gets that area’s `areaId`.

### 9.6 Invariants (checked by `verify-areas.ts`, §19.1)

1. Every member has exactly one active default area.
2. Every task, doc, habit, and project resolves to an active or archived `UserArea` owned by the right member.
3. Every `UserArea` has one bucket project, and every bucket belongs to one area.
4. For each member, at most one area per `hubFor` value, and the two hub areas differ.
5. A hub area is never the default.
6. While the dual-write period lasts, `legacyEnum` and the legacy enum columns agree with `areaId`.

---

## 10. Hub areas (Research and Language)

### 10.1 Definition

A hub area is a `UserArea` with `hubFor` set. There is no separate “bound area id” column; `hubFor` is the binding.

- Enabling Research (effective) requires exactly one area with `hubFor = RESEARCH` for that member. If none exists, create one from the `research` template (name in the member’s UI language, `nameIsDefault = true`).
- Same for Language and `LANGUAGE`.
- A member may also convert an **empty** area into a hub area from the enable wizard.

### 10.2 Hub task

A task is a hub task for a member when **all** hold:

1. the task belongs to that member under the personal ownership rule;
2. its resolved area has `hubFor`;
3. the matching module is effective for that member.

A task in someone else’s shared project is never a hub task for the guest (it is evaluated only against the viewer’s own areas).

Hub tasks are kept out of Today’s inbox, overdue, and week lists and out of Bale digest overdue/due lists, exactly as `taskWhereExcludeHub()` does today. They remain visible on the calendar, All tasks, the board, deadline reminders, and as Today priority or focus picks when overdue, due today, or undated (current product rule in `TODAY.md`).

### 10.3 Guardrails

- The default area and general areas such as «کار» can never be a hub area (conversion requires the area to be empty and not default).
- Research and Language never share an area.
- Capture that picks a hub area stores the task there; this is why hub areas are dedicated.

### 10.4 Changing or losing a hub area

- **Change hub area:** allowed only through «انتقال همه به حوزهٔ دیگر» (§12.5): move all content of the current hub area to a target area (empty, non-default, no `hubFor`), then transfer `hubFor`.
- **Disable the module:** the area keeps `hubFor`, becomes dormant, and its tasks return to Today’s normal lists. Before confirming, show the count («۱۲ کار به لیست امروز برمی‌گردد»).
- **Archive a hub area:** blocked while the module is effective; allowed while dormant.

### 10.5 Visibility of the hub in Today

Because hub tasks leave the normal lists, Full Today shows a fixed row when a hub has open tasks: «پژوهش: N کار باز» (and the same for language), linking to the hub. Hidden when the module is off or the count is zero.

### 10.6 Language specifics

Language data is project-based. The language hub’s scope is “projects under the Language hub area”. The `Lang*` tables do not change. `language/actions.ts` and `language/queries.ts` (about 130 area/project references) switch from `project.area = LANG` to `project.areaId = <language hub area>` in P6.

### 10.7 Research specifics

- Replace every `area: "PHD"` / PHD-bucket check in `src/features/research/**` with “resolved area is the Research hub area”.
- The library binder doc system key (`phd-library:{projectId}`) becomes `library:{projectId}` (and `library:inbox:{areaId}` for the inbox). Migrate `Doc.systemKey` in the P6 backfill; keep a read fallback to the old key for one release.
- The `researchScope` cookie stores a project id or `inbox`. If it no longer resolves, fall back silently to the hub area’s inbox.
- Reverse sync rules (`sync-links.ts`) keep their current “never demote a card” guard.

---

## 11. Shared paths

- `Project.areaId` points to the **owner’s** area.
- A guest sees the path under a **Shared / مشترک** group on `/projects`, not inside their own areas.
- A task a guest creates in the path gets `areaId` = the **guest’s default area** (personal taxonomy). Board grouping by path uses `projectId`.
- The guest cannot rename or move the owner’s areas.
- `ProjectMember` roles (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`) and visibility rules do not change in this work. This is an explicit non-goal to avoid regressions.

---

## 12. Area lifecycle operations

All operations run in a transaction. Bulk updates over 5,000 rows run in chunks with a progress marker so they can resume.

### 12.1 Create

- Entry: onboarding chips, `/projects`, Capture «حوزهٔ جدید», Capabilities (hub enable).
- Rules: name required, unique among active areas, cap of 8 active.
- Creates the area and its bucket project, sets `firstAreaChosenAt` if unset.

### 12.2 Rename, color, icon, reorder

- Rename sets `nameIsDefault = false`.
- Reorder rewrites `sortOrder` for active areas.

### 12.3 Set default

Pick another active, non-hub area. The two rows are updated in one transaction.

### 12.4 Archive and restore

- Not allowed for the default area, or for a hub area while its module is effective.
- Archived areas leave pickers and the main `/projects` grid (shown in a collapsed «بایگانی» section). Their tasks stay visible in Tasks and Today; new items cannot be created in them.
- Restore re-checks the cap of 8.

### 12.5 Move all (also used for merge)

«انتقال همه به حوزهٔ دیگر» from area A to area B:

1. Tasks with `areaId = A` → B.
2. Tasks in A’s bucket → moved to B’s bucket (`projectId`), position preserved.
3. Named paths of A → `Project.areaId = B`.
4. Docs, habits, folders of A → B.
5. If A has `hubFor` and the operation is a hub change: transfer `hubFor` to B.
6. Clear dependent state: `researchScope` cookie, active language project if it pointed to a moved bucket.
7. `todayFocusIds` store task ids and need no change.

**Merge** is Move all followed by Delete of the now-empty area.

### 12.6 Delete

Only an area that is archived and empty (no tasks, docs, habits, paths, folders). Removes the area and its bucket project. A non-empty area offers Move all first.

### 12.7 Member deletion

`UserArea` cascades with the user. Shared-path tasks authored by others are not touched.

---

## 13. The helper seam (`src/lib/areas/*`)

### 13.1 Why

About 90 files read `area` directly. Swapping the enum for rows in all of them at once is a flag day. Instead, first route every read through helpers while the enum is still the backing store (behavior-preserving), then change the backing store inside one module.

### 13.2 API

| Function | Purpose |
|---|---|
| `getMemberContext(userId)` | One cached read per request: effective module flags, areas, hub areas, `uiProfile`, default area |
| `listUserAreas(userId, { includeArchived })` | Area list for pickers and chips |
| `resolveTaskArea(task)` | The single answer to “which area?” |
| `areaWhere(areaId)` | Prisma `where` fragment for task/doc/habit filters |
| `isHubTask(task, ctx)` | §10.2 predicate |
| `hubTaskExclusion(ctx)` | Replacement for `taskWhereExcludeHub()` and `personalLifeTaskWhere` |
| `getEffectiveFlagsForUser(userId)` | For session-less code |
| `ensureDefaultArea(userId)` | Replacement for `ensurePersonalWorkspace` |

### 13.3 `getMemberContext`

Wrapped in `React.cache` like `getUserModuleFlags`. The dashboard layout already performs several awaits; this keeps it to one additional cached read.

### 13.4 Lint guard

An ESLint `no-restricted-syntax` rule (live since P1) fails the build for new uses of the string literals `"PHD"`, `"WORK"`, `"LIFE"`, `"LANG"` outside `src/lib/areas/**`, tests, scripts and the shrinking baseline in `eslint.area-baseline.mjs`. Importing `LIFE_AREAS` from `@/lib/areas` stays allowed; the rule targets the literals, not the helper names.

---

## 14. Surfaces and acceptance criteria

Legend for change type: **R** redesign UX, **D** data wiring, **C** copy/i18n, **S** soft/later (appears with profile or module), **—** untouched.

### 14.1 New surfaces

Each lists purpose, entry point, states, key copy, mobile and accessibility notes, files, and acceptance.

**S-1 Capabilities (member)**

- Purpose: let the member see and change what is allowed. Entry: Settings → «قابلیت‌ها» tab; Today footer link.
- States: loading; list; a locked row; cascade preview dialog; save error.
- Copy: title «قابلیت‌ها»; helper «چیزهایی که نیاز نداری را خاموش کن؛ داده‌هایت پاک نمی‌شود.»; locked «مدیر این را فعال نگه داشته».
- Mobile: single column; switches ≥ 44 px. A11y: each switch has a visible label and description linked with `aria-describedby`.
- Files: `settings-tabs.ts` (add tab), `settings-cc.tsx`, new `capabilities-section.tsx`, `features/settings/actions.ts`.
- Acceptance: policy `off` modules are not listed; `on` rows are locked; turning off a parent shows the cascade; changes are rejected server-side if they violate policy even via direct action call.

**S-2 Area management**

- Purpose: create, rename, color, icon, reorder, archive, restore, set default.
- Entry: `/projects` (area cards), area menu, Capture «حوزهٔ جدید».
- States: empty (no extra areas), at cap (disabled create with «حداکثر ۸ حوزه»), archived section.
- Files: `projects/components/**`, `features/projects/actions.ts`, `lib/areas/*`.
- Acceptance: cap and name uniqueness enforced server-side; default area cannot be archived.

**S-3 Move-all / merge / delete flow**

- Purpose: safe heavy operations (§12.5, §12.6).
- Entry: area menu → «انتقال همه…», «ادغام…», «حذف».
- States: pick target; preview counts («۳۴ کار، ۵ سند، ۲ پروژه»); running (progress); done; failure with retry.
- Copy: confirm «همهٔ موارد به «B» منتقل می‌شود. این کار برگشت‌پذیر نیست.»
- Acceptance: counts match before and after; hub transfer keeps exactly one hub area; resumable on failure.

**S-4 Hub enable wizard and unbound state**

- Purpose: turning on Research or Language never ends on a dead page.
- Entry: Capabilities switch; direct visit with module on but hub area missing.
- Steps: (1) one-sentence description; (2) “create a dedicated area” (default) or “use an empty area”; (3) done → open hub with a one-time coach mark whose title is the area’s name.
- Acceptance: creating the hub area is atomic with enabling; the hub area is distinct from the other hub and from the default.

**S-5 «قابلیت خاموش است» page**

- Two variants (admin-off, member-off) per §7.7. Always offers a way back: «برگرد به امروز».
- Acceptance: no module route redirects silently.

**S-6 First task and life-part chips**

- Purpose: the Day-1 loop (§6.4).
- Starter Today: input «الان چیکار داری؟»; on first save show «ثبت شد.»; then «این مال کدوم قسمت زندگیته؟» with chips: «کار»، «خانه و زندگی»، «درس یا پژوهش»، «زبان»، «سلامت»، «سایر…».
- Choosing a chip creates or reuses a `UserArea` from the template (name in UI language, `nameIsDefault = true`) and assigns the task; closing the prompt leaves the task in the default area.
- Note: choosing «درس یا پژوهش» or «زبان» creates a normal area **without** enabling any module.
- Acceptance: first capture sets `firstCaptureAt`; chip choice sets `firstAreaChosenAt`; closing the prompt breaks nothing.

**S-7 Invite acceptance and forced password change**

- `/accept-invite?token=…`: explains «حساب تو ساخته شده؛ یک رمز برای خودت انتخاب کن.»; fields password and confirm; success signs in and lands on Today.
- Forced change (§8.3): a single-purpose security page.
- States: expired token («لینک منقضی شده؛ از مدیر لینک جدید بخواه»), used token, weak password.
- Acceptance: a temp-password user cannot reach any other member route until the change is done; token is single-use.

**S-8 Admin module policy editor**

- Per member (create and edit drawers): three-state control per module (`off` / `on` / `member_choice`), preset selector, «اعمال به همه» bulk action, a preview of what the member will see.
- Files: `users/components/ui/module-toggles.tsx`, `create-user-drawer.tsx`, `edit-user-drawer.tsx`, `features/users/actions.ts` (`updateUserModules`).
- Acceptance: every change writes `modulePolicy`, refreshes the legacy mirror, writes an audit entry, and notifies the member.

**S-9 `uiProfile` switch and suggestion**

- Control «امکانات بیشتر نشان بده» in the Today footer and Capabilities; one-time dismissible suggestion card after 3 completed tasks.
- Acceptance: the layout changes only after the member presses the switch.

**S-10 Shared group on `/projects`**

- Paths where the member is a guest appear in a «مشترک» group, never inside the member’s own areas.

**S-11 Admin funnel card**

- Aggregate counts from §6.7, split by `createdVia`; no per-member behavioral detail beyond timestamps already stored.

**Empty states (set)**

| Place | Copy (FA) | Next action |
|---|---|---|
| Starter Today | «هنوز چیزی ننوشتی. اولین کارت را بنویس.» | Focus the input |
| Tasks | «اینجا همهٔ کارهایت جمع می‌شود.» | New task |
| Area with no paths | «پروژه‌ها اختیاری‌اند؛ برای کارهای پراکنده لازم نیست.» | New project (secondary) |
| Hub unbound | Wizard S-4 | |
| Capabilities (all on) | «همه‌چیز روشن است.» | |

### 14.2 Existing surfaces: retention core

| Surface | Type | Change | Acceptance |
|---|---|---|---|
| Onboarding (`onboarding-tour.tsx`, `onboarding/actions.ts`) | R | Remove the four-area tour and Language/Research promo. Replace with the Starter Today loop (S-6). `completeOnboardingAction` records state; Skip keeps the calm shell | A new member sees no modal before writing; Skip never leaves a dense UI |
| Today (`dashboard-cc.tsx`, `features/life/queries.ts`) | R | One page, conditional sections per §6.6; hub row §10.5 | Starter hides priorities, focus, charts, attention; Full is unchanged apart from hub exclusion via the helper |
| Capture (`capture-dialog.tsx`, `features/capture/**`) | R + D | Starter plain box; Full unchanged; area guess per §15.3 | `/research` with Research off returns a safe message; chips list the member’s areas |
| Shell nav (`(dashboard)/layout.tsx`) | R | Nav = f(effective modules, `uiProfile`, explicit enables, first dated task) | Starter shows ≤ 4 items; Calendar appears after the first dated task |
| Guide (`features/guide/content.ts`) | R + C | Rewrite for custom areas, opt-in hubs, Starter vocabulary | No claim that PhD or language is assumed |
| Settings (`settings-tabs.ts`, `settings-cc.tsx`) | R | Add Capabilities tab (S-1) | See S-1 |

### 14.3 Existing surfaces: areas and paths

| Surface | Type | Change |
|---|---|---|
| `/projects` | R | N dynamic cards (no 2×2 assumption); S-2, S-10; DnD only across the member’s own areas |
| `/projects/areas/[area]` | R | Param becomes `userAreaId`; related links come from effective modules and hub areas, not `AREA_VISUAL` switches |
| `/projects/[id]` | D + C | Show the owner’s area; guests see Shared |
| `AreaPathFilters` | D | Options are `listUserAreas` |
| Task form (`task-form-fields.tsx`, `use-life-task-edit.ts`) | D + C | Area picker lists the member’s areas; research presets lock to the Research hub area |
| `area-visual.ts` | D | Load color/icon from `UserArea`; keep the preset palette catalog |
| `area-projects.ts`, `life/workspace.ts` | D | Replaced by `ensureDefaultArea` and `lib/areas/*` |
| `UserAreaPreference` | D | Folded into `UserArea`, dropped in P7 |
| Calendar (`calendar-cc.tsx`, `week-hour-grid.tsx`) | D + S | One chip per active area, all on by default; nav entry per §6.6 |

### 14.4 Existing surfaces: planning

| Surface | Type | Change |
|---|---|---|
| `/tasks` | D + C | Group-by-area uses area names and ids; hub tasks stay visible |
| `/kanban` | D + S | Area filter dynamic; absent from the Starter nav |
| `/review` | S | Appears with `full` or an explicit enable |
| `/docs` | D + C | Filters by member areas; research templates only with Research effective |
| `/work-logs` | D + S | Area filter dynamic |
| `/reporting` | S | Almost no area UI; late unlock |
| `/api/search` | D + C | Returns area name; omits results of disabled modules; ownership rule aligned with `personalTaskOwnership` |
| `/notifications` | C + D | Vocabulary reminders only with Language effective; new notification type for admin policy changes |

### 14.5 Existing surfaces: hubs

| Surface | Type | Change |
|---|---|---|
| `/research` and `features/research/**` | D (heavy) + C | §10.7; page title is the hub area’s name |
| `/language` and `features/language/**` | D (heavy) + C | §10.6 |
| Doc templates (`features/docs/templates.ts`) | D | Research templates gated on the module |
| Library binders | D | `library:*` system keys with a one-release read fallback |

### 14.6 Admin and external

| Surface | Type | Change |
|---|---|---|
| `/users` | D + C | S-8; presets; audit and member notification |
| Create member (`createUser`) | R + D | `provisionMember`, invite link, no password logging |
| Overview (`/admin`) | R | S-11 funnel card |
| Bale digest and habit nudge | D | Use `hubTaskExclusion` and `getEffectiveFlagsForUser` |
| Cron `/api/cron/deadline-reminders` | D | Skip vocabulary and habit work for members whose module is not effective |
| `/bale-bot` | C | Light |
| Teams | — | Untouched |
| Login | C | Optional one-line value statement |

### 14.7 Docs and i18n

`docs/TODAY.md` (Starter vs Full, hub exclusion via hub area), `docs/CAPTURE.md` (Starter box, dynamic area guess), `docs/BOARD.md` (research board under the hub area), `docs/DEPLOY.md` (backup/restore/rollback), `docs/ROADMAP.md`, `src/features/guide/content.ts`, `src/i18n/fa.ts` and `en.ts` (onboarding, areas, capture, nav, capabilities, errors). Each phase updates the docs for the behavior it ships (§20, definition of done).

---

## 15. Behavior details

### 15.1 Today (Starter)

- Prompt, then a list of open tasks.
- «به‌زودی» shows tasks due tomorrow and the following days, so dates understood by Capture are visible even without the Calendar.
- «انجام شد» marks a task done (and sets `firstDoneAt` once).
- Leftovers from a previous day appear on top with «از دیروز».

### 15.2 Sidebar (Starter)

`Today`, `Tasks`, `Calendar` (once the member has a task with a due date), `Settings`. Any module the member **explicitly enabled** in Capabilities that has a nav entry also appears. All other modules appear only under `full`.

### 15.3 Capture area guess (Full)

1. Explicit chip or the area of the open page or path.
2. Forced kind: `/research` and `/source` use the Research hub area (error if Research is not effective).
3. Match against the member’s area names (normalized FA/EN).
4. Match against template keyword dictionaries (`research`: مقاله، پایان‌نامه، paper…; `language`: زبان، vocabulary…; `work`: شغل، اداره…).
5. Fallback: the default area.

No enum literal is used after P4.

### 15.4 Naming

| Context | FA | EN |
|---|---|---|
| Starter chips and questions | قسمت زندگی، «این مال کدومه؟» | Part of life, “Which part of life?” |
| Hubs and Settings | حوزه | Area |
| Optional grouping | پروژه یا موضوع (decision on «مسیر» vs «پروژه» is made after the P3 user test) | Path / project |
| Shared | مشترک | Shared |
| Capabilities | قابلیت‌ها | Capabilities |

Area names are user data. Template-created names with `nameIsDefault = true` render in the current UI language; once renamed they are shown as typed.

---

## 16. URL map and redirects

| Old | New |
|---|---|
| `/projects/areas/phd|work|life|lang` | `/projects/areas/{userAreaId}` |
| Query `area=PHD` | `area={userAreaId}` |
| Research scope cookie (project id or `inbox`) | Unchanged; unresolved values fall back to the hub area inbox |

**Redirects for the legacy slugs are permanent**, resolved through `UserArea.legacyEnum`. Notifications, Bale messages, and bookmarks keep old links forever.

---

## 17. Public sign-up readiness (hooks now, page later)

Built in P0 so the later track is only the public surface:

- `provisionMember`, `createdVia`, system default presets per channel (§8).
- Invite and token mechanism reusable for email verification.
- `signupEnabled` flag, default `false`.

Needed in the S-track (not in P0–P7):

- Sign-up page, email verification, password reset review, rate limiting and abuse controls.
- Terms and privacy copy, data export and deletion.
- `maxActiveMembers` behavior with a waitlist.
- Storage quota per member.
- Fix the concurrent first-user race in `ensurePersonalWorkspace` (first user becomes owner of `default-org`).
- Decide the sign-in channel for the target audience at the start of the track: email, phone/OTP, or Bale. Email may be a weak channel for this audience.
- Support role beyond the single admin.

---

## 18. Deployment and migration safety

### 18.1 Facts

- `docker-entrypoint.sh` runs `prisma migrate deploy` on every container start, retries 10 times, then exits.
- A migration that backfills many rows runs at boot on production and can stall or loop the container.
- `docs/DEPLOY.md` previously had no backup, restore, or rollback section (added in P0).

### 18.2 Rules

1. Prisma migrations are **additive and fast**: new tables, columns, indexes. No backfill, no drop, no rename.
2. Backfills are separate scripts: idempotent, batched, resumable, run by hand before reads are switched:
   - `scripts/areas/backfill-modules.ts` (P0)
   - `scripts/areas/backfill-areas.ts` (P4)
   - `scripts/areas/backfill-hub-keys.ts` (P6)
3. Partial unique indexes (`isDefault`, `hubFor`) are written as raw SQL in the migration, because Prisma cannot express them.
4. The cap of 8 active areas is enforced in a transaction in app code.
5. Take `pg_dump` before every deploy that includes a migration or backfill (commands in `DEPLOY.md`).
6. Destructive changes (drop enum columns, drop `UserAreaPreference`, drop `enabledModules`) happen only in P7, after at least two weeks of soak, with a fresh dump.
7. While migrations are additive, the previous application build still works against the new schema, so code rollback is a `git checkout <previous>` plus rebuild.

### 18.3 Dual-write window

From P4 until P7, writes set both the legacy enum column and `areaId`; `verify-areas.ts` asserts they agree. Reads switch to `areaId` only inside `lib/areas/*`.

---

## 19. Test strategy

### 19.1 `scripts/areas/verify-areas.ts`

Read-only, safe to run on production, exits non-zero on any violation. Checks the invariants in §9.6, plus: every member has policy and preferences rows; every module’s hub area exists when the module is effective.

### 19.2 Unit tests (vitest, pure logic)

- Effective module resolution (`policy` × `prefs` × dependencies), including the backfill equivalence (before/after equal for every existing flag shape).
- `hubTaskExclusion` / `isHubTask`, including guest tasks and dormant hubs.
- Capture area guess.
- `personalTaskOwnership` and `canAccessPersonalTask` (extend `task-access.test.ts`).
- Area lifecycle rules (cap, default, archive, hub guards) as pure validators.

### 19.3 Before/after parity

A fixture exported from a real database and anonymized. For each member, the counts shown by Today, All tasks, and the board are recorded before a phase and compared after it.

### 19.4 Manual two-member script

Owner plus guest: shared path, hub tasks, module off/on by admin and by member, forced password change, invite acceptance, area merge.

### 19.5 Acceptance checklist

- [ ] Effective flags per existing user are unchanged after the P0 backfill.
- [ ] A member cannot turn off an `on` module or turn on an `off` module, even by calling the action directly.
- [ ] Admin turns a module off: nav hidden, actions rejected, data intact, member preference kept, member notified.
- [ ] No module route redirects silently; both explanatory variants render.
- [ ] No temporary password appears in server logs.
- [ ] A temp-password user cannot open any other member route before changing it.
- [ ] Create-member and (later) sign-up both go through `provisionMember`.
- [ ] Starter shows ≤ 4 nav items; the first capture is visible on Today; «به‌زودی» shows tomorrow’s task.
- [ ] Calendar appears only after the first task with a due date (Starter).
- [ ] The layout changes only when the member presses «امکانات بیشتر نشان بده».
- [ ] Research and Language hub areas are distinct; the default area cannot be a hub area.
- [ ] A guest’s shared-project task is never treated as a hub task for the guest.
- [ ] Disabling a hub module returns its tasks to Today; the dialog showed the count first.
- [ ] Move-all keeps counts and keeps exactly one hub area.
- [ ] Legacy `/projects/areas/phd` redirects correctly.
- [ ] Cron, Bale handlers, and `/api/search` ignore disabled modules.
- [ ] `verify-areas.ts` is green after P4, P5, P6.
- [ ] `migrate deploy` on a copy of production data completes quickly and without error; each backfill can be re-run.

---

## 20. Phases

Sizes are relative: S small, M medium, L large, XL very large.

### P0 Foundation (M)

Scope: explicit module backfill; two-layer policy and effective resolution; `assertModule` and `getEffectiveFlagsForUser` adopted by the files in §7.7; `provisionMember`, `createdVia`, `mustChangePassword`, invite link and `/accept-invite`; remove password logging; admin form presets; «قابلیت خاموش است» pages; notification on policy change; `verify-areas.ts` (module part); `DEPLOY.md` backup/restore/rollback.
Exit: acceptance items for access, accounts, and logging pass; backfill equivalence proven.

### P1 Helper seam (L)

Scope: `src/lib/areas/*`; move every area read to helpers with the enum as the backing store; unit tests; ESLint rule.
Constraint: no schema change and no behavior change.
Exit: parity tests identical; lint rule active.
May run in parallel with P2.

### P2 Starter shell (L)

Scope: `uiProfile`; Starter nav, Today, Capture; «به‌زودی»; S-6 life-part chips; S-1 Capabilities (member); S-9; new onboarding; lifecycle timestamps; S-11 funnel card. Runs on the four existing areas.
Exit: a new member completes the Day-1 loop without a modal; Skip is safe.

### P3 Validation (S)

Scope: put the Starter shell in front of 3–5 target users; record where they stall; decide «مسیر» vs «پروژه»; adjust copy.
Gate: proceed to P4 only on an acceptable result.

### P4 Schema and migration (L)

Scope: `UserArea` and foreign keys (additive migration with raw-SQL partial indexes); `backfill-areas.ts`; dual-write; `verify-areas.ts` green; switch reads inside `lib/areas/*`.
Exit: parity tests identical; invariants hold.

### P5 Dynamic UI (XL)

Scope: `/projects` and area dashboard on dynamic areas; filters; calendar chips; task form; S-2, S-3, S-10; admin and member surfaces read areas through helpers.
Exit: a member with 1 area and a member with 8 areas both work; merge and delete tested.

### P6 Hub areas (XL)

Scope: `hubFor`; S-4 wizard; Research and Language off the enum; `library:*` keys; hub change flow; `backfill-hub-keys.ts`; guest/hub rules.
Exit: the owner’s PhD and Language data show identically; enabling Research for a new member creates a dedicated area.

### P7 Cleanup (M)

Scope: drop legacy enum columns, `UserAreaPreference`, `enabledModules`, `HUB_AREAS`, `AREA_META` enum record, dead constants; final doc pass.
Preconditions: two weeks of soak and a fresh dump.

### S-track (later)

Public sign-up on top of the P0 hooks (§17).

### Definition of done (every phase)

Tests green; `verify-areas.ts` green (from P4); the relevant docs updated in the same phase (`TODAY.md`, `CAPTURE.md`, `BOARD.md`, Guide, FA and EN strings); phone viewport and basic keyboard/aria check on every new surface; no new use of the enum outside `src/lib/areas/**`.

---

## 21. Out of scope

- Vocabulary from papers with AI ([`ROADMAP.md`](./ROADMAP.md)).
- Multi-assignee tasks.
- External calendar (ICS) sync.
- Capability-per-space (several Research packs).
- Teams as an organization product.
- LLM parsing in Capture.
- Changes to `ProjectMember` roles and shared-project visibility rules.

### 21.1 Known personalization leaks outside areas (recorded in `ROADMAP.md`)

These also make the product feel built for one person. They are not fixed here:

- Today bounds, reminders, and the vocabulary day use `Asia/Tehran` regardless of the member.
- Jalali calendar and Persian-first guide and decks.
- Bale as the only outbound notification channel.
- Concurrent first-user race when creating `default-org`.

---

## 22. Risk register

**P0 (design breakers, all addressed above)**

- Silent default change for existing members → P0 backfill (§7.6).
- Module bypass through server actions → guard (§7.7).
- Hub misjudgement for guests → viewer-only evaluation (§10.2).
- Hub areas swallowing general work → dedicated, distinct (§10.3).
- Migration at boot → additive-only (§18).
- 90-file flag day → helper seam (§13).

**P1**

- Dynamic layouts versus the 2×2 grid; capture guess after rename; library system-key migration; Bale and cron respecting effective flags.

**P2**

- Seed and demo scripts (`db:seed:demo`, `db:clean:*`) reference fixed areas; update with P4.
- Mobile polish for Starter; funnel card privacy review.

---

## 23. Resolved micro-decisions

| Question | Decision |
|---|---|
| Which default among active areas | Exactly one, enforced by a partial unique index |
| Calendar in Starter nav | Appears with the first task that has a due date |
| Does Board unlock automatically | No; only with `full` or an explicit enable |
| Guest task `areaId` | The guest’s default area |
| Graduation | Explicit switch plus a one-time suggestion after 3 completed tasks |
| Where the hub binding lives | `UserArea.hubFor` (no separate column) |
| Admin impersonation | None |
| UI word for «مسیر» | Decided after the P3 user test |

---

## 24. Code map (starting points)

| Concern | Paths |
|---|---|
| Enum, meta | `src/lib/life.ts`, `prisma/schema.prisma`, `src/types/db.ts` |
| Buckets and workspace | `src/lib/area-projects.ts`, `src/features/life/workspace.ts`, `src/lib/request-cache.ts` |
| Hub isolation | `src/lib/project-namespace.ts` (`HUB_AREAS`, `taskWhereExcludeHub`), `src/lib/task-access.ts` |
| Modules and guard | `src/lib/modules.ts`, `src/lib/require-role.ts`, `src/features/users/actions.ts`, `src/app/(dashboard)/users/components/ui/module-toggles.tsx` |
| Accounts | `src/features/users/actions.ts` (`createUser`, `resetUserPassword`, `changePassword`), `src/app/(auth)/**` |
| Research | `src/features/research/**`, `src/app/(dashboard)/research/**`, `src/components/research/**` |
| Language | `src/features/language/**`, `src/app/(dashboard)/language/**` |
| Capture | `src/features/capture/**`, `src/components/life/capture-dialog.tsx` |
| Today | `src/features/life/queries.ts`, `src/app/(dashboard)/dashboard/dashboard-cc.tsx` |
| Projects and areas UI | `src/app/(dashboard)/projects/**`, `src/features/projects/**`, `src/lib/area-visual.ts` |
| Onboarding | `src/components/onboarding/onboarding-tour.tsx`, `src/features/onboarding/actions.ts` |
| Guide and i18n | `src/features/guide/content.ts`, `src/i18n/fa.ts`, `src/i18n/en.ts` |
| Bale, cron | `src/features/external/bots/bale/**`, `src/app/api/cron/deadline-reminders/route.ts` |
| Deploy | `docker-entrypoint.sh`, `docker-compose.yml`, `docs/DEPLOY.md` |

---

## 25. Review checklist before coding

- [ ] Product owner accepts Value → Structure → Power and the Starter/Full model (§6).
- [ ] Product owner accepts the two-layer module model and presets (§7).
- [ ] Product owner accepts dedicated, distinct hub areas (§10).
- [ ] Product owner accepts the phase order, with P3 validation as a gate (§20).
- [ ] The owner names the phase to build first. Recommended: P0, then P1 and P2 in parallel.

*End of AREAS design document.*
