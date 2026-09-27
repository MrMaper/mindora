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

## Mobile UX (in progress)

Goal: every member surface is usable one-handed on a phone — no clipped filters, no desktop-only tables, drawers that fit the screen, calendar that doesn’t force a huge empty scroll.

### Shipped in this pass
- App shell: larger menu/search targets, safe-area padding
- Drawers: full width on small screens
- Board + task filters: stack into a 1/2-column grid
- Tasks: card rows on phones; table from `md` up
- Calendar: shorter month/week cells on small screens
- Language hub tabs: horizontal scroll instead of wrapping

### Still to do (section by section)
1. **Today dashboard** — week strip and attention cards: tighter type, no overflow
2. **Research** — pipeline board + library panels stacked, tab bar scroll
3. **Docs** — editor toolbar wraps; PDF annotator already stacks under `lg`
4. **Projects** — list and detail tabs
5. **Work logs / reporting / review** — forms full width
6. **Profile, settings, notifications, users (admin)** — form fields and tables
7. Pass each page in a real phone viewport and fix leftover horizontal scroll


---

## Other known later items (not this doc’s focus)

- Universal Capture stays on the local rules in `docs/CAPTURE.md`. Do not add an LLM parser unless asked.

- Stronger citations (CSL / BibTeX pack / Zotero) — R2
- External calendar ICS sync — LF2
- Orphan admin routes cleanup (users / teams / reporting)
- Offline vocab PWA
