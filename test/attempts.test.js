import test from "node:test";
import assert from "node:assert/strict";
import {
  createAttemptStore,
  LEGACY_KEY,
  ATTEMPTS_KEY,
} from "../src/attempt-store.js";
const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k), setItem: (k, v) => m.set(k, v) };
};
const sample = (id, mode = "practice") => ({
  attemptId: id,
  screen: "session",
  paper: "march-2026",
  mode,
  answers: { q: ["A"] },
  index: 0,
  submitted: false,
  deadline: 12345,
});
test("new attempts preserve older answers and submitted results across reloads", () => {
  const storage = memory(),
    store = createAttemptStore(storage);
  store.save(sample("old", "exam"));
  store.save({ ...sample("submitted"), submitted: true });
  store.save({ ...sample("new"), answers: {} });
  const reload = createAttemptStore(storage);
  assert.equal(reload.list().length, 3);
  assert.deepEqual(reload.get("old").answers, { q: ["A"] });
  assert.equal(reload.get("old").deadline, 12345);
  assert.equal(reload.get("submitted").submitted, true);
  assert.deepEqual(reload.get().answers, {});
  reload.save({ ...reload.get("old"), index: 2 });
  const twice = createAttemptStore(storage);
  assert.equal(twice.get().attemptId, "old");
  assert.equal(twice.list().length, 3);
  assert.equal(twice.get().index, 2);
});
test("legacy attempts migrate without being lost when a new attempt begins", () => {
  const storage = memory();
  storage.setItem(LEGACY_KEY, JSON.stringify(sample("legacy")));
  const store = createAttemptStore(storage);
  store.save(sample("new"));
  assert.equal(createAttemptStore(storage).get("legacy").attemptId, "legacy");
});
test("blocked storage retains attempts in memory and reports failed persistence", () => {
  const store = createAttemptStore({
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
  });
  assert.equal(store.save(sample("memory")), false);
  assert.ok(store.get("memory"));
  assert.equal(store.saved, false);
});
test("invalid archive records are ignored", () => {
  const storage = memory();
  storage.setItem(
    ATTEMPTS_KEY,
    JSON.stringify({
      version: 2,
      attempts: [{}, sample("ok")],
      activeId: "ok",
    }),
  );
  assert.equal(createAttemptStore(storage).list().length, 1);
});

test("a save from an older tab does not remove attempts created in another tab", () => {
  const storage = memory(),
    first = createAttemptStore(storage),
    second = createAttemptStore(storage);
  first.save(sample("first"));
  second.save(sample("second"));
  first.save({ ...sample("first"), index: 3 });
  const reload = createAttemptStore(storage);
  assert.equal(reload.list().length, 2);
  assert.equal(reload.get("first").index, 3);
  assert.ok(reload.get("second"));
});
