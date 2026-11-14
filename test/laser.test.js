import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  createLaser,
  laserOpacity,
  LASER_LIFETIME,
  smoothPath,
} from "../src/laser.js";
test("laser fades continuously, tracks new samples after frames, and never becomes saved ink", () => {
  const dom = new JSDOM("<svg></svg>"),
    prior = globalThis.document;
  globalThis.document = dom.window.document;
  let time = 0,
    callback,
    id = 0;
  const svg = document.querySelector("svg");
  const laser = createLaser(svg, {
    now: () => time,
    raf: (fn) => {
      callback = fn;
      return ++id;
    },
    cancel: () => {
      callback = null;
    },
  });
  try {
    laser.begin([10, 20]);
    laser.move([20, 30]);
    callback();
    assert.ok(svg.querySelector("[data-ink-transient]"));
    time = 200;
    laser.move([40, 60]);
    callback();
    assert.match(svg.innerHTML, /40 60/);
    laser.end();
    time = 600;
    callback();
    assert.ok(svg.querySelector("path"));
    assert.ok(laserOpacity(600) < laserOpacity(200));
    time = 200 + LASER_LIFETIME + 10;
    callback();
    assert.equal(svg.children.length, 0);
    laser.begin([2, 2]);
    callback();
    laser.dispose();
    assert.equal(svg.children.length, 0);
    assert.equal(callback, null);
  } finally {
    globalThis.document = prior;
    dom.window.close();
  }
});
test("freehand smoothing keeps endpoints and supports single taps", () => {
  assert.match(
    smoothPath([
      [0, 0],
      [10, 20],
      [30, 40],
    ]),
    /^M 0 0 Q 10 20 20 30 L 30 40$/,
  );
  assert.match(smoothPath([[2, 3]]), /^M 2 3/);
});
