# Repository instructions

## Product and scope

MLF Study Room is a static examination-practice site deployed to GitHub Pages.
Keep the application usable without a backend, API keys, accounts, or runtime
network dependencies. Preserve the existing MLF paper content and CBT-style
workflow when making unrelated changes.

## Architecture

- `papers/Q1/Solved-*.md` is the source of question text, options, study guides,
  and explanations. Do not introduce PDF files or intermediate transcriptions.
- `src/papers.js` contains lightweight metadata, dynamic loaders, and a request cache.
- `src/paper-data/` contains per-paper Markdown imports and parsing. Keep paper
  content, math libraries, and fonts out of the initial home-page bundle.
- `src/router.js` owns GitHub Pages-safe hash routes. Preserve direct reloads,
  Back/Forward navigation, local attempt IDs, and canonical result URLs.
- `src/parser.js` parses papers and grades answers. Comprehension passages are
  context for their subquestions, not standalone scored questions.
- `src/answer-keys.js` contains independently checked answer keys. Keep keys,
  worked solutions, and source question IDs consistent.
- `src/attempt-store.js` archives independent attempts and migrates the legacy save.
  Starting or retrying a paper must not erase older attempts or submitted results.
- `src/session.js` owns the response lifecycle. Keep session rules independent
  of DOM rendering.
- `src/main.js` renders screens and handles user interaction.
- `src/annotation-store.js` owns versioned per-attempt/per-paper/per-question ink and history;
  keep it separate from examination answers and session resets.
- `src/laser.js` owns transient pointer animation and progressive trail fading.
- `src/annotations.js` mounts SVG annotation tools and pointer events. Dispose
  listeners and resize observers before replacing the DOM.
- `src/annotation-export.js` lazily loads bundled image/PDF libraries; exports
  must include question content and saved ink and exclude temporary laser marks.
- `src/markdown.js` protects TeX before rendering Markdown with KaTeX.
- `src/style.css` defines the responsive interface.

## Behaviour to preserve

- Exam selections are drafts until Save & Next or Mark for Review & Next.
- Palette navigation and Previous do not commit unsaved changes.
- Answered-and-marked responses are evaluated; unanswered review flags are not.
- Clearing a saved answer requires saving the cleared response.
- Exam duration is 60 minutes, with a persistent deadline and automatic submission.
- Practice responses save immediately, with feedback on Check answer.
- Multi-select grading requires the exact set of correct options.
- Preserve zero as a valid numeric response and distinguish it from blank input.
- Results and collapsible worked solutions remain on the same page.
- Ink persists by attempt, paper, and question ID; new attempts start blank.
  Preserve legacy shared notebooks for older attempts without copying them into
  new attempts. Ink never changes grading.
- Laser marks are transient; cancelled pointer strokes and text drafts do not save.
- Preserve question PNG/PDF export and post-submission full-paper PDF export.
- PDF export packs short questions together and preserves ink while trimming blank
  writing space. Long questions may continue across page boundaries.
- Keep bounded annotation undo/redo history across reloads when storage permits.

## Design and accessibility

Keep MLF Study Room branding. Use neutral surfaces, restrained blue actions,
readable mathematics, and semantic palette colours with accompanying labels.
Keep all nine annotation tools directly visible in the compact pale drawing dock and the
single Download menu inside the session header. Preserve keyboard labels and
pressed states for the tool, color, and width buttons.
Keep download targets synchronized with the selected review question and prevent
concurrent exports. Preserve passage expansion with the local ink document.
Keep the numbered question palette, clear save-state messaging, visible keyboard
focus, accessible dialogs, and responsive mobile controls. Preserve the Unslop
credit in `NOTICE.txt` when adapting the design.

## Development and verification

Use Node.js 22.12 or newer and npm. Run `npm ci` for a clean install.

- `npm run dev`: local development
- `npm run build`: production output in `dist/`
- `npm test`: production build plus tests in `test/*.test.js`

For parser or answer changes, verify paper counts, marks, option labels,
comprehension context, numeric answers, and math rendering. For session changes,
cover saving, discarding drafts, clearing, review flags, and expiry. For UI
changes, exercise the affected DOM flow and use a browser for visual checks when
available. State any verification limit accurately.

Do not commit `node_modules/`, `dist/`, credentials, or the local `unslop/` skill
checkout. Commit the lockfile with dependency changes. Use relative deployment
asset paths so GitHub Pages project URLs work.

## Deployment

The Pages workflow deploys `main` after tests pass. Keep its least-privilege
permissions and avoid introducing a second deployment mechanism for routine
changes. Update README documentation when a user-facing control, setup command,
architecture component, or deployment procedure changes.
