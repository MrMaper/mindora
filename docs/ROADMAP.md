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

## Other known later items (not this doc’s focus)

- Stronger citations (CSL / BibTeX pack / Zotero) — R2
- External calendar ICS sync — LF2
- Orphan admin routes cleanup (users / teams / reporting)
- Offline vocab PWA
