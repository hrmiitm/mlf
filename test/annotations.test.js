import test from "node:test";
import assert from "node:assert/strict";
import {
  createNotebook,
  hitObject,
  INK_PREFIX,
} from "../src/annotation-store.js";
import { pageSlices } from "../src/annotation-export.js";
const stroke = (tool = "pen") => ({
  tool,
  color: "#245db4",
  width: 3,
  points: [
    [20, 40],
    [80, 90],
  ],
});
function memory() {
  const data = new Map();
  return { getItem: (k) => data.get(k), setItem: (k, v) => data.set(k, v) };
}
test("ink is isolated by paper and question and survives a new notebook", () => {
  const storage = memory(),
    book = createNotebook(storage),
    first = book.get("march", "q1");
  book.add(first, stroke());
  assert.equal(book.get("march", "q2").data.objects.length, 0);
  assert.equal(book.get("july", "q1").data.objects.length, 0);
  assert.deepEqual(createNotebook(storage).get("march", "q1").data.objects, [
    stroke(),
  ]);
});
test("eraser, clear, undo and redo preserve independent question histories", () => {
  const book = createNotebook(memory()),
    first = book.get("march", "q1"),
    second = book.get("march", "q2");
  book.add(first, stroke());
  book.add(first, stroke("arrow"));
  book.add(second, stroke("ellipse"));
  book.remove(first, 0);
  assert.equal(first.data.objects[0].tool, "arrow");
  book.undo(first);
  assert.equal(first.data.objects.length, 2);
  book.redo(first);
  assert.equal(first.data.objects.length, 1);
  book.clear(first);
  assert.equal(first.data.objects.length, 0);
  book.undo(first);
  assert.equal(first.data.objects.length, 1);
  assert.equal(second.data.objects[0].tool, "ellipse");
  book.extend(first, 1200);
  book.undo(first);
  assert.equal(first.data.height, 0);
  book.redo(first);
  assert.equal(first.data.height, 1200);
});
test("invalid/corrupt saved ink and storage quota errors do not affect working notes", () => {
  const storage = memory();
  storage.setItem(INK_PREFIX + "p:q", "{invalid");
  assert.equal(createNotebook(storage).get("p", "q").data.objects.length, 0);
  storage.setItem(
    INK_PREFIX + "p:q",
    JSON.stringify({
      version: 1,
      objects: [
        stroke(),
        stroke("laser"),
        { ...stroke(), points: [[Infinity, 3]] },
      ],
    }),
  );
  assert.equal(createNotebook(storage).get("p", "q").data.objects.length, 1);
  const book = createNotebook({
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    }),
    entry = book.get("p", "q");
  book.add(entry, stroke());
  assert.equal(entry.saved, false);
  assert.equal(entry.data.objects.length, 1);
  book.undo(entry);
  assert.equal(entry.data.objects.length, 0);
  assert.equal(book.add(entry, stroke("laser")), false);
});
test("eraser hit testing uses strokes and shape edges instead of empty bounding boxes", () => {
  assert.equal(hitObject(stroke(), [50, 65]), true);
  assert.equal(hitObject(stroke(), [20, 90]), false);
  const rectangle = {
    ...stroke("rectangle"),
    points: [
      [0, 0],
      [100, 100],
    ],
  };
  assert.equal(hitObject(rectangle, [50, 50]), false);
  assert.equal(hitObject(rectangle, [1, 50]), true);
  assert.equal(hitObject({ ...rectangle, tool: "ellipse" }, [50, 1]), true);
});
test("long annotated questions paginate without losing or repeating any rows", () => {
  assert.deepEqual(pageSlices(2300, 1000), [
    { top: 0, height: 1000 },
    { top: 1000, height: 1000 },
    { top: 2000, height: 300 },
  ]);
  assert.deepEqual(pageSlices(1000, 1000), [{ top: 0, height: 1000 }]);
});

test("passage layout survives reload and is independent of ink undo history", () => {
  const storage = memory(),
    book = createNotebook(storage),
    entry = book.get("p", "context");
  assert.equal(entry.contextOpen, true);
  book.add(entry, stroke());
  book.setContext(entry, false);
  book.undo(entry);
  assert.equal(entry.contextOpen, false);
  const restored = createNotebook(storage).get("p", "context");
  assert.equal(restored.contextOpen, false);
  assert.equal(restored.data.objects.length, 0);
});

test("annotation undo and redo remain available after reloading, including an undone stroke", () => {
  const storage = memory(),
    book = createNotebook(storage),
    entry = book.get("p", "redo");
  book.add(entry, stroke());
  book.add(entry, stroke("arrow"));
  book.undo(entry);
  const reload = createNotebook(storage),
    restored = reload.get("p", "redo");
  assert.equal(restored.future.length, 1);
  reload.redo(restored);
  assert.equal(restored.data.objects.length, 2);
  reload.undo(restored);
  reload.undo(restored);
  assert.equal(restored.data.objects.length, 0);
  const again = createNotebook(storage),
    last = again.get("p", "redo");
  again.redo(last);
  assert.equal(last.data.objects.length, 1);
});

test("attempt notebooks isolate ink, layout and undo history without deleting legacy notes", () => {
  const storage = memory(),
    book = createNotebook(storage);
  const old = book.get("march", "q1");
  book.add(old, stroke());
  const first = book.get("march", "q1", "attempt-a");
  assert.equal(first.data.objects.length, 0);
  book.add(first, stroke("arrow"));
  book.extend(first, 1200);
  book.setContext(first, false);
  book.undo(first);
  const second = book.get("march", "q1", "attempt-b");
  assert.equal(second.data.objects.length, 0);
  assert.equal(second.data.height, 0);
  assert.equal(second.contextOpen, true);
  assert.equal(second.past.length, 0);
  assert.equal(second.future.length, 0);
  const reloaded = createNotebook(storage).get("march", "q1", "attempt-a");
  assert.equal(reloaded.data.objects[0].tool, "arrow");
  assert.equal(reloaded.contextOpen, false);
  assert.equal(reloaded.future.length, 1);
  assert.equal(
    createNotebook(storage).get("march", "q1").data.objects[0].tool,
    "pen",
  );
});
