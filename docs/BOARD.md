# Board

Four columns only:

1. **Inbox** (`BACKLOG`) — no due date, or due in a later week  
2. **This Week** (`TODO`) — due this week (Sat–Fri) or overdue  
3. **In Progress** (`IN_PROGRESS`) — actively working  
4. **Done** (`DONE`) — finished  

Legacy scrum statuses (`REVIEW`, `TESTING`, `BLOCKED`) stay in the DB enum for compatibility but are folded into **In Progress** on Today / Board / Research load.

## Due-date planning

For Inbox ↔ This Week only:

- No due / due after this week → Inbox  
- Due this week or overdue → This Week  
- In Progress and Done are never auto-changed by due date  

Undated This Week cards (manual drag) stay put. Far-dated This Week cards with a future due move back to Inbox on sync.

Research board uses the same four statuses with PhD labels: Idea → Reading → Writing → Done.
