import test from "node:test";
import assert from "node:assert/strict";
import { createPdfLayout } from "../src/annotation-export.js";
test("multiple short questions share pages without overlap", () => {
  const layout = createPdfLayout();
  const a = layout.place(70),
    b = layout.place(80),
    c = layout.place(90),
    d = layout.place(60);
  assert.equal(a[0].page, 0);
  assert.equal(b[0].page, 0);
  assert.equal(c[0].page, 0);
  assert.equal(d[0].page, 1);
  assert.ok(a[0].y + a[0].height < b[0].y);
  assert.ok(c[0].y + c[0].height <= 263);
});
test("short questions move intact when only a small remainder is available", () => {
  const layout = createPdfLayout();
  layout.place(240);
  const next = layout.place(50);
  assert.deepEqual(next, [{ page: 1, y: 0, top: 0, height: 50 }]);
});
test("long questions continue through page remainders and safe breaks without lost content", () => {
  const layout = createPdfLayout();
  layout.place(70);
  const parts = layout.place(600, (_, max) => Math.floor(max - 2));
  assert.equal(parts[0].page, 0);
  assert.equal(parts[0].y, 76);
  let next = 0;
  for (const p of parts) {
    assert.ok(Math.abs(p.top - next) < 1e-6);
    assert.ok(p.y + p.height <= 263);
    next += p.height;
  }
  assert.equal(next, 600);
  assert.equal(parts.at(-1).page, 2);
});
