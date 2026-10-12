# German Learning Web App — Implementation Plan

## Context

`grilling-brief.txt` specifies a personal German vocabulary + conversation
app, static-hosted on GitHub Pages, with content stored as editable files in
the repo (CSV for vocab, Markdown for conversations). The repo is greenfield:
empty `vocabulary/` and `conversation/` dirs, bare README, one commit. Goal:
daily German practice — flashcards, writing drills, SRS, and a conversation
reader — with no backend.

Decisions locked during grilling:

- **Stack:** Vite + React + TypeScript + Tailwind, deployed to GitHub Pages via a GitHub Action.
- **CSV:** 3 columns `English,German,Example`. Forms inside the German cell are `;`-separated (`der Mann; die Männer`, `lesen; hat gelesen`). No type column — the app is **type-agnostic**. Example column keeps its inline English gloss in `()`.
- **Flashcards:** front = English (or German for G→E); back = German forms split on `;` onto separate lines, then the example.
- **Writing mode:** type the **whole** German field; exact match except whitespace around `;` is normalized. Umlauts/ß/case/articles must be exact. A format hint at the top shows the expected shape.
- **SRS:** Anki-style **SM-2**, **independent schedule per (item, mode)** — recognition, recall, and production tracked separately.
- **Pacing:** **no new-card cap** — queue = all due reviews + all unseen items for the selected unit/mode.
- **Seed content:** create `a_1_1.csv` and `a_1_1.md` samples so the app runs end-to-end on first launch.

## Approach

### Content loading (no manifest, no runtime fetch)
Use Vite's build-time glob so adding a file to a content dir needs only a rebuild (which the Action does) — content stays fully separate from source:

```ts
const vocab = import.meta.glob('/vocabulary/*.csv', { query: '?raw', import: 'default', eager: true })
const convo = import.meta.glob('/conversation/*.md',  { query: '?raw', import: 'default', eager: true })
```

- `src/content.ts`: load the globs, parse CSV with **papaparse** (one dep — hand-rolling RFC-4180 quoting/UTF-8 is a correctness footgun, and example sentences may contain commas), parse unit label from filename via `^([a-z])_(\d+)_(\d+)$` → `A1.1`, group by level (`A1`, `A2`). For conversations, split raw Markdown on `^## ` to build topic nav; render the selected section with **react-markdown**.

### SRS (`src/srs.ts`)
- SM-2 per `(itemKey, mode)` where `itemKey = \`${unit}:${german}\``, `mode ∈ {e2g, g2e, write}`.
- Grade mapping (3 buttons → SM-2 quality): **Easy = 5, Medium = 4, Hard = 2** (Hard lapses: reset repetitions/interval, keep ease floor 1.3).
- State persisted as one JSON blob in **localStorage** (per-item SM-2 data is tiny; IndexedDB is overkill).
- Derived counts for the dashboard: learned / due / mastered (mastered = interval ≥ 21 days, Anki "mature"), shown per mode since schedules are per mode.
- Queue builder: due items (most overdue first) + unseen items for the selected unit+mode, no cap.

### UI (view-switching via `useState`, no router)
Three views in `src/App.tsx` — no sub-paths means no GitHub Pages refresh-404 problem, so a router is unneeded:
- `Dashboard.tsx` — choose Vocabulary Practice or Conversation Reading; show per-mode due/learned/mastered.
- `VocabPractice.tsx` — pick unit (grouped by level) → pick mode → run the SRS queue.
- `Flashcard.tsx` — E→G and G→E; flip to reveal, then Easy/Medium/Hard rate.
- `WritingPractice.tsx` — English prompt + format hint; exact-match check (whitespace around `;` normalized), feedback, then rate into SRS.
- `ConversationReader.tsx` — sidebar (level → unit → `##` topics) + main content; react-markdown render of the chosen section.
- Tailwind for responsive/mobile layout.

### Deploy
- `vite.config.ts`: `base: '/deutsch/'` (repo is `deutsch` → served at `<user>.github.io/deutsch/`), plus `@tailwindcss/vite` (Tailwind v4) and `@vitejs/plugin-react`.
- `.github/workflows/deploy.yml`: standard `actions/configure-pages` → `npm ci && npm run build` → `actions/upload-pages-artifact` (dist) → `actions/deploy-pages`, triggered on push to `main`.

## Files

**Create:**
- `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`
- `src/main.tsx`, `src/App.tsx`, `src/index.css`
- `src/content.ts`, `src/srs.ts`
- `src/components/{Dashboard,VocabPractice,Flashcard,WritingPractice,ConversationReader}.tsx`
- `src/srs.test.ts` — SM-2 interval progression + writing-normalizer asserts (vitest; the two non-trivial logic paths)
- `vocabulary/a_1_1.csv`, `conversation/a_1_1.md` (seed samples in the agreed format)
- `.github/workflows/deploy.yml`
- `.gitignore` (node_modules, dist)

**Modify:**
- `README.md` — how to add content, run locally, deploy.

**Dependencies:** react, react-dom, papaparse, react-markdown; dev: vite, @vitejs/plugin-react, typescript, tailwindcss + @tailwindcss/vite, vitest, @types/*.

## Verification

1. `npm install && npm run dev` → app loads at the dev URL with the seeded A1.1 unit visible.
2. **Vocab, all 3 modes:** E→G flip shows German forms on separate lines + example; G→E recalls English; writing accepts the exact German field and rejects a wrong umlaut/article. Rating Easy/Medium/Hard reschedules (reload page → due counts persist via localStorage).
3. **Per-mode SRS:** practicing an item in E→G does not change its `write` due date.
4. **Conversation:** sidebar lists A1.1 → topics (Asking and Answering Names, Introducing Yourself); selecting a topic renders that section.
5. `npm run test` → SM-2 and writing-normalizer asserts pass.
6. `npm run build` succeeds; push to `main` → Action deploys; live GitHub Pages URL loads with correct `/deutsch/` base (assets resolve, UTF-8 German chars render).
