# Today — three priorities

The Today page always shows three slots (اولویت ۱–۳), stacked in one card. On a wide screen that card sits beside «تمرکز امروز» inside the main column, so that band reads as three columns with the chart column. The week strip and the lists stay in the main column; the charts stay one column beside them. In that chart column, «بار و تعادل هفته» shows **all** open due-this-week tasks (Life, Work, PhD, Language) in the day bars, and area % counts every open owned task by resolved area — not only area-bucket inbox rows.

- An empty slot offers «انتخاب یک کار». That list is open overdue tasks, tasks due today, and tasks with no due date — across Life, PhD, and Language. Tomorrow and the rest of the week stay out. The menu groups them as «عقب‌افتاده», «امروز», and «بدون زمان», and each row shows its area (زندگی / دکتری / زبان / کار).
- **Calendar day:** Today bounds and the focus `todayKey` use **Asia/Tehran**, not the server’s local TZ, so a UTC host after Iran midnight still loads «امروز» (and hub) picks instead of only overdue leftovers. Date-only dues written as Iran noon (`dueFromWallClock` → 08:30 UTC) stay date-only on UTC hosts — they must not be treated as timed 08:30 meetings.
- **Overdue vs today:** a timed due (clock or duration) becomes overdue as soon as that instant has passed — including later the same day. A date-only due (Tehran noon, local noon, or legacy noon-UTC with no duration) stays in «امروز» until the Tehran calendar day ends, then moves to overdue. Priority and focus pickers always include today’s open tasks and undated inbox items alongside overdue — they are not starved by a long overdue list.
- Those same tasks can be dragged into a slot. Rows for another day do not show a drag handle or the target icon. Dropping on an occupied slot replaces it. Dragging between slots moves the task.
- The target icon on an eligible row still fills the first empty slot, or removes the task if it is already pinned.
- The header count is how many of the three are **done** (`2/3 ✓`), not how many slots are filled. A finished task stays in its slot with a check until it is removed.
- Slot order is stored in `userPreferences.todayFocusIds` for the local day. An empty string keeps a hole so slot 2 can be filled while slot 1 is empty. A new day starts empty.
- Pinned tasks leave the Today / overdue / week / inbox lists so they are not shown twice. PhD and language tasks stay off those lists (they live in their hubs), but they **can** be chosen as one of the three priorities or for a focus session when overdue, due today, or undated. Calendar overdue visuals and deadline reminders include hub tasks.

## Calendar drag persistence

Dragging a task on `/calendar` writes via `rescheduleTaskDueDate` / `rescheduleTaskSchedule` (single object args + client `dueAtIso`). After a successful DB write, `revalidateLife()` is best-effort and must not flip the action to failure. Soft RSC refresh merges by `updatedAt`, skips in-flight ids, and keeps those ids locked ~2s after the action returns — never `setTasks(initialTasks)` wholesale.

Week/day timed blocks are draggable from the whole block body (not a corner grip). The overdue alert icon is visual only.

## Kanban drag persistence

Board moves write via `moveTask` (primary card update, sibling positions best-effort). Escape / drop-outside restores the pre-drag column snapshot. Soft refresh from `initialColumns` is ignored while a card is dragging or a move save is in flight. Research link sync after a status change is a plain server module (not a nested `"use server"` action).

## Focus session

«تمرکز امروز» is a session, not a counter. Pick a task (priorities first, then the same overdue / today / undated list), choose 15, 25, or 50 minutes, and start. Pausing does not log time. Finishing the block, or «ثبت و توقف», writes a work log on that task (`جلسه تمرکز`, local noon, hours = minutes / 60). A break of 5 minutes follows a finished block and is not logged. Under one minute is discarded. The header «تمرکز» button scrolls back to the session and shows the clock while it runs. Hours and reports read that work log. «ساعت این هفته» on Today stays one decimal, and shows two decimals when the week total would otherwise round to 0.0. If the project name is the same as the area label, the session line shows it once.
