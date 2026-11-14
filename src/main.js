import { createAttemptStore, attemptId } from "./attempt-store.js";
import {
  annotationToolbar,
  sessionDownloads,
  mountAnnotations,
} from "./annotations.js";
import { exportAnnotations } from "./annotation-export.js";
import "./style.css";
import "katex/dist/katex.min.css";
import { papers } from "./papers.js";
import { gradeQuestion, isAnswered } from "./parser.js";
import { renderMarkdown } from "./markdown.js";
import {
  initialAttempt,
  currentResponse,
  setResponse,
  commitResponse,
  visitQuestion,
  responseChanged,
  questionStatus,
  statusCounts,
} from "./session.js";

const app = document.querySelector("#app");
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const inline = (value) => renderMarkdown(value).replace(/^<p>|<\/p>\s*$/g, "");
const categories = [
  {
    id: "practice",
    label: "Practice Assignment",
    description: "Topic-wise exercises",
    count: 0,
  },
  {
    id: "graded",
    label: "Graded Assignment",
    description: "Assignment practice",
    count: 0,
  },
  {
    id: "q1",
    label: "Quiz 1",
    description: "Full-length practice papers",
    count: papers.length,
  },
  {
    id: "q2",
    label: "Quiz 2",
    description: "Full-length practice papers",
    count: 0,
  },
  {
    id: "end",
    label: "Enter",
    description: "End-term examination practice",
    count: 0,
  },
];
const statusLabels = {
  answered: "Answered",
  "not-answered": "Not answered",
  "not-visited": "Not visited",
  review: "Marked for review",
  "answered-review": "Answered & marked for review",
};
let attemptStorage;
try {
  attemptStorage = window.localStorage;
} catch {
  /* In-memory attempts remain usable. */
}
const attempts = createAttemptStore(attemptStorage);
let state = {
  screen: "home",
  section: null,
  paper: null,
  mode: null,
  answers: {},
  checked: {},
  marked: {},
  visited: {},
  index: 0,
  dialog: null,
  guide: false,
};
let disposeAnnotations = () => {};
let timerId;
let pendingIntent = null;
let dialogReturnFocus = null;

function store() {
  if (state.screen !== "session") return;
  const saved = attempts.save(state);
  const message = app.querySelector(".attempt-storage-status");
  if (message) {
    message.hidden = saved;
    message.textContent = saved
      ? ""
      : "Browser storage is unavailable. Keep this tab open and download your work.";
  }
}
function restore(id) {
  try {
    const saved = attempts.get(id);
    const p = papers.find((p) => p.id === saved?.paper);
    if (
      saved?.screen !== "session" ||
      !p ||
      !["practice", "exam"].includes(saved.mode)
    )
      return null;
    const base = initialAttempt(p, saved.mode);
    const attempt = {
      ...base,
      ...saved,
      marked: saved.marked ?? {},
      visited: saved.visited ?? {},
      dialog: null,
    };
    attempt.index = Math.max(
      0,
      Math.min(p.questions.length - 1, attempt.index),
    );
    const q = p.questions[attempt.index];
    attempt.visited[q.id] = true;
    attempt.draft =
      saved.draft ?? saved.answers?.[q.id] ?? (q.type === "SA" ? "" : []);
    return attempt;
  } catch {
    return null;
  }
}
let savedSession = restore();
const paper = () => papers.find((p) => p.id === state.paper);
const question = () => paper().questions[state.index];
const countAnswered = () =>
  paper().questions.filter((q) => isAnswered(state.answers[q.id])).length;
