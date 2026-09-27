# Today — three priorities

The Today page always shows three slots (اولویت ۱–۳), stacked in one card. On a wide screen that card sits beside «تمرکز امروز» inside the main column, so that band reads as three columns with the chart column. The week strip and the lists stay in the main column; the charts stay one column beside them. In that chart column, «بار هفته» and «حوزه‌ها» share one row.

- An empty slot offers «انتخاب یک کار». That list is open overdue tasks, tasks due today, and tasks with no due date. Tomorrow and the rest of the week stay out. The menu groups them as «عقب‌افتاده», «امروز», and «بدون زمان».
- Those same tasks can be dragged into a slot. Rows for another day do not show a drag handle or the target icon. Dropping on an occupied slot replaces it. Dragging between slots moves the task.
- The target icon on an eligible row still fills the first empty slot, or removes the task if it is already pinned.
- The header count is how many of the three are **done** (`2/3 ✓`), not how many slots are filled. A finished task stays in its slot with a check until it is removed.
- Slot order is stored in `userPreferences.todayFocusIds` for the local day. An empty string keeps a hole so slot 2 can be filled while slot 1 is empty. A new day starts empty.
- Pinned tasks leave the Today / overdue / week / inbox lists so they are not shown twice. PhD and language tasks stay off those lists, same as before.

## Focus session

«تمرکز امروز» is a session, not a counter. Pick a task (priorities first, then the same overdue / today / undated list), choose 15, 25, or 50 minutes, and start. Pausing does not log time. Finishing the block, or «ثبت و توقف», writes a work log on that task (`جلسه تمرکز`, local noon, hours = minutes / 60). A break of 5 minutes follows a finished block and is not logged. Under one minute is discarded. The header «تمرکز» button scrolls back to the session and shows the clock while it runs. Hours and reports read that work log. «ساعت این هفته» on Today stays one decimal, and shows two decimals when the week total would otherwise round to 0.0. If the project name is the same as the area label, the session line shows it once.
