# deutsch

A personal German-learning web app: spaced-repetition vocabulary practice
(flashcards + writing) and a conversation reader. Static site, no backend —
all progress lives in your browser's `localStorage`. Content is plain files in
the repo, loaded at build time.

## Add content

No code changes or manifest needed — just add files and rebuild.

**Vocabulary** — a CSV per unit in `vocabulary/`, named `<level>_<n>_<m>.csv`
(e.g. `a_1_1.csv` → unit **A1.1**, level **A1**). Columns: `English,German,Example`.

The app is type-agnostic: put every form of a word in the German cell,
`;`-separated, and they're practiced together.

```csv
English,German,Example
the man,der Mann; die Männer,Der Mann ist nett (The man is nice).
to read,lesen; hat gelesen,Ich habe schon das Buch gelesen (I have already read the book).
nice,nett,Der Mann ist nett (The man is nice).
```

- **Nouns:** `der Mann; die Männer` (singular with article; plural with article)
- **Verbs:** `lesen; hat gelesen` (infinitive; Perfekt)
- **Other:** a single form, e.g. `nett`
- Keep the inline English gloss in `()` in the Example column.

**Conversations** — a Markdown file per unit in `conversation/`, same naming
(`a_1_1.md`). `#` is the lesson heading; each `##` is a topic shown in the
sidebar.

```markdown
# A1.1

## Asking and Answering Names

**A:** Hallo! Wie heißt du?
**B:** Ich heiße Anna.
```

## Practice modes

Each (item, mode) is scheduled independently with SM-2 spaced repetition:

- **English → German** flashcards (recall the German forms)
- **German → English** flashcards (recall the meaning)
- **Writing** — type the whole German field; checked exactly except whitespace
  around `;`. Umlauts, ß, case, and articles must match.

Rate each card **Easy / Medium / Hard**; the schedule adjusts and persists in
the browser.

## Develop

```bash
npm install
npm run dev     # local dev server
npm run test    # SM-2 + writing-normalizer tests
npm run build   # type-check + production build to dist/
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes to GitHub Pages. The site is served at `<user>.github.io/deutsch/`
(`base: '/deutsch/'` in `vite.config.ts` — change it if the repo is renamed).
Enable Pages → Source: **GitHub Actions** in the repo settings once.
