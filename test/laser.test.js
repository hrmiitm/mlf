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
    assert.match(svg.querySelector("path").getAttribute("d"), / Q /);
    assert.equal(
      svg.querySelector("path").getAttribute("vector-effect"),
      "non-scaling-stroke",
    );
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

test("laser keeps a small stationary pointer, sleeps while idle, and fades after release", () => {
  const dom = new JSDOM("<svg></svg>"),
    previous = globalThis.document;
  globalThis.document = dom.window.document;
  let time = 0,
    pending = null,
    serial = 0;
  const svg = document.querySelector("svg");
  svg.getBoundingClientRect = () => ({ width: 2000 });
  const laser = createLaser(svg, {
    now: () => time,
    raf: (fn) => {
      pending = fn;
      return ++serial;
    },
    cancel: () => {
      pending = null;
    },
  });
  const tick = () => {
    const fn = pending;
    pending = null;
    fn();
  };
  try {
    laser.hover([10, 10]);
    tick();
    assert.equal(
      svg.querySelector('circle[fill="#f32620"]').getAttribute("r"),
      "1.4",
    );
    assert.equal(pending, null); // A stationary cursor needs no animation loop.
    laser.leave();
    tick();
    assert.equal(svg.children.length, 0);
    laser.begin([10, 10]);
    laser.move([20, 20]);
    tick();
    time = LASER_LIFETIME + 1;
    tick();
    assert.equal(svg.querySelector("path"), null);
    assert.ok(svg.querySelector("circle")); // A held pointer stays visible.
    assert.equal(pending, null);
    laser.end();
    tick();
    time += 401;
    tick();
    assert.equal(svg.children.length, 0);
    assert.equal(pending, null);
  } finally {
    laser.dispose();
    globalThis.document = previous;
    dom.window.close();
  }
});
