import test from "node:test";
import assert from "node:assert/strict";
import {
  initialAttempt,
  currentResponse,
  setResponse,
  commitResponse,
  visitQuestion,
  responseChanged,
  questionStatus,
  statusCounts,
} from "../src/session.js";
const p = {
  id: "test",
  questions: [
    { id: "one", type: "MCQ" },
    { id: "two", type: "SA" },
    { id: "three", type: "MSQ" },
  ],
};

test("exam choices are drafts until saved, and palette navigation discards drafts", () => {
  const s = initialAttempt(p, "exam", 1000);
  assert.equal(s.deadline, 3601000);
  assert.equal(questionStatus(s, p.questions[0]), "not-answered");
  assert.equal(questionStatus(s, p.questions[1]), "not-visited");
  setResponse(s, p.questions[0], ["A"]);
  assert.deepEqual(currentResponse(s, p.questions[0]), ["A"]);
  assert.equal(responseChanged(s, p.questions[0]), true);
  assert.equal(s.answers.one, undefined);
  visitQuestion(s, p, 1);
  visitQuestion(s, p, 0);
  assert.deepEqual(s.draft, []);
  setResponse(s, p.questions[0], ["B"]);
  commitResponse(s, p.questions[0]);
  assert.deepEqual(s.answers.one, ["B"]);
  assert.equal(questionStatus(s, p.questions[0]), "answered");
});
test("review status distinguishes a saved answer from an unanswered review question", () => {
  const s = initialAttempt(p, "exam");
  commitResponse(s, p.questions[0], true);
  assert.equal(questionStatus(s, p.questions[0]), "review");
  setResponse(s, p.questions[0], ["A"]);
  commitResponse(s, p.questions[0], true);
  assert.equal(questionStatus(s, p.questions[0]), "answered-review");
  assert.deepEqual(s.answers.one, ["A"]);
  commitResponse(s, p.questions[0]);
  assert.equal(questionStatus(s, p.questions[0]), "answered");
  assert.equal(s.marked.one, undefined);
});
test("clearing a saved numeric answer takes effect on save", () => {
  const s = initialAttempt(p, "exam");
  visitQuestion(s, p, 1);
  setResponse(s, p.questions[1], "0");
  commitResponse(s, p.questions[1]);
  assert.equal(s.answers.two, "0");
  setResponse(s, p.questions[1], "");
  assert.equal(s.answers.two, "0");
  commitResponse(s, p.questions[1]);
  assert.equal(s.answers.two, undefined);
  assert.equal(questionStatus(s, p.questions[1]), "not-answered");
});
test("practice answers save immediately and status counts cover all questions", () => {
  const s = initialAttempt(p, "practice");
  assert.equal(s.deadline, null);
  setResponse(s, p.questions[0], ["A"]);
  assert.deepEqual(s.answers.one, ["A"]);
  commitResponse(s, p.questions[0], true);
  assert.deepEqual(statusCounts(s, p), {
    answered: 0,
    "not-answered": 0,
    "not-visited": 2,
    review: 0,
    "answered-review": 1,
  });
});
