# Universal Capture

ثبت سریع یک دیالوگ برای کل فضای عضو است. جمله را با قانون محلی می‌خواند، نه با مدل زبانی. میانبرش کلید N است. Ctrl+K جستجو می‌ماند.

Quick capture is one dialog for the whole member workspace. It is rule-based. Do not add an LLM parser unless the product owner asks.

## How to open it

- Physical key **N** (the `KeyN` key), with no modifier, when focus is not in a text field.
- The sidebar button «ثبت سریع», the mobile header button, and the slim row on Today, Calendar, and Weekly review.
- **Ctrl+K / Cmd+K stays search.** Do not reuse it for capture.

## What a sentence becomes

The server parses the text again. The dialog preview uses the same rules.

| Input | Result |
| --- | --- |
| `فردا ساعت ۱۰ مقاله STT را بررسی کنم` | Task, tomorrow, 10:00, area PhD (دکتری) |
| `ایده: …` or `یادداشت:` / `note:` / `idea:` | Doc with status IDEA |
| `/task` `/note` `/idea` `/research` `/source` `/habit` | Forces that kind. Persian aliases: `/یادداشت` `/ایده` `/پژوهش` `/منبع` `/عادت` |
| `/research` (no DOI) | PhD task **plus** a linked research idea doc. Path follows the last research scope cookie (or inbox). |
| `/source` or `/منبع`, or `/research` + a DOI | Library source + per-paper note + reading card. Due date/time from the sentence are kept on the card. Crossref fills metadata when DOI is present. A bare PhD keyword + DOI without `/source` or `/research` stays a normal dated task. |
| `عادت:` or `/habit` | Habit. `هر هفته` / weekly → weekly; otherwise daily. |
| `هر روز` `هر هفته` `هر ماه` | Task recurrence. |
| امروز / فردا / پس‌فردا, today / tomorrow, weekday names, `تا جمعه` | Due day. A named day wins over the page default. |
| `دو روز دیگر`, `۳ روز بعد`, `هفته بعد` / `هفته آینده` | A day counted from today, or seven days ahead. |
| `امشب` | Today at 21:00. |
| `صبح` / `ظهر` / `عصر` / `شب` with no clock | 09:00, 12:00, 17:00, 21:00. An explicit `ساعت …` wins. |
| `ساعت ۱۰`, `ساعت ده و نیم`, `۱۰:۳۰`, `at 10`, `شب` / `عصر` | Clock time on the task due date. Without a time, a dated task stays at noon. Lists and calendar chips show that clock beside the day; noon stays date-only. In the task form, pick a day first, then optionally tap «افزودن ساعت» — the clock uses a 24h scroll roller. |
| `۲٫۵ ساعت`, `برای ۲ ساعت`, `90 دقیقه`, `for 2.5 hours` | Optional duration on a timed task (meeting length). Form presets cover 30m–4h. Calendar week/day views use a 24h hour grid: drag onto the grid (15‑minute snap, live ghost preview, grab-point preserved) to set the clock; drag the block’s bottom edge to change duration; overlapping timed blocks show a conflict mark. Drop on the all-day strip to clear the clock. Phone defaults to day view. |

Area chips in the dialog override the guess. Life is the default area. The bare word «کار» does not switch the area to work; شغل، اداره، دفتر، work, and job do. The dialog lists these rules under «چطور جمله را می‌خواند؟» and shows the title that will be stored.

PhD and language tasks are saved on the member’s tasks, with area, project, due date, and clock. They do not appear on Today or the calendar. They show on All tasks and the board.

If the sentence has no day, the open page supplies one: Today uses today, Calendar uses the selected day. Other pages leave the task undated (inbox) unless the sentence names a day. A clock time with no day is stored on today.

Notes keep date words in the title. Habits do not get a due date.

Empty title after stripping the day and time is rejected.

## Modules

Tasks, docs, and habits each require that module to be on. Admin accounts do not get this dialog; their shell is management-only.
