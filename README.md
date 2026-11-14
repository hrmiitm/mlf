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

## Project structure

```text
papers/Q1/             Solved Markdown papers; source of question and solution content
src/papers.js          Paper registration and metadata
src/answer-keys.js     Explicit grading keys
src/parser.js          Markdown-to-question parser and grading functions
src/session.js         Drafts, saved responses, navigation, and review states
src/markdown.js        Markdown and TeX rendering
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
