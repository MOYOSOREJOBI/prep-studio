# Prep Studio

Prep Studio is a local-first study workspace for any course, topic, or mixed learning archive. You drop your own material into `course-content/`, run an analysis from the app, and Prep Studio turns that folder into a searchable library, generated notes, flashcards, quiz games, and export-ready review packs.

## Core Features

- analyzes a folder of your own resources instead of shipping with a hardcoded course
- supports flat or nested folder structures inside `course-content/`
- extracts text from PDFs and common text-based formats directly in the browser
- categorizes resources into notes, slides, labs, references, assignments, exam-style material, and code
- generates study overviews, key takeaways, pitfalls, retrieval prompts, and structured note sections
- creates flashcards and active-recall quiz sets from the analyzed material
- exports generated notes as Markdown or LaTeX and offers a print-friendly view for PDF saving
- includes a built-in focus timer and a light/dark mode toggle on the `Prep Studio` wordmark

## Supported File Types

Prep Studio currently analyzes:

- `.pdf`
- `.txt`
- `.md`, `.markdown`
- `.html`, `.htm`
- `.csv`
- `.json`
- `.tex`
- code files such as `.c`, `.cpp`, `.h`, `.py`, `.js`, `.ts`, `.tsx`, `.java`, `.asm`, `.rs`, `.go`

## Recommended Folder Setup

Place your study material in the project-level `course-content/` folder.

```text
course-content/
├── course-a/
│   ├── notes/
│   ├── labs/
│   └── slides/
└── course-b/
    └── anything-you-want/
```

You can also just drop everything directly into `course-content/` with no subfolders. Prep Studio uses file names, folder names, file types, and extracted text to infer structure.

## App Sections

- `#/studio` for the dashboard, workflow guidance, and generated highlights
- `#/library` for search, filtering, previews, and resource discovery
- `#/notes` for the generated note pack and export actions
- `#/flashcards` for flashcard review
- `#/games` for quiz sprint and source-hunt study games

## Getting Started

```bash
npm install
npm run dev
```

To create a production build:

```bash
npm run build
```

## Typical Workflow

1. Add your notes, labs, slides, references, code, or mixed material to `course-content/`.
2. Start the app.
3. Click `Analyze Folder`.
4. Select the `course-content` folder.
5. Review the generated library, notes, flashcards, and games.
6. Export the note pack as Markdown or LaTeX, or open the print view and save it as PDF.

## Repository Layout

```text
.
├── course-content/
├── src/
│   ├── app/store/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   └── types/
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.app.json
└── vite.config.ts
```

## Implementation Notes

The browser-side analysis pipeline lives in:

- `src/lib/studioAnalysis.ts`
- `src/types/studio.ts`
- `src/app/store/useStudioStore.ts`

The main app shell and views live in:

- `src/App.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/ContentPage.tsx`
- `src/pages/NotesPage.tsx`
- `src/pages/FlashcardsPage.tsx`
- `src/pages/GamesPage.tsx`

## Notes

- The `course-content/` folder is intentionally ignored by git so you can keep your private study material local.
- Prep Studio is currently a client-side app. Generated PDFs are created through the browser print flow from the printable notes view.
