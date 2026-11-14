import test from "node:test";
import assert from "node:assert/strict";
import { parseRoute, routeForState } from "../src/router.js";
import { readFileSync, readdirSync } from "node:fs";
test("hash routes distinguish collections, papers, study, attempts and results", () => {
  assert.deepEqual(parseRoute("#/"), { type: "home" });
  assert.deepEqual(parseRoute("#/collections/q1"), {
    type: "collection",
    section: "q1",
  });
  assert.deepEqual(parseRoute("#/papers/march-2026/study"), {
    type: "study",
    paper: "march-2026",
  });
  assert.deepEqual(parseRoute("#/attempts/a/practice?q=17"), {
    type: "attempt",
    attemptId: "a",
    view: "practice",
    question: 17,
  });
  assert.equal(parseRoute("#/attempts/a/results").view, "results");
  assert.equal(parseRoute("#/bad").type, "not-found");
  assert.equal(parseRoute("#/papers/%E0%A4%A").type, "not-found");
  assert.equal(parseRoute("#/attempts/a/exam?q=-4").question, null);
});
test("attempt URLs use saved identity and distinct result locations", () => {
  assert.equal(
    routeForState({ screen: "session", mode: "exam", attemptId: "a" }, 2),
    "#/attempts/a/exam?q=2",
  );
  assert.equal(
    routeForState({ screen: "session", mode: "practice", attemptId: "a" }, 14),
    "#/attempts/a/practice?q=14",
  );
  assert.equal(
    routeForState({ screen: "session", submitted: true, attemptId: "a" }, 2),
    "#/attempts/a/results",
  );
  assert.equal(
    routeForState(
      {
        screen: "session",
        submitted: true,
        attemptId: "a",
        reviewQuestion: 17,
      },
      2,
    ),
    "#/attempts/a/results?q=17",
  );
});
test("production entry contains no paper content and emits separate paper chunks", () => {
  const directory = new URL("../dist/assets/", import.meta.url),
    files = readdirSync(directory);
  const index = files.find((f) => /^index-[\w-]+\.js$/.test(f));
  const source = readFileSync(new URL(index, directory), "utf8");
  assert.doesNotMatch(
    source,
    /Let the vectors|tangent-plane approximation|Reconstruction loss for Pair/,
  );
  const march = files.find((f) => /^march-2026-.*\.js$/.test(f)),
    july = files.find((f) => /^july-2026-.*\.js$/.test(f));
  assert.ok(march && july);
  assert.match(
    readFileSync(new URL(march, directory), "utf8"),
    /orthogonality/i,
  );
  assert.match(readFileSync(new URL(july, directory), "utf8"), /tangent-plane/);
});