const category = (id) => categories.find((c) => c.id === id);
function clock() {
  const seconds = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
function show(screen) {
  state.screen = screen;
  state.dialog = null;
  state.guide = false;
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function breadcrumb(parts) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><button data-action="home">Home</button>${parts.map((part) => `<span aria-hidden="true">/</span><span>${esc(part)}</span>`).join("")}</nav>`;
}
function header() {
  const active = state.screen === "session";
  return `<header class="portal-header"><div class="portal-header-inner"><button class="brand" data-action="home" aria-label="MLF Study Room home"><span class="brand-square">MLF</span><span><strong>MLF Study Room</strong><small>Machine Learning Foundations</small></span></button><div class="header-meta"><span class="local-status"><i></i> ${active ? (state.submitted ? "Attempt completed" : state.mode === "exam" ? "Timed examination" : "Practice session") : "Practice portal"}</span><span class="header-divider"></span><span>Quiz 1 · 2026</span></div></div></header>`;
}
function footer() {
  return `<footer class="portal-footer"><span>MLF Study Room</span><span>Independent practice portal · Progress stored on this device</span></footer>`;
}
function nav() {
  const links = categories
    .map(
      (c) =>
        `<button class="${state.section === c.id ? "active" : ""}" data-action="section" data-id="${c.id}" ${state.section === c.id ? 'aria-current="page"' : ""}>${c.label}${c.count ? `<span>${c.count}</span>` : ""}</button>`,
    )
    .join("");
  return `<nav class="collection-tabs" aria-label="Paper collections">${links}</nav><details class="collection-menu"><summary><span>Collections <strong>${esc(category(state.section)?.label ?? "All assessments")}</strong></span><span aria-hidden="true">⌄</span></summary><nav aria-label="Paper collections">${links}</nav></details>`;
}

function attemptHistory(paperId) {
  const saved = attempts
    .list(paperId)
    .filter((a) => papers.some((p) => p.id === a.paper));
  if (!saved.length) return "";
  return `<details class="attempt-history"><summary>Saved attempts <span>${saved.length}</span></summary><div>${saved
    .map((a) => {
      const p = papers.find((p) => p.id === a.paper);
      const answered = p.questions.filter((q) =>
        isAnswered(a.answers[q.id]),
      ).length;
      const date = new Date(a.startedAt || a.updatedAt).toLocaleString(
        "en-IN",
        { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
      );
      return `<div class="attempt-row"><div><strong>${p.date} · ${a.mode === "exam" ? "Exam" : "Practice"}</strong><p>${a.submitted ? "Submitted" : "In progress"} · ${answered}/${p.questions.length} answered · Started ${esc(date)}</p></div><button class="btn btn-secondary" data-action="resume" data-attempt-id="${esc(a.attemptId)}">${a.submitted ? "Review result" : "Resume attempt"}</button></div>`;
    })
    .join("")}</div></details>`;
}
function home() {
  return `<main class="portal-shell">${savedSession && !savedSession.submitted ? `<section class="resume-panel"><div><strong>Continue your saved attempt</strong><p>${papers.find((p) => p.id === savedSession.paper)?.date} · ${savedSession.mode === "exam" ? "Exam mode" : "Practice mode"}</p></div><button class="btn btn-primary" data-action="resume">Resume attempt →</button></section>` : ""}<div class="page-heading"><div><p class="overline">Student practice portal</p><h1>Machine Learning Foundations</h1><p>Choose an assessment below. Take a timed test or practice with worked solutions.</p></div><div class="portal-summary"><strong>2</strong><span>papers available<br><b>Quiz 1 · MLF</b></span></div></div>${attemptHistory()}<div class="home-columns"><section class="panel"><div class="panel-heading"><h2>Assessment collections</h2><span>2026</span></div><div class="collection-list">${categories.map((c, i) => `<button class="collection-row" data-action="section" data-id="${c.id}"><span class="row-index">${i + 1}</span><span class="row-description"><strong>${c.label}</strong><small>${c.description}</small></span><span class="availability ${c.count ? "available" : ""}">${c.count ? `${c.count} papers` : "No papers yet"}</span><span class="row-arrow" aria-hidden="true">→</span></button>`).join("")}</div></section><aside class="panel getting-started"><div class="panel-heading"><h2>Before you begin</h2></div><ol class="steps"><li><strong>Select a paper</strong><span>Each paper includes its original questions, answer options, and solutions.</span></li><li><strong>Choose your mode</strong><span>Exam mode has a 60-minute timer. Practice mode lets you check each answer.</span></li><li><strong>Review your attempt</strong><span>See the score, question-wise feedback, and explanations on the same page.</span></li></ol><div class="info-note"><strong>Need a refresher?</strong><p>Open a paper’s study guide to review the concepts and solving strategies first.</p></div></aside></div></main>`;
}
function collectionPage() {
  const c = category(state.section);
  return `<main class="portal-shell">${breadcrumb([c.label])}<div class="page-heading"><div><p class="overline">Assessment collection</p><h1>${c.label}</h1><p>${c.count ? "Select a paper to see instructions and choose a test mode." : "Papers for this collection will appear here when added."}</p></div><span class="count-label">${c.count} ${c.count === 1 ? "paper" : "papers"} available</span></div>${nav()}${c.count ? `<section class="panel paper-list"><div class="panel-heading"><h2>Available question papers</h2><span>Machine Learning Foundations</span></div><div class="paper-table-head"><span>Examination</span><span>Questions</span><span>Marks</span><span>Duration</span><span></span></div>${papers.map((p) => `<article class="paper-row"><div><span class="paper-code">MLF / Quiz 1</span><h2>${p.date}</h2><p>Includes a study guide and worked solutions</p></div><span class="paper-value" data-label="Questions">${p.questions.length}</span><span class="paper-value" data-label="Marks">${p.totalMarks}</span><span class="paper-value" data-label="Duration">60 min</span><button class="btn btn-primary" data-action="paper" data-id="${p.id}">Open paper →</button></article>`).join("")}</section><p class="page-note">Question counts exclude the ungraded comprehension passages; each passage is shown with its subquestions.</p>` : `<section class="panel empty-panel"><h2>No papers in this collection</h2><p>You can start with the two available Quiz 1 papers.</p><button class="btn btn-primary" data-action="section" data-id="q1">View Quiz 1 papers →</button></section>`}</main>`;
}
function paperPage() {
  const p = paper();
  if (state.guide)
    return `<main class="portal-shell reading-shell">${breadcrumb(["Quiz 1", p.date, "Study guide"])}<button class="text-button" data-action="close-guide">← Back to instructions</button><div class="page-heading"><div><p class="overline">MLF / Quiz 1</p><h1>Topics &amp; solving strategies</h1><p>${p.date}</p></div></div><article class="panel reading-panel prose">${renderMarkdown(p.guide)}</article></main>`;
  return `<main class="portal-shell">${breadcrumb(["Quiz 1", p.date])}<div class="page-heading"><div><p class="overline">Quiz 1 · Machine Learning Foundations</p><h1>${p.date}</h1><p>Read the instructions, then select how you want to attempt this paper.</p></div><button class="btn btn-secondary" data-action="guide">Open study guide</button></div><div class="exam-facts"><div><span>Duration</span><strong>60 minutes</strong></div><div><span>Questions</span><strong>${p.questions.length}</strong></div><div><span>Maximum marks</span><strong>${p.totalMarks}</strong></div><div><span>Question types</span><strong>MCQ · MSQ · Numeric</strong></div></div>${attemptHistory(p.id)}<div class="setup-columns"><section class="panel"><div class="panel-heading"><h2>General instructions</h2></div><ol class="instructions-list"><li>Choose one answer for MCQs and all correct answers for MSQs. Enter a number for numerical questions.</li><li>In exam mode, click <strong>Save &amp; Next</strong> to save a response. Selecting an option alone does not save it. Navigating through the palette discards unsaved changes.</li><li><strong>Mark for Review &amp; Next</strong> saves the response and flags the question. Answered questions marked for review are included in evaluation.</li><li><strong>Clear Response</strong> removes the current selection. In exam mode, save the cleared response to replace an earlier saved answer.</li><li>The exam submits automatically when the timer reaches zero. Only saved answers are evaluated.</li><li>This MLF paper awards full marks for a completely correct answer, zero otherwise. MSQs require the exact set of correct choices. There is no negative marking in this practice portal.</li></ol></section><aside class="mode-options"><article class="panel mode-option"><div class="mode-title"><h2>Practice mode</h2><span class="mode-label">Untimed</span></div><p>Work through the same paper with immediate feedback and a solution after each answer.</p><button class="btn btn-practice" data-action="start" data-mode="practice">Start practice →</button></article><article class="panel mode-option"><div class="mode-title"><h2>Exam mode</h2><span class="mode-label">Timed</span></div><p>Attempt the full paper with a countdown timer and a question palette. Solutions appear after submission.</p><ul><li>60-minute test</li><li>Save responses and flag questions for review</li><li>Score and solutions after submission</li></ul><button class="btn btn-primary" data-action="start" data-mode="exam">Begin exam →</button></article></aside></div></main>`;
}
function feedbackFor(q) {
  if (!isAnswered(state.answers[q.id])) return "unanswered";
  return gradeQuestion(q, state.answers[q.id]) ? "correct" : "incorrect";
}
function solution(q) {
  return `<details class="solution"><summary><span>View solution &amp; concept</span><span aria-hidden="true">+</span></summary><div class="solution-content prose">${renderMarkdown(q.solution)}</div></details>`;
}
function questionCard(q, index, review = false) {
  const answer = review ? state.answers[q.id] : currentResponse(state, q);
  const checked = review || Boolean(state.checked[q.id]);
  const result = checked ? feedbackFor(q) : "";
  let input = "";
  if (q.type === "SA") {
    input = `<div class="numeric-block"><label for="answer-${q.id}">Enter your numerical answer</label><input id="answer-${q.id}" data-numeric="${q.id}" type="number" inputmode="decimal" step="any" placeholder="Your answer" value="${esc(answer ?? "")}" ${review ? "disabled" : ""}/>${checked ? `<span class="numeric-verdict ${result}">${result === "correct" ? "Correct answer" : result === "incorrect" ? "Incorrect answer" : "Not answered"}</span>` : ""}${checked && result !== "correct" ? `<p class="expected-answer">Correct answer: <strong>${q.answer}</strong></p>` : ""}</div>`;
  } else {
    const selected = Array.isArray(answer) ? answer : [];
    input = `<fieldset class="option-list" ${review ? "disabled" : ""}><legend class="visually-hidden">${q.type === "MSQ" ? "Select all correct options" : "Select one option"}</legend>${q.options
      .map((o) => {
        const chosen = selected.includes(o.label),
          correct = q.answer.includes(o.label);
        const cls = checked
          ? correct
            ? "is-correct"
            : chosen
              ? "is-incorrect"
              : ""
          : chosen
            ? "is-selected"
            : "";
        return `<label class="option ${cls}"><input type="${q.type === "MCQ" ? "radio" : "checkbox"}" name="question-${q.id}" value="${o.label}" data-option="${q.id}" ${chosen ? "checked" : ""}/><span class="option-control" aria-hidden="true">${checked && correct ? "✓" : checked && chosen ? "×" : ""}</span><span class="option-letter">(${o.label.toLowerCase()})</span><span class="option-copy prose">${renderMarkdown(o.text)}</span>${checked && correct ? '<span class="option-state">Correct</span>' : checked && chosen ? '<span class="option-state">Your answer</span>' : ""}</label>`;
      })
      .join("")}</fieldset>`;
  }
  return `<article class="question-card ${review ? "review-card" : ""}" id="question-${q.number}"><header class="question-toolbar"><div><h2>Question ${q.number}</h2><span>${q.type === "MCQ" ? "Single correct option" : q.type === "MSQ" ? "One or more correct options" : "Numerical answer"}</span></div><div class="marks">Marks: <strong>${q.marks}</strong>${review ? `<span class="verdict ${result}">${result === "correct" ? "Correct" : result === "incorrect" ? "Incorrect" : "Unanswered"}</span>` : ""}</div></header><div class="question-content"><div class="annotation-surface" data-annotation-question="${q.id}">${q.context ? `<details class="context" open><summary>Comprehension passage · Question ${q.context.number}<span aria-hidden="true">⌄</span></summary><div class="prose">${renderMarkdown(q.context.body)}</div></details>` : ""}<div class="question-text prose">${renderMarkdown(q.body)}</div><section class="response-panel" aria-label="Your answer"><p class="response-instruction"><strong>Your answer</strong><span>${q.type === "MSQ" ? "Select all correct options" : q.type === "MCQ" ? "Select one option" : "Use a minus sign or decimal point where needed"}</span></p>${input}${!review && state.mode === "practice" ? `<button class="btn btn-primary check-btn" data-action="check" ${!isAnswered(answer) ? "disabled" : ""}>Check answer</button>` : ""}</section></div>${checked ? `<div class="feedback ${result}" role="status"><strong>${result === "correct" ? "Correct answer" : result === "incorrect" ? "Incorrect answer" : "Not answered"}</strong><span>${result === "correct" ? `${q.marks} of ${q.marks} marks` : "Review the worked solution below."}</span></div>${solution(q)}` : ""}<p class="question-id">Question ID: ${q.id}</p></div></article>`;
}
function countsView(counts) {
  return `<dl class="status-list">${Object.entries(statusLabels)
    .map(
      ([key, label]) =>
        `<div><dt><span class="status-symbol ${key}" aria-hidden="true">${key === "answered-review" ? "✓" : ""}</span>${label}</dt><dd>${counts[key]}</dd></div>`,
    )
    .join("")}</dl>`;
}
function palette() {
  const p = paper();
  return `<aside class="question-sidebar"><div class="candidate-block"><div><strong>Current attempt</strong><span>${p.date}</span></div><span class="candidate-mode">${state.submitted ? "Review" : state.mode === "exam" ? "Exam" : "Practice"}</span></div><details class="palette-panel" ${window.innerWidth < 760 ? "" : "open"}><summary><span>Question palette</span><span aria-hidden="true">⌄</span></summary><div class="palette-details">${state.submitted ? `<div class="review-legend"><span><i class="correct"></i>Correct</span><span><i class="incorrect"></i>Incorrect</span><span><i class="unanswered"></i>Unanswered</span></div>` : countsView(statusCounts(state, p))}<div class="palette-section">Machine Learning Foundations</div><nav class="question-grid" aria-label="Question palette">${p.questions
    .map((q, i) => {
      const status = state.submitted
        ? feedbackFor(q)
        : questionStatus(state, q);
      return `<button class="nav-number ${status} ${state.index === i && !state.submitted ? "current" : ""}" data-action="jump" data-index="${i}" aria-label="Question ${q.number}, ${state.submitted ? status : statusLabels[status]}" ${state.index === i && !state.submitted ? 'aria-current="step"' : ""}>${q.number}${status === "answered-review" ? '<span class="review-tick" aria-hidden="true">✓</span>' : ""}</button>`;
    })
    .join(
      "",
    )}</nav>${!state.submitted ? `<p class="palette-note">${state.mode === "exam" ? "Answered questions marked for review are included in your score" : "Check an answer to view its solution"}</p><button class="btn btn-secondary submit-palette" data-action="${state.mode === "exam" ? "confirm" : "practice-finish"}">${state.mode === "exam" ? "Submit test" : "Finish practice"}</button>` : ""}</div></details></aside>`;
}
function resultSummary() {
  const p = paper(),
    correct = p.questions.filter((q) => feedbackFor(q) === "correct").length,
    incorrect = p.questions.filter(
      (q) => feedbackFor(q) === "incorrect",
    ).length;
  const unanswered = p.questions.length - correct - incorrect;
  const score = p.questions.reduce(
      (n, q) => n + (gradeQuestion(q, state.answers[q.id]) ? q.marks : 0),
      0,
    ),
    percent = Math.round((score / p.totalMarks) * 100);
  return `<section class="results-card" id="results"><div class="results-title"><div><p class="overline">Attempt completed</p><h2>Test result</h2><p>${p.date} · Quiz 1${state.timedOut ? " · Time is up. The test was submitted automatically." : ""}</p></div><div class="result-score"><strong>${score}<span> / ${p.totalMarks}</span></strong><span>Total score · ${percent}%</span></div></div><dl class="result-statistics"><div><dt>Correct</dt><dd class="green-text">${correct}</dd></div><div><dt>Incorrect</dt><dd class="red-text">${incorrect}</dd></div><div><dt>Unanswered</dt><dd>${unanswered}</dd></div><div><dt>Questions</dt><dd>${p.questions.length}</dd></div></dl><div class="results-bar" aria-label="${correct} correct, ${incorrect} incorrect, ${unanswered} unanswered"><i style="width:${(correct / p.questions.length) * 100}%"></i><i style="width:${(incorrect / p.questions.length) * 100}%"></i><i style="width:${(unanswered / p.questions.length) * 100}%"></i></div><p>Scroll up or use the question palette to review your responses. Open a solution to see the explanation and concept.</p><div class="result-actions"><button class="btn btn-primary" data-action="review-top">Review answers ↑</button><button class="btn btn-secondary" data-action="retry">Start another attempt</button></div><small>Full marks for a fully correct answer; zero for an incorrect or unanswered question. Multi-select requires the exact set of correct options.</small></section>`;
}
function sessionPage() {
  const p = paper(),
    q = question();
  return `<main class="session-shell ${state.submitted ? "submitted" : ""}"><header class="session-topbar"><div class="session-header-main"><button class="session-brand" data-action="home" aria-label="MLF Study Room home">MLF<span>Study Room</span></button><div class="session-paper"><h1>Quiz 1 · ${p.date}</h1><p>Machine Learning Foundations · ${state.mode === "exam" ? "Exam" : "Practice"}</p></div><div class="exam-clock">${state.mode === "exam" && !state.submitted ? `<span>Time left</span><strong id="timer">${clock()}</strong>` : `<span>${state.submitted ? "Test submitted" : "No time limit"}</span><strong>${countAnswered()} / ${p.questions.length}</strong>`}</div><nav class="session-tools" aria-label="Session actions"><button data-ink-toggle aria-pressed="false" aria-controls="annotation-tools">Pen mode</button>${sessionDownloads(p, q, state.submitted)}<button data-action="instructions">Instructions</button><button data-action="question-paper" title="View question paper">Paper</button><button data-action="leave" title="Leave this attempt">Leave</button></nav></div>${annotationToolbar()}<p class="attempt-storage-status" role="status" hidden></p></header><div class="session-body"><div class="question-column">${state.submitted ? p.questions.map((q, i) => questionCard(q, i, true)).join("") + resultSummary() : `<div class="question-workspace">${questionCard(q, state.index)}</div><div class="response-save-state" role="status">${state.mode === "exam" ? (responseChanged(state, q) ? '<span class="unsaved-dot"></span> Unsaved response · Save before changing questions' : "Use Save &amp; Next to save your response before navigating.") : "Responses save automatically · Check an answer to view its explanation"}</div><footer class="question-actions"><div class="secondary-actions"><button class="btn btn-review" data-action="mark-next">Mark for Review &amp; Next</button><button class="btn btn-secondary" data-action="clear">Clear Response</button></div><div class="primary-actions"><button class="btn btn-secondary previous-btn" data-action="previous" ${state.index === 0 ? "disabled" : ""}>Previous</button><button class="btn btn-primary" data-action="${state.mode === "exam" ? "save-next" : state.index === p.questions.length - 1 ? "practice-finish" : "next"}">${state.mode === "exam" ? "Save & Next" : state.index === p.questions.length - 1 ? "Finish practice" : "Next question"} →</button></div></footer>`}</div>${palette()}</div></main>`;
}
function modal() {
  if (!state.dialog) return "";
  const p = paper();
  let title = "",
    body = "",
    actions = "";
  if (state.dialog === "submit") {
    title = "Submit test";
    body = `<p class="modal-lead">Review your saved responses before submitting</p>${countsView(statusCounts(state, p))}<p class="submission-total">Saved answers: <strong>${countAnswered()} of ${p.questions.length}</strong></p>${responseChanged(state, question()) ? `<div class="unsaved-warning"><strong>The current response has unsaved changes.</strong><p>Save it now to include the change in your result.</p><button class="btn btn-secondary" data-action="save-current">Save current response</button></div>` : ""}<p class="modal-footnote">Answered questions marked for review will be evaluated. You cannot change responses after submission.</p>`;
    actions = `<button class="btn btn-secondary" data-action="cancel">Return to test</button><button class="btn btn-primary" data-action="submit">Submit saved answers</button>`;
  } else if (state.dialog === "leave") {
    title =
      state.mode === "exam"
        ? "Leave this test?"
        : "Leave this practice session?";
    body = `<p class="modal-lead">Your progress stays on this device, so you can resume the attempt later.${state.mode === "exam" ? " The 60-minute exam timer will keep running." : ""}</p>`;
    actions =
      '<button class="btn btn-secondary" data-action="cancel">Continue session</button><button class="btn btn-primary" data-action="confirm-leave">Leave session</button>';
  } else if (state.dialog === "replace") {
    title = "Start a new attempt?";
    body = `<p class="modal-lead">Your previous attempt stays in Saved attempts, including its answers and result. A new ${pendingIntent?.mode === "exam" ? "60-minute exam" : "practice attempt"} starts with blank answers.${savedSession?.mode === "exam" ? " The earlier exam’s deadline continues running." : ""}</p>`;
    actions =
      '<button class="btn btn-secondary" data-action="cancel">Go back</button><button class="btn btn-primary" data-action="confirm-replace">Start new attempt</button>';
  } else if (state.dialog === "instructions") {
    title = "Test instructions";
    body = `<ol class="instructions-list"><li>The examination lasts <strong>60 minutes</strong>. The timer continues if you leave or reload the page.</li><li>Select an option or enter a number, then use <strong>Save &amp; Next</strong> in exam mode. Unsaved changes are discarded when you jump to another question.</li><li><strong>Mark for Review &amp; Next</strong> saves and flags the response. Answered questions marked for review are included in your score</li><li><strong>Clear Response</strong> removes your current selection. Save the cleared response to remove a previously saved answer.</li><li>The question palette distinguishes not visited, not answered, answered, marked for review, and answered &amp; marked for review.</li><li>In practice mode, answers save immediately. Use <strong>Check answer</strong> to see feedback and the worked solution.</li><li>Full marks are awarded only for a completely correct answer. There is no negative marking in this portal.</li></ol>`;
    actions =
      '<button class="btn btn-primary" data-action="cancel">Return to test</button>';
  } else {
    title = "Question paper";
    body = `<p class="modal-lead">${p.date} · ${p.questions.length} graded questions · ${p.totalMarks} marks</p>${p.questions.map((q) => `<section class="paper-preview-question"><h3>Question ${q.number} <small>${q.type} · ${q.marks} marks</small></h3>${q.context ? `<details class="context"><summary>Comprehension passage</summary><div class="prose">${renderMarkdown(q.context.body)}</div></details>` : ""}<div class="prose">${renderMarkdown(q.body)}</div>${q.options.length ? `<ol class="paper-preview-options" type="a">${q.options.map((o) => `<li class="prose">${renderMarkdown(o.text)}</li>`).join("")}</ol>` : ""}</section>`).join("")}`;
    actions =
      '<button class="btn btn-primary" data-action="cancel">Return to test</button>';
  }
  return `<div class="modal-backdrop"><section class="modal ${state.dialog === "question-paper" ? "wide-modal" : ""}" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><header><div><span class="dialog-context">MLF Study Room</span><h2 id="dialog-title">${title}</h2></div><button data-action="cancel" aria-label="Close dialog">×</button></header><div class="modal-body">${body}</div><footer>${actions}</footer></section></div>`;
}
function render() {
  disposeAnnotations();
  const focusBefore = focusSelector(document.activeElement);
  const dialogWasOpen = Boolean(app.querySelector('[role="dialog"]'));
  const content =
    state.screen === "home"
      ? home()
      : state.screen === "section"
        ? collectionPage()
        : state.screen === "paper"
          ? paperPage()
          : sessionPage();
  document.body.classList.toggle("in-session", state.screen === "session");
  document.body.classList.toggle(
    "is-active-test",
    state.screen === "session" && !state.submitted,
  );
  document.body.classList.toggle("dialog-open", Boolean(state.dialog));
  app.innerHTML =
    (state.screen === "session" ? "" : header()) +
    content +
    (state.screen === "session" ? "" : footer()) +
    modal();
  if (state.screen === "session") {
    const p = paper();
    disposeAnnotations = mountAnnotations(
      app,
      p.id,
      (cards, format, questionId, progress) =>
        exportAnnotations(
          cards,
          format,
          `MLF-${p.id}-${questionId ? `Q${cards[0]?.id.replace("question-", "")}` : "annotated-paper"}`,
          `Quiz 1 - ${p.date}`,
          progress,
        ),
    );
  } else disposeAnnotations = () => {};
  if (state.dialog)
    for (const element of app.children)
      if (!element.classList.contains("modal-backdrop"))
        element.setAttribute("inert", "");
  store();
  let target;
  if (state.dialog) {
    target =
      dialogWasOpen && focusBefore
        ? app.querySelector(`[role="dialog"] ${focusBefore}`)
        : null;
    target ??=
      app.querySelector('[role="dialog"] footer [data-action="cancel"]') ??
      app.querySelector('[role="dialog"] footer button');
  } else if (dialogWasOpen && dialogReturnFocus) {
    target = app.querySelector(dialogReturnFocus);
    dialogReturnFocus = null;
  } else if (focusBefore) target = app.querySelector(focusBefore);
  target?.focus({ preventScroll: true });
}

function begin(mode) {
  state = {
    ...initialAttempt(paper(), mode),
    attemptId: attemptId(),
    startedAt: Date.now(),
    section: "q1",
  };
  savedSession = null;
  pendingIntent = null;
  render();
  window.scrollTo(0, 0);
  startTimer();
}
function start(mode) {
  if (savedSession && !savedSession.submitted) {
    openDialog("replace", { mode });
    return;
  }
  begin(mode);
}
function focusSelector(element) {
  if (element?.dataset.option)
    return `input[data-option="${element.dataset.option}"][value="${element.value}"]`;
  if (element?.dataset.numeric)
    return `input[data-numeric="${element.dataset.numeric}"]`;
  if (!element?.dataset.action) return null;
  let selector = `[data-action="${element.dataset.action}"]`;
  for (const key of ["id", "mode", "index"])
    if (element.dataset[key] !== undefined)
      selector += `[data-${key}="${element.dataset[key]}"]`;
  return selector;
}
function openDialog(name, intent = null) {
  dialogReturnFocus = focusSelector(document.activeElement);
  pendingIntent = intent;
  state.dialog = name;
  render();
}
function closeDialog() {
  state.dialog = null;
  pendingIntent = null;
  render();
}

function startTimer() {
  clearInterval(timerId);
  if (state.mode !== "exam" || state.submitted) return;
  timerId = setInterval(() => {
    if (state.screen !== "session" || state.mode !== "exam" || state.submitted)
      return;
    if (Date.now() >= state.deadline) {
      state.timedOut = true;
      submit();
      return;
    }
    const timer = app.querySelector("#timer");
    if (timer) timer.textContent = clock();
    app
      .querySelector(".exam-clock")
      ?.classList.toggle(
        "time-low",
        state.deadline - Date.now() < 5 * 60 * 1000,
      );
  }, 1000);
}
function submit() {
  state.submitted = true;
  state.dialog = null;
  clearInterval(timerId);
  render();
  requestAnimationFrame(() =>
    app
      .querySelector("#results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" }),
  );
}
function go(index) {
  visitQuestion(state, paper(), index);
  render();
  app.querySelector(".question-workspace")?.scrollTo?.({ top: 0 });
  window.scrollTo({ top: 0, behavior: "instant" });
}
function finishLeaving(destination) {
  savedSession = restore();
  pendingIntent = null;
  if (destination === "home") state.section = null;
  show(destination);
}
function leave(destination = "paper") {
  if (!state.submitted) {
    openDialog("leave", { destination });
    return;
  }
  finishLeaving(destination);
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === "home") {
    if (state.screen === "session") leave("home");
    else {
      savedSession = restore();
      state.section = null;
      show("home");
    }
  }
  if (action === "confirm-leave")
    finishLeaving(pendingIntent?.destination ?? "paper");
  if (action === "confirm-replace") begin(pendingIntent.mode);
  if (action === "section") {
    state.section = button.dataset.id;
    show("section");
  }
  if (action === "paper") {
    state.paper = button.dataset.id;
    show("paper");
  }
  if (action === "guide") {
    state.guide = true;
    render();
    window.scrollTo(0, 0);
  }
  if (action === "close-guide") {
    state.guide = false;
    render();
    window.scrollTo(0, 0);
  }
  if (action === "start") start(button.dataset.mode);
  if (action === "check") {
    state.checked[question().id] = true;
    render();
  }
  if (action === "clear") {
    const q = question();
    setResponse(state, q, q.type === "SA" ? "" : []);
    render();
    app.querySelector("[data-numeric]")?.focus();
  }
  if (action === "save-next") {
    commitResponse(state, question());
    if (state.index === paper().questions.length - 1) {
      openDialog("submit");
    } else go(state.index + 1);
  }
  if (action === "save-current") {
    commitResponse(state, question(), Boolean(state.marked[question().id]));
    render();
  }
  if (action === "mark-next") {
    commitResponse(state, question(), true);
    go(state.index === paper().questions.length - 1 ? 0 : state.index + 1);
  }
  if (action === "next") go(state.index + 1);
  if (action === "previous") go(state.index - 1);
  if (action === "jump") {
    if (state.submitted)
      app
        .querySelector(
          `#question-${paper().questions[Number(button.dataset.index)].number}`,
        )
        ?.scrollIntoView({ behavior: "smooth" });
    else go(Number(button.dataset.index));
  }
  if (action === "confirm") openDialog("submit");
  if (action === "instructions") openDialog("instructions");
  if (action === "question-paper") openDialog("question-paper");
  if (action === "cancel") closeDialog();
  if (action === "submit" || action === "practice-finish") submit();
  if (action === "review-top")
    app
      .querySelector(".question-column")
      ?.scrollIntoView({ behavior: "smooth" });
  if (action === "retry") {
    savedSession = restore();
    show("paper");
  }
  if (action === "leave") leave();
  if (action === "resume") {
    const selected = restore(button.dataset.attemptId);
    if (!selected) return;
    state = { ...selected, dialog: null };
    if (
      state.mode === "exam" &&
      !state.submitted &&
      Date.now() >= state.deadline
    ) {
      state.timedOut = true;
      submit();
    } else {
      render();
      startTimer();
      window.scrollTo(0, 0);
    }
  }
});
app.addEventListener("change", (event) => {
  const input = event.target;
  if (!input.dataset.option) return;
  const q = question(),
    response = currentResponse(state, q),
    existing = Array.isArray(response) ? response : [];
  setResponse(
    state,
    q,
    q.type === "MCQ"
      ? [input.value]
      : input.checked
        ? [...existing, input.value]
        : existing.filter((v) => v !== input.value),
  );
  render();
});
app.addEventListener("input", (event) => {
  const input = event.target;
  if (!input.dataset.numeric) return;
  setResponse(state, question(), input.value);
  if (state.mode === "practice") {
    const btn = app.querySelector('[data-action="check"]');
    if (btn) btn.disabled = !isAnswered(input.value);
    input
      .closest(".question-card")
      ?.querySelectorAll(
        ".feedback,.solution,.numeric-verdict,.expected-answer",
      )
      .forEach((el) => el.remove());
  } else {
    const status = app.querySelector(".response-save-state");
    if (status)
      status.innerHTML = responseChanged(state, question())
        ? '<span class="unsaved-dot"></span> Unsaved response · Save before changing questions'
        : "Use Save &amp; Next to save your response before navigating.";
  }
  store();
});
document.addEventListener("keydown", (event) => {
  if (!state.dialog) return;
  if (event.key === "Escape") {
    closeDialog();
    return;
  }
  if (event.key === "Tab") {
    const controls = [
      ...app.querySelectorAll(
        '[role="dialog"] button:not(:disabled),[role="dialog"] summary',
      ),
    ];
    const first = controls[0],
      last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});
render();
