import { isAnswered } from "./parser.js";

const copy = (value) => (Array.isArray(value) ? [...value] : value);
export function initialAttempt(paper, mode, now = Date.now()) {
  const q = paper.questions[0];
  return {
    screen: "session",
    paper: paper.id,
    mode,
    index: 0,
    answers: {},
    checked: {},
    marked: {},
    visited: { [q.id]: true },
    draft: q.type === "SA" ? "" : [],
    deadline: mode === "exam" ? now + 60 * 60 * 1000 : null,
    submitted: false,
    timedOut: false,
    dialog: null,
    guide: false,
  };
}
export function currentResponse(state, q) {
  return state.mode === "exam" && !state.submitted
    ? state.draft
    : state.answers[q.id];
}
export function setResponse(state, q, response) {
  if (state.mode === "exam") state.draft = copy(response);
  else state.answers[q.id] = copy(response);
  delete state.checked[q.id];
}
export function commitResponse(state, q, marked = false) {
  if (state.mode === "exam") {
    if (isAnswered(state.draft)) state.answers[q.id] = copy(state.draft);
    else delete state.answers[q.id];
  }
  if (marked) state.marked[q.id] = true;
  else delete state.marked[q.id];
}
export function visitQuestion(state, paper, index) {
  state.index = Math.max(0, Math.min(paper.questions.length - 1, index));
  const q = paper.questions[state.index];
  state.visited[q.id] = true;
  state.draft = copy(state.answers[q.id] ?? (q.type === "SA" ? "" : []));
}
export function responseChanged(state, q) {
  if (state.mode !== "exam" || state.submitted) return false;
  const saved = state.answers[q.id] ?? (q.type === "SA" ? "" : []);
  const normalize = (value) =>
    Array.isArray(value) ? [...value].sort() : String(value ?? "");
  return (
    JSON.stringify(normalize(saved)) !== JSON.stringify(normalize(state.draft))
  );
}
export function questionStatus(state, q) {
  const answered = isAnswered(state.answers[q.id]);
  if (state.marked[q.id]) return answered ? "answered-review" : "review";
  return answered
    ? "answered"
    : state.visited[q.id]
      ? "not-answered"
      : "not-visited";
}
export function statusCounts(state, paper) {
  const counts = {
    answered: 0,
    "not-answered": 0,
    "not-visited": 0,
    review: 0,
    "answered-review": 0,
  };
  paper.questions.forEach((q) => counts[questionStatus(state, q)]++);
  return counts;
}
