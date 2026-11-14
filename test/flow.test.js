import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";
const assets = new URL("../dist/assets/", import.meta.url);
const bundle = readFileSync(
  new URL(
    readdirSync(assets).find(
      (n) => n.startsWith("index-") && n.endsWith(".js"),
    ),
    assets,
  ),
  "utf8",
);
const openWindows = new Set();
afterEach(() => {
  for (const window of openWindows) window.close();
  openWindows.clear();
});
function setup(saved, width = 1024) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (e) => errors.push(e.message));
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="app"></div></body></html>',
    {
      url: "http://localhost/",
      runScripts: "dangerously",
      virtualConsole,
      pretendToBeVisual: true,
    },
  );
  const w = dom.window;
  openWindows.add(w);
  w.innerWidth = width;
  w.confirm = () => true;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  if (saved) w.localStorage.setItem("mlf-study-session-v1", saved);
  w.eval(bundle);
  return { dom, w, document: w.document, errors };
}
function click(d, selector) {
  const el = d.querySelector(selector);
  assert.ok(el, `missing ${selector}`);
  el.click();
}
function text(d) {
  return d.querySelector("#app").textContent.replace(/\s+/g, " ");
}
function openPaper(d, id = "march-2026") {
  click(d, '[data-action="section"][data-id="q1"]');
  click(d, `[data-action="paper"][data-id="${id}"]`);
}
function pick(d, id, value) {
  click(d, `input[data-option="${id}"][value="${value}"]`);
}
test("practice gives feedback and solutions for a chosen answer", () => {
  const { dom, document: d, errors } = setup();
  assert.match(text(d), /Practice Assignment/);
  assert.match(text(d), /Graded Assignment/);
  assert.match(text(d), /Quiz 1/);
  assert.match(text(d), /Quiz 2/);
  assert.match(text(d), /Enter/);
  openPaper(d);
  assert.match(text(d), /Practice mode/);
  assert.match(text(d), /Exam mode/);
  click(d, '[data-action="start"][data-mode="practice"]');
  pick(d, "6406531951381", "A");
  click(d, '[data-action="check"]');
  assert.match(text(d), /Correct answer/);
  assert.ok(d.querySelector("details.solution"));
  click(d, '[data-action="next"]');
  pick(d, "6406531951385", "B");
  click(d, '[data-action="check"]');
  assert.match(text(d), /Incorrect answer/);
  assert.ok(d.querySelector(".option.is-correct"));
  assert.ok(d.querySelector(".option.is-incorrect"));
  assert.deepEqual(errors, []);
  dom.window.close();
});
test("exam grades, submits and displays complete review on the same page", () => {
  const { dom, document: d, errors } = setup();
  openPaper(d);
  click(d, '[data-action="start"][data-mode="exam"]');
  assert.match(d.querySelector("#timer").textContent, /^(59:|60:)/);
  assert.equal(d.querySelector("details.solution"), null);
  pick(d, "6406531951381", "A");
  click(d, '[data-action="save-next"]');
  pick(d, "6406531951385", "B");
  click(d, '[data-action="save-next"]');
  click(d, '[data-action="jump"][data-index="5"]');
  pick(d, "6406531951386", "B");
  pick(d, "6406531951386", "C");
  click(d, '[data-action="mark-next"]');
  click(d, '[data-action="confirm"]');
  assert.match(text(d), /3 of 16/);
  click(d, '[data-action="submit"]');
  assert.ok(d.querySelector("#results"));
  assert.equal(d.querySelectorAll(".question-card").length, 16);
  assert.match(d.querySelector("#results").textContent, /5\s*\/\s*40/);
  assert.ok(d.querySelector("#question-1 .option.is-correct"));
  assert.ok(d.querySelector("#question-2 .option.is-incorrect"));
  assert.equal(d.querySelectorAll("details.solution").length, 16);
  assert.match(text(d), /Unanswered/);
  assert.deepEqual(errors, []);
  dom.window.close();
});
test("numeric answers and comprehension context work in July practice", () => {
  const { dom, document: d } = setup();
  openPaper(d, "july-2026");
  click(d, '[data-action="start"][data-mode="practice"]');
  click(d, '[data-action="jump"][data-index="8"]');
  const input = d.querySelector("[data-numeric]");
  input.value = "6";
  input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  click(d, '[data-action="check"]');
  assert.match(text(d), /Correct answer/);
  click(d, '[data-action="jump"][data-index="10"]');
  assert.match(text(d), /Comprehension passage/);
  assert.match(text(d), /encoder-decoder pairs/);
  dom.window.close();
});
test("an expired saved exam submits when resumed", () => {
  const saved = JSON.stringify({
    screen: "session",
    paper: "march-2026",
    mode: "exam",
    index: 0,
    answers: {},
    checked: {},
    deadline: Date.now() - 1000,
    submitted: false,
  });
  const { dom, document: d } = setup(saved);
  click(d, '[data-action="resume"]');
  assert.ok(d.querySelector("#results"));
  assert.match(text(d), /Time is up/);
  dom.window.close();
});

