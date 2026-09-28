# Board

Four columns only:

1. **Inbox** (`BACKLOG`) — no due date, or due in a later week  
2. **This Week** (`TODO`) — due this week (Sat–Fri) or overdue  
3. **In Progress** (`IN_PROGRESS`) — actively working  
4. **Done** (`DONE`) — finished  

Legacy scrum statuses (`REVIEW`, `TESTING`, `BLOCKED`) stay in the DB enum for compatibility but are folded into **In Progress** on Today / Board / Research load.

## Waiting / follow-up

`Task.waitingOn` parks a task as “waiting on someone else” (e.g. a reply). It is **not** the same as undated Inbox:

- Waiting tasks leave the normal Today lists (inbox / overdue / today / week) and show under Today → **در انتظار**
- Sync will not auto-promote waiting tasks into This Week; they stay `BACKLOG` until `waitingOn` is cleared
- Toggle lives on the task form next to due date

## Due-date planning

For Inbox ↔ This Week only (and only when `waitingOn` is false), and **only for non-hub (WORK/LIFE) tasks**:

- No due / due after this week → Inbox  
- Due this week or overdue → This Week  
- In Progress and Done are never auto-changed by due date  
- **PhD / Language tasks are never remapped by due date** — Research pipeline stages stay put

Undated This Week cards (manual drag) stay put. Far-dated This Week cards with a future due move back to Inbox on sync.

## Research pipeline

Research reuses the same four `TaskStatus` values with PhD labels: Idea → Reading → Writing → Done.

Linked continuity (when a card has `DocTask` links):

| Pipeline | Doc status | Source `readingStatus` |
|----------|------------|------------------------|
| Idea (`BACKLOG`) | `IDEA` | `TO_READ` |
| Reading (`TODO`) | `DRAFTING` | `READING` |
| Writing (`IN_PROGRESS`) | `REVIEW` | `READING` |
| Done | `READY` | `DONE` |

Library reading changes reverse-sync onto the **single** linked PhD card (one DocTask per source note; linking replaces any previous card). Reading toggles auto-promote legacy binder hosts onto a per-paper note and create a reading card if missing, so status changes are never inert.

Sources are path-scoped (`DocSource.projectId`). Adding a source creates a **per-paper source note** with status aligned to reading (`TO_READ` → doc `IDEA` / card `BACKLOG`). Binder docs are index-only leftovers and filtered from Writing / cite / Today. Explicit actions: «وصل به کارت» from the library and «چسباندن منبع» from a card. Citations/quotes reference the canonical source and do not fork rows.
