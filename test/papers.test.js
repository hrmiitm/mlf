import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parsePaper, gradeQuestion, isAnswered } from "../src/parser.js";
import { marchAnswers, julyAnswers } from "../src/answer-keys.js";
import { renderMarkdown } from "../src/markdown.js";

const data = [
  [
    "Solved-MLF_Practice_15_Mar_2026_Questions.md",
    marchAnswers,
    16,
    [14, 15, 17, 18],
  ],
  [
    "Solved-MLF_Practice_16_Jul_2026_Questions.md",
    julyAnswers,
    13,
    [12, 13, 14],
  ],
];
for (const [file, answers, count, children] of data) {
  test(`${file} parses every graded question and shared passage`, () => {
    const text = readFileSync(
      new URL(`../papers/Q1/${file}`, import.meta.url),
      "utf8",
    );
    const paper = parsePaper(text, { id: file, answers });
    assert.equal(paper.questions.length, count);
    assert.equal(paper.totalMarks, 40);
    assert.ok(paper.guide.includes("What you should already know"));
    for (const q of paper.questions) {
      assert.ok(q.id && q.body && q.solution);
      assert.equal(Boolean(q.context), children.includes(q.number));
      if (q.type !== "SA") {
        assert.ok([2, 3, 4].includes(q.options.length));
        assert.ok(q.options.every((o) => o.text));
      }
      assert.equal(gradeQuestion(q, q.answer), true, `key for Q${q.number}`);
      assert.equal(gradeQuestion(q, undefined), false);
    }
    if (count === 13) {
      const q3 = paper.questions.find((q) => q.number === 3);
      assert.equal(q3.options.length, 4);
      assert.ok(q3.options[0].text.includes("bmatrix"));
      assert.ok(q3.options[3].text.includes("1&0"));
    }
  });
}
test("multi-select requires exactly the full set; numerical blanks are not zero", () => {
  const multi = { type: "MSQ", answer: ["B", "D"] };
  assert.equal(gradeQuestion(multi, ["D", "B"]), true);
  assert.equal(gradeQuestion(multi, ["B"]), false);
  assert.equal(gradeQuestion(multi, ["B", "D", "A"]), false);
  assert.equal(gradeQuestion({ type: "SA", answer: 0 }, ""), false);
  assert.equal(gradeQuestion({ type: "SA", answer: 1.25 }, "1.250"), true);
  assert.equal(isAnswered([]), false);
});
test("math, matrices and Markdown tables render into HTML", () => {
  const html = renderMarkdown(
    "| $x_1$ | $x_2$ |\n| --- | --- |\n| 2 | 4 |\n\n$$\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}$$",
  );
  assert.match(html, /<table>/);
  assert.match(html, /class="katex/);
  assert.doesNotMatch(html, /MATHPLACEHOLDER|katex-error/);
});

test("all question, solution and study-guide formulas render without KaTeX errors", () => {
  for (const [file, answers] of data) {
    const text = readFileSync(
      new URL(`../papers/Q1/${file}`, import.meta.url),
      "utf8",
    );
    const paper = parsePaper(text, { id: file, answers });
    assert.doesNotMatch(renderMarkdown(paper.guide), /katex-error/);
    for (const q of paper.questions) {
      for (const piece of [
        q.title,
        q.body,
        q.solution,
        q.context?.body,
        ...q.options.map((o) => o.text),
      ]) {
        if (piece)
          assert.doesNotMatch(
            renderMarkdown(piece),
            /katex-error/,
            `${file} question ${q.number}`,
          );
      }
    }
  }
});
