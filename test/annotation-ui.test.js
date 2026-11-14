import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  annotationToolbar,
  sessionDownloads,
  mountAnnotations,
} from "../src/annotations.js";

test("downloads target the selected question, prevent concurrent exports, and recover on failure", async () => {
  const dom = new JSDOM('<div id="app"></div>');
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    AbortController: globalThis.AbortController,
  };
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    AbortController: dom.window.AbortController,
  });
  let dispose = () => {};
  const originalError = console.error;
  try {
    const d = dom.window.document,
      root = d.querySelector("#app");
    const paper = {
      questions: [
        { id: "one", number: 1 },
        { id: "two", number: 2 },
      ],
    };
    root.innerHTML = `<header class="session-topbar"><button data-ink-toggle></button>${sessionDownloads(paper, paper.questions[0], true)}${annotationToolbar()}</header>${paper.questions.map((q) => `<article class="question-card review-card" id="question-${q.number}"><div class="annotation-surface" data-annotation-question="${q.id}"></div></article>`).join("")}`;
    root.querySelectorAll(".question-card").forEach((c) => {
      c.scrollIntoView = () => {};
    });
    let release,
      calls = [];
    dispose = mountAnnotations(root, "export-test", (...args) => {
      calls.push(args);
      return new Promise((resolve) => {
        release = resolve;
      });
    });
    const select = root.querySelector("[data-download-question]");
    select.value = "two";
    select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    root.querySelector('[data-ink-export="png"]').click();
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0][0].id, "question-2");
    assert.equal(calls[0][1], "png");
    assert.equal(calls[0][2], "two");
    assert.equal(root.querySelector("[data-export-all]").disabled, true);
    root.querySelector("[data-export-all]").click();
    assert.equal(calls.length, 1);
    release();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.match(
      root.querySelector(".download-status").textContent,
      /Question PNG ready/,
    );
    assert.equal(root.querySelector("[data-export-all]").disabled, false);
    root.querySelector("[data-export-all]").click();
    assert.equal(calls[1][0].length, 2);
    assert.equal(calls[1][2], undefined);
    release();
    await new Promise((resolve) => setTimeout(resolve, 0));
    dispose();
    console.error = () => {};
    dispose = mountAnnotations(root, "export-test", async () => {
      throw new Error("test export failure");
    });
    root.querySelector('[data-ink-export="pdf"]').click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.match(
      root.querySelector(".download-status").textContent,
      /Download failed/,
    );
    assert.equal(root.querySelector(".ink-toolbar").hidden, true);
    assert.equal(root.querySelector('[data-ink-export="pdf"]').disabled, false);
  } finally {
    dispose();
    console.error = originalError;
    dom.window.close();
    Object.assign(globalThis, previous);
  }
});
