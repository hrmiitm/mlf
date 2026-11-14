# MLF Study Room

Practice Machine Learning Foundations with a computer-based examination interface.

**Live site:** [hrmiitm.github.io/mlf](https://hrmiitm.github.io/mlf/)

## Features

- Two Quiz 1 papers: **15 March 2026** and **16 July 2026**.
- **Exam mode:** a 60-minute timer, saved responses, review flags, and automatic submission.
- **Practice mode:** immediate answer checking and worked explanations.
- A question palette showing visited, unanswered, answered, and review states.
- Same-page results with marks, correct/incorrect counts, and expandable solutions.
- Study guides covering the concepts and strategies for each paper.
- Per-question annotations: pen, highlighter, temporary laser, text, lines, arrows, rectangles, ellipses, and eraser.
- Question PNG/PDF downloads and a full annotated paper PDF after submission.
- Locally bundled mathematics rendering and fonts; no backend or account required.

Practice Assignment, Graded Assignment, Quiz 2, and Enter collections are available as placeholders for future papers.

## Run locally

Use **Node.js 22.12 or newer** and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

```sh
npm test          # Build and run the application tests
npm run build    # Create the production site in dist/
npm run preview  # Preview the production build
```

## Examination controls

In exam mode, choosing an option or typing a number creates an **unsaved response**.

| Control                     | Behaviour                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| Save & Next                 | Save the current response and advance                                                                    |
| Mark for Review & Next      | Save, flag the question, and advance                                                                     |
| Clear Response              | Clear the selection; save to remove an earlier saved answer                                              |
| Question palette / Previous | Navigate without saving changes to the current response                                                  |
| Submit test                 | Review saved-answer counts and submit; an unsaved current response can be saved in the submission dialog |

Answered questions marked for review are evaluated. When time expires, only saved answers are submitted. Practice mode saves choices immediately and lets you check each answer.

Correct answers receive full marks. Incorrect and unanswered questions receive zero marks. Multi-select questions require the exact set of correct options. The explanations and answer keys are independently derived study aids, not an official answer key.

Leaving a session or replacing a saved attempt uses an in-app confirmation. Cancelling keeps the current attempt. On small screens, paper collections are available through a compact selector and the question palette can be expanded when needed.

Attempts are saved in this browser on this device. The exam deadline continues after leaving or reloading the page. Clearing browser storage removes saved progress.

## Pen mode and downloads

Use **Pen mode** in the session’s top header to draw over the question and answer area with a mouse, touch, or stylus. The drawing tools expand inside that same header. Choose a tool, ink color, and stroke size. Pen and highlighter remember separate colors. On narrow screens, **Edit notes** groups undo, redo, clear, and extra writing space to keep the question visible. Select **Done drawing**, turn Pen mode off, or press **Escape** to select answers or expand comprehension passages. The header stays available as you scroll. The laser is a temporary pointer and is never saved or exported.

- **Text:** click the writing area, type a note, then select Add text. Cancel or Escape discards the unfinished note.
- **Diagrams:** drag with Line, Arrow, Rectangle, or Ellipse.
- **Eraser:** click or drag over an annotation to remove the entire stroke, shape, or text note.
- **Undo / Redo:** use the buttons or Ctrl/⌘ Z (Shift Z to redo) to reverse edits for the active question during this browser session. Clear question requires a second confirmation click and can be undone.
- **More space:** extend the active question’s drawing area for more working. In submitted review, click the question area to make that question active before using toolbar controls.

Notes save on completing each stroke or adding text, separately for each paper and question ID. They survive navigation, reloads, submission, and starting another attempt. Comprehension-passage expansion is saved alongside the question so its layout stays consistent when resuming or submitting. They are independent of saved exam responses. If browser storage is full or unavailable, the toolbar reports that notes are only in memory; export a copy before leaving. Clearing browser data removes local notes. Undo history and tool settings are not restored after a reload.

Open **Download** in the header for **Question as PDF** or **Question as PNG**. After submission, the same menu lets you select any question or download **Full paper as PDF** in paper order. Question selection and the palette keep the drawing toolbar and download target in sync. Download progress, success, or errors appear inside the menu; only one export runs at a time. Long questions continue across PDF pages. Exports contain rendered question content and annotations, not just a transparent drawing layer; collapsed passages and solutions stay collapsed. For the closest alignment with the original text, use the same viewport width when reviewing/exporting notes: the ink scales with width, while question text can reflow on smaller screens.

All note storage and export processing happens in the browser. The export libraries and math fonts are bundled with the site and load from the same site; no account or external export service is involved.

## Project structure

```text
papers/Q1/             Solved Markdown papers; source of question and solution content
src/papers.js          Paper registration and metadata
src/answer-keys.js     Explicit grading keys
src/parser.js          Markdown-to-question parser and grading functions
src/session.js         Drafts, saved responses, navigation, and review states
src/markdown.js        Markdown and TeX rendering
src/annotation-store.js Versioned local ink documents and edit history
src/annotations.js     SVG tools, pointer handling, and annotation controls
src/annotation-export.js Lazy browser PNG/PDF export
src/main.js            Screens and application interactions
src/style.css          Responsive examination interface
test/                 Paper, session, and DOM flow tests
.github/workflows/     GitHub Pages deployment
```

Only the solved Markdown papers are included as paper sources. Original PDFs and intermediate transcriptions are not included.

## Add a paper

1. Place the solved Markdown file in the appropriate `papers/` directory.
2. Follow the existing format: question headings, IDs, marks, types, lettered options, and a `<details>` solution after each question.
3. Register the paper and its metadata in `src/papers.js`.
4. Add independently checked grading answers in `src/answer-keys.js`.
5. Extend the parser and flow tests, then run `npm test`.

Comprehension passages are ungraded context. Their subquestions are the graded questions shown in the test navigator. Preserve question IDs and source numbering.

## Deployment

GitHub Pages is deployed by [Deploy to GitHub Pages](.github/workflows/deploy.yml).

A push to `main` runs a clean installation, builds the site, runs the tests, uploads `dist/`, and deploys it to Pages. The workflow can also be started manually from GitHub Actions. Vite uses relative asset paths for the `/mlf/` project URL.

For a fork, select **GitHub Actions** as the Pages source under **Settings → Pages** and update the live-site link in this README.

## Maintenance and credits

See [AGENTS.md](AGENTS.md) for repository conventions, [DESIGN.txt](DESIGN.txt) for the interface direction, and [NOTICE.txt](NOTICE.txt) for Unslop design-workflow attribution.