test("CBT palette, unsaved response handling, review and clear actions", () => {
  const { dom, document: d, errors } = setup();
  openPaper(d);
  click(d, '[data-action="start"][data-mode="exam"]');
  assert.ok(d.querySelector(".nav-number.not-answered.current"));
  assert.ok(d.querySelector(".nav-number.not-visited"));
  pick(d, "6406531951381", "A");
  assert.match(text(d), /Unsaved response/);
  click(d, '[data-action="jump"][data-index="1"]');
  click(d, '[data-action="jump"][data-index="0"]');
  assert.equal(d.querySelectorAll("input:checked").length, 0);
  pick(d, "6406531951381", "A");
  click(d, '[data-action="mark-next"]');
  assert.ok(d.querySelector(".nav-number.answered-review"));
  click(d, '[data-action="mark-next"]');
  assert.ok(d.querySelector(".nav-number.review"));
  click(d, '[data-action="jump"][data-index="0"]');
  click(d, '[data-action="clear"]');
  click(d, '[data-action="save-next"]');
  assert.ok(
    d.querySelector('[data-action="jump"][data-index="0"].not-answered'),
  );
  click(d, '[data-action="instructions"]');
  assert.match(d.querySelector('[role="dialog"]').textContent, /Save & Next/);
  click(d, '[data-action="cancel"]');
  click(d, '[data-action="question-paper"]');
  assert.equal(d.querySelectorAll(".paper-preview-question").length, 16);
  assert.equal(d.querySelector("details.solution"), null);
  assert.deepEqual(errors, []);
  dom.window.close();
});
test("submission offers a way to save an unsaved current response", () => {
  const { dom, document: d } = setup();
  openPaper(d);
  click(d, '[data-action="start"][data-mode="exam"]');
  pick(d, "6406531951381", "A");
  click(d, '[data-action="confirm"]');
  assert.ok(d.querySelector(".unsaved-warning"));
  click(d, '[data-action="save-current"]');
  assert.equal(d.querySelector(".unsaved-warning"), null);
  click(d, '[data-action="submit"]');
  assert.match(d.querySelector(".result-score").textContent, /2\s*\/\s*40/);
  dom.window.close();
});

test("dialogs isolate the background, trap focus and return it to the opener", () => {
  const { dom, document: d, errors } = setup();
  openPaper(d);
  click(d, '[data-action="start"][data-mode="exam"]');
  const trigger = d.querySelector('[data-action="instructions"]');
  trigger.focus();
  trigger.click();
  const dialog = d.querySelector('[role="dialog"]');
  assert.ok(dialog);
  assert.ok(d.querySelector("main[inert]"));
  assert.equal(d.activeElement.dataset.action, "cancel");
  const controls = [
    ...dialog.querySelectorAll("button:not(:disabled),summary"),
  ];
  controls.at(-1).focus();
  d.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    }),
  );
  assert.equal(d.activeElement, controls[0]);
  d.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  assert.equal(d.querySelector('[role="dialog"]'), null);
  assert.equal(d.querySelector("main[inert]"), null);
  assert.equal(d.activeElement.dataset.action, "instructions");
  assert.deepEqual(errors, []);
});

test("leave and replacement confirmations preserve progress when cancelled", () => {
  const { document: d, w, errors } = setup();
  w.confirm = () => {
    throw new Error("Native confirmation should not be used");
  };
  openPaper(d);
  click(d, '[data-action="start"][data-mode="exam"]');
  pick(d, "6406531951381", "A");
  click(d, '[data-action="save-next"]');
  const deadline = JSON.parse(
    w.localStorage.getItem("mlf-study-session-v1"),
  ).deadline;
  click(d, '[data-action="leave"]');
  assert.match(
    d.querySelector('[role="dialog"]').textContent,
    /timer will keep running/,
  );
  click(d, '[data-action="cancel"]');
  assert.ok(d.querySelector(".question-workspace"));
  click(d, '[data-action="leave"]');
  click(d, '[data-action="confirm-leave"]');
  click(d, '[data-action="start"][data-mode="practice"]');
  assert.match(
    d.querySelector('[role="dialog"]').textContent,
    /Start a new attempt/,
  );
  click(d, '[data-action="cancel"]');
  const stored = JSON.parse(w.localStorage.getItem("mlf-study-session-v1"));
  assert.equal(stored.deadline, deadline);
  assert.deepEqual(stored.answers["6406531951381"], ["A"]);
  click(d, '[data-action="start"][data-mode="practice"]');
  click(d, '[data-action="confirm-replace"]');
  assert.match(text(d), /No time limit/);
  assert.equal(d.querySelectorAll("input:checked").length, 0);
  assert.deepEqual(errors, []);
});

test("home has one collection list and mobile browsing exposes a compact selector", () => {
  const { document: d } = setup(undefined, 390);
  assert.equal(d.querySelectorAll('button[data-action="section"]').length, 5);
  click(d, '[data-action="section"][data-id="q1"]');
  const menu = d.querySelector(".collection-menu");
  assert.ok(menu);
  assert.equal(menu.querySelectorAll("button").length, 5);
  assert.equal(menu.querySelector('[aria-current="page"]').dataset.id, "q1");
  click(d, '[data-action="paper"][data-id="march-2026"]');
  click(d, '[data-action="start"][data-mode="practice"]');
  assert.equal(d.querySelector(".palette-panel").open, false);
});
