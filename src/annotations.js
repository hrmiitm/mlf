import { createLaser, smoothPath } from "./laser.js";
import { createNotebook, bounds, hitObject } from "./annotation-store.js";
const NS = "http://www.w3.org/2000/svg";
let storage;
try {
  storage = window.localStorage;
} catch {
  /* Memory-only notes still work. */
}
const notebook = createNotebook(storage);
const settings = { enabled: false, tool: "pen", color: "#245db4", width: 3 };
const colors = { pen: "#245db4", highlighter: "#edb514" };
let exportBusy = false;
const activeQuestions = new Map();
const toolNames = {
  pen: "Pen",
  highlighter: "Highlighter",
  laser: "Laser",
  text: "Text",
  line: "Line",
  arrow: "Arrow",
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  eraser: "Eraser",
};
const toolIcons = {
  pen: '<path d="m5 16 10-10 3 3-10 10-4 1zM13 8l3 3"/>',
  highlighter: '<path d="m6 13 8-8 5 5-8 8zM8 15l-3 4h6M4 21h15"/>',
  laser:
    '<path d="m5 19 8-8m-2-1 4 4M16 3v3m5 2-3 1m0-5-2 2"/><circle cx="6" cy="18" r="2"/>',
  text: '<path d="M4 5h16M12 5v15M8 20h8M4 5v3m16-3v3"/>',
  line: '<path d="m5 19 14-14"/><circle cx="5" cy="19" r="1"/><circle cx="19" cy="5" r="1"/>',
  arrow: '<path d="M4 20 20 4M10 4h10v10"/>',
  rectangle: '<rect x="4" y="5" width="16" height="14" rx="1"/>',
  ellipse: '<ellipse cx="12" cy="12" rx="9" ry="7"/>',
  eraser: '<path d="m4 13 9-9 7 7-9 9H8zM9 8l7 7M11 20h9"/>',
  undo: '<path d="M9 5 4 10l5 5M4 10h9a6 6 0 0 1 0 12"/>',
  redo: '<path d="m15 5 5 5-5 5m5-5h-9a6 6 0 0 0 0 12"/>',
  space: '<path d="M4 4h16v16H4zM12 8v8m-4-4h8"/>',
  clear: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${toolIcons[name]}</svg>`;
export function annotationToolbar() {
  return `<div class="ink-toolbar" id="annotation-tools" data-export-controls hidden role="group" aria-label="Annotation tools">
    <div class="ink-tool-options" role="group" aria-label="Drawing tools">${Object.entries(
      toolNames,
    )
      .map(
        ([tool, label]) =>
          `<button class="ink-tool" data-ink-tool="${tool}" aria-pressed="false" title="${label}">${icon(tool)}<span>${label}</span></button>`,
      )
      .join("")}</div>
    <div class="ink-properties"><div class="ink-colors" role="group" aria-label="Ink colors">${["#245db4", "#202936", "#c73732", "#21683c", "#69459a", "#edb514"].map((color) => `<button data-ink-swatch="${color}" style="--swatch:${color}" aria-label="${{ "#245db4": "Blue", "#202936": "Black", "#c73732": "Red", "#21683c": "Green", "#69459a": "Purple", "#edb514": "Yellow" }[color]} ink" aria-pressed="false"></button>`).join("")}<label class="ink-custom-color"><span>Custom color</span><input data-ink-color type="color" value="${settings.color}" aria-label="Custom ink color"></label></div>
    <div class="ink-widths" role="group" aria-label="Stroke width">${[
      [2, "Fine"],
      [3, "Medium"],
      [6, "Thick"],
      [12, "Broad"],
    ]
      .map(
        ([width, label]) =>
          `<button data-ink-width="${width}" aria-label="${label} stroke" aria-pressed="false"><svg viewBox="0 0 24 12" aria-hidden="true"><path d="M4 6h16" stroke="currentColor" stroke-width="${Math.min(width, 8)}" stroke-linecap="round"/></svg><span>${label}</span></button>`,
      )
      .join("")}</div>
    <div class="ink-edit-actions">${[
      ["undo", "Undo", "Undo (Ctrl/⌘ Z)"],
      ["redo", "Redo", "Redo (Ctrl/⌘ Shift Z)"],
      ["space", "More space", "Add writing space"],
      ["clear", "Clear question", "Clear this question’s notes"],
    ]
      .map(
        ([command, label, title]) =>
          `<button data-ink-command="${command}" aria-label="${label}" title="${title}">${icon(command)}<span>${label}</span></button>`,
      )
      .join("")}</div></div>
    <div class="ink-footer"><span class="ink-current-question"></span><span class="ink-save-status" role="status">Choose a question to annotate</span><span class="ink-tool-hint">Draw over the question · notes save on this device</span><button data-ink-done title="Done drawing (Escape)">Done</button><details class="ink-help"><summary>Help</summary><p>Choose a tool above, then draw with a mouse, touch, or stylus. The laser has a fading trail and is never saved or exported. Done drawing returns to answer selection. Undo: Ctrl/⌘ Z. Redo: Ctrl/⌘ Shift Z. Exit: Escape.</p></details></div>
  </div>`;
}
export function sessionDownloads(paper, currentQuestion, submitted) {
  const questions = submitted ? paper.questions : [currentQuestion];
  return `<details class="session-downloads" data-export-controls><summary>Download</summary><div class="download-panel">
    <label>Question <select data-download-question aria-label="Question to download">${questions.map((q) => `<option value="${q.id}">Question ${q.number}</option>`).join("")}</select></label>
    <button data-ink-export="pdf">Question as PDF</button><button data-ink-export="png">Question as PNG</button>
    ${submitted ? "<button data-export-all>Full paper as PDF</button>" : "<p>Submit the attempt to download the full paper.</p>"}
    <p>Includes your annotations and any expanded solutions.</p>
    <p class="download-status" role="status" aria-live="polite"></p>
  </div></details>`;
}
export function inkElement(object) {
  const el = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };
  const { tool, points, color, width } = object;
  const [a, b = a] = [points[0], points.at(-1)];
  const attr = {
    stroke: color,
    "stroke-width": tool === "highlighter" ? width * 5 : width,
    fill: "none",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  };
  if (tool === "text") {
    const text = el("text", {
      x: a[0],
      y: a[1] + 24,
      fill: color,
      "font-size": 24,
      "font-family": "Arial, Helvetica, sans-serif",
    });
    object.text.split("\n").forEach((line, i) => {
      const t = el("tspan", { x: a[0], dy: i ? 28 : 0 });
      t.textContent = line;
      text.append(t);
    });
    return text;
  }
  if (tool === "rectangle")
    return el("rect", {
      ...attr,
      x: Math.min(a[0], b[0]),
      y: Math.min(a[1], b[1]),
      width: Math.abs(b[0] - a[0]),
      height: Math.abs(b[1] - a[1]),
    });
  if (tool === "ellipse")
    return el("ellipse", {
      ...attr,
      cx: (a[0] + b[0]) / 2,
      cy: (a[1] + b[1]) / 2,
      rx: Math.abs(b[0] - a[0]) / 2,
      ry: Math.abs(b[1] - a[1]) / 2,
    });
  const end = tool === "line" || tool === "arrow" ? [a, b] : points;
  const group = el("g", { opacity: tool === "highlighter" ? 0.32 : 1 });
  group.append(el("path", { ...attr, d: smoothPath(end) }));
  if (tool === "arrow") {
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]),
      length = 14 + width;
    const wing = (direction) => [
      b[0] - length * Math.cos(angle + direction * 0.45),
      b[1] - length * Math.sin(angle + direction * 0.45),
    ];
    group.append(
      el("polyline", {
        ...attr,
        points: [wing(-1), b, wing(1)].map((p) => p.join(",")).join(" "),
      }),
    );
  }
  return group;
}
export function mountAnnotations(
  root,
  paperId,
  exportHandler,
  scope = "legacy",
) {
  const notebookId = `${paperId}:${scope}`;
  const controller = new AbortController(),
    signal = controller.signal;
  const on = (el, event, fn) => el?.addEventListener(event, fn, { signal });
  const toolbar = root.querySelector(".ink-toolbar"),
    toggle = root.querySelector("[data-ink-toggle]");
  if (!toolbar) return () => controller.abort();
  const records = [];
  let active,
    cleanupText = () => {};
  const status = toolbar.querySelector(".ink-save-status");
  const report = (entry) => {
    status.textContent = entry.saved
      ? entry.data.objects.length
        ? "Saved locally"
        : "No notes yet"
      : "Storage full or unavailable · notes are only in memory; download a copy";
    status.classList.toggle("ink-storage-warning", !entry.saved);
    toolbar.querySelector('[data-ink-command="undo"]').disabled =
      !entry.past.length;
    toolbar.querySelector('[data-ink-command="redo"]').disabled =
      !entry.future.length;
    toolbar.querySelector('[data-ink-command="clear"]').disabled =
      !entry.data.objects.length;
  };
  function activate(record) {
    active = record;
    activeQuestions.set(notebookId, record.surface.dataset.annotationQuestion);
    for (const r of records)
      r.surface.classList.toggle(
        "ink-active-question",
        r === active && settings.enabled,
      );
    report(record.entry);
    const number = record.surface
      .closest(".question-card")
      .id.replace("question-", "");
    toolbar.querySelector(".ink-current-question").textContent = `Q${number}`;
    const questionSelect = root.querySelector("[data-download-question]");
    if (questionSelect)
      questionSelect.value = record.surface.dataset.annotationQuestion;
    const clear = toolbar.querySelector('[data-ink-command="clear"]');
    clear.querySelector("span").textContent = "Clear question";
    clear.setAttribute("aria-label", "Clear question");
    delete clear.dataset.confirm;
  }
  function redraw(record) {
    const { surface, svg, entry } = record;
    const rect = surface.getBoundingClientRect(),
      scale = Math.max(1, rect.width) / 1000;
    // Keep old ink in bounds when content or viewport dimensions change.
    const bottom = Math.max(
      0,
      ...entry.data.objects.map((o) => bounds(o).bottom + 40),
    );
    surface.style.minHeight = `${Math.max(440, entry.data.height * scale, bottom * scale)}px`;
    const h = Math.max(1, surface.getBoundingClientRect().height) / scale;
    svg.setAttribute("viewBox", `0 0 1000 ${h}`);
    svg.replaceChildren(...entry.data.objects.map(inkElement));
  }
  const sync = () => {
    toolbar.hidden = !settings.enabled;
    toggle?.setAttribute("aria-pressed", String(settings.enabled));
    if (toggle)
      toggle.textContent = settings.enabled ? "Pen mode: on" : "Pen mode";
    root.classList.toggle("ink-enabled", settings.enabled);
    for (const r of records) {
      r.surface.classList.toggle(
        "ink-active-question",
        settings.enabled && r === active,
      );
      r.svg.style.cursor =
        settings.tool === "text"
          ? "text"
          : settings.tool === "laser"
            ? "none"
            : settings.tool === "eraser"
              ? "cell"
              : "crosshair";
    }
    toolbar
      .querySelectorAll("[data-ink-tool]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.inkTool === settings.tool),
        ),
      );
    toolbar.querySelector("[data-ink-color]").value = settings.color;
    toolbar
      .querySelectorAll("[data-ink-swatch]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.inkSwatch === settings.color),
        ),
      );
    toolbar
      .querySelectorAll("[data-ink-width]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(Number(b.dataset.inkWidth) === settings.width),
        ),
      );
    toolbar.querySelector(".ink-tool-hint").textContent =
      settings.tool === "laser"
        ? "Laser · fades as you draw · never saved"
        : "Draw over the question · notes save on this device";
    toolbar
      .querySelectorAll("[data-ink-swatch],[data-ink-color],[data-ink-width]")
      .forEach(
        (b) => (b.disabled = ["laser", "eraser"].includes(settings.tool)),
      );
    for (const r of records)
      if (!settings.enabled || settings.tool !== "laser") r.laser.clear();
  };
  for (const surface of root.querySelectorAll("[data-annotation-question]")) {
    const svg = document.createElementNS(NS, "svg");
    svg.classList.add("ink-layer");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("preserveAspectRatio", "none");
    surface.append(svg);
    const record = {
      surface,
      svg,
      entry: notebook.get(paperId, surface.dataset.annotationQuestion, scope),
    };
    record.laser = createLaser(svg);
    records.push(record);
    const passage = surface.querySelector("details.context");
    if (passage) passage.open = record.entry.contextOpen;
    on(passage, "toggle", () =>
      notebook.setContext(record.entry, passage.open),
    );
    redraw(record);
    let drawing = null,
      preview,
      pointer,
      erasing = false,
      lasing = false;
    const erase = (p) => {
      const i = record.entry.data.objects.findLastIndex((o) => hitObject(o, p));
      if (i >= 0) {
        notebook.remove(record.entry, i);
        redraw(record);
        report(record.entry);
      }
    };
    const point = (e) => {
      const r = surface.getBoundingClientRect(),
        scale = 1000 / Math.max(1, r.width);
      return [
        Math.max(0, Math.min(1000, (e.clientX - r.left) * scale)),
        Math.max(0, (e.clientY - r.top) * scale),
      ];
    };
    on(svg, "pointerdown", (e) => {
      if (!settings.enabled || e.button > 0 || drawing || erasing || lasing)
        return;
      e.preventDefault();
      cleanupText();
      activate(record);
      if (settings.tool === "text") {
        const p = point(e),
          box = document.createElement("form");
        box.className = "ink-text-editor";
        box.dataset.exportControls = "";
        box.style.left = `${Math.min(65, p[0] / 10)}%`;
        box.style.top = `${(p[1] * surface.getBoundingClientRect().width) / 1000}px`;
        box.innerHTML =
          '<label>Add a note<textarea maxlength="500" rows="3" aria-label="Annotation text"></textarea></label><div><button type="submit">Add text</button><button type="button">Cancel</button></div>';
        surface.append(box);
        const input = box.querySelector("textarea");
        input.focus();
        cleanupText = () => {
          box.remove();
          cleanupText = () => {};
        };
        on(box, "submit", (ev) => {
          ev.preventDefault();
          if (input.value.trim()) {
            notebook.add(record.entry, {
              tool: "text",
              points: [[Math.min(650, p[0]), p[1]]],
              text: input.value
                .trim()
                .split("\n")
                .flatMap((line) => line.match(/.{1,30}/g) || [""])
                .join("\n")
                .slice(0, 500),
              color: settings.color,
              width: settings.width,
            });
            redraw(record);
            report(record.entry);
          }
          cleanupText();
        });
        on(box.querySelector('[type="button"]'), "click", cleanupText);
        on(input, "keydown", (ev) => {
          if (ev.key === "Escape") {
            ev.preventDefault();
            cleanupText();
          }
        });
        return;
      }
      if (settings.tool === "eraser") {
        pointer = e.pointerId;
        erasing = true;
        try {
          svg.setPointerCapture?.(pointer);
        } catch {
          /* The pointer may have already ended. */
        }
        erase(point(e));
        return;
      }
      pointer = e.pointerId;
      try {
        svg.setPointerCapture?.(pointer);
      } catch {
        /* The pointer may have already ended. */
      }
      if (settings.tool === "laser") {
        lasing = true;
        record.laser.begin(point(e));
        return;
      }
      drawing = {
        tool: settings.tool,
        points: [point(e)],
        color: settings.color,
        width: settings.width,
      };
      preview = inkElement(drawing);
      svg.append(preview);
    });
    on(svg, "pointermove", (e) => {
      if (settings.enabled && settings.tool === "laser") {
        if (lasing && e.pointerId === pointer)
          for (const sample of e.getCoalescedEvents?.().length
            ? e.getCoalescedEvents()
            : [e])
            record.laser.move(point(sample));
        else if (!lasing && e.pointerType !== "touch")
          record.laser.hover(point(e));
        return;
      }
      if (e.pointerId !== pointer) return;
      if (erasing) {
        erase(point(e));
        return;
      }
      if (!drawing) return;
      const p = point(e);
      if (["line", "arrow", "rectangle", "ellipse"].includes(settings.tool))
        drawing.points = [drawing.points[0], p];
      else if (drawing.points.length < 12000) drawing.points.push(p);
      const next = inkElement(drawing);
      preview.replaceWith(next);
      preview = next;
    });
    const finish = (e, cancel = false) => {
      if (e.pointerId !== pointer) return;
      erasing = false;
      try {
        svg.releasePointerCapture?.(pointer);
      } catch {
        /* Capture may already be released. */
      }
      if (lasing) {
        lasing = false;
        if (cancel) record.laser.clear();
        else record.laser.end();
        return;
      }
      if (!drawing) return;
      if (cancel) preview.remove();
      else {
        notebook.add(record.entry, drawing);
        redraw(record);
        report(record.entry);
      }
      drawing = null;
    };
    on(svg, "pointerup", (e) => finish(e));
    on(svg, "pointercancel", (e) => finish(e, true));
    on(svg, "pointerleave", () => record.laser.leave());
    on(surface, "focusin", () => activate(record));
    on(surface, "click", () => {
      if (!settings.enabled) activate(record);
    });
  }
  if (records.length)
    activate(
      records.find(
        (r) =>
          r.surface.dataset.annotationQuestion ===
          activeQuestions.get(notebookId),
      ) || records[0],
    );
  on(toggle, "click", () => {
    cleanupText();
    settings.enabled = !settings.enabled;
    sync();
  });
  function chooseTool(tool) {
    cleanupText();
    settings.tool = tool;
    settings.color = colors[tool === "highlighter" ? "highlighter" : "pen"];
    sync();
  }
  on(toolbar, "click", (e) => {
    const tool = e.target.closest("[data-ink-tool]");
    if (tool) {
      chooseTool(tool.dataset.inkTool);
      return;
    }
    const swatch = e.target.closest("[data-ink-swatch]");
    if (swatch) {
      settings.color = swatch.dataset.inkSwatch;
      colors[settings.tool === "highlighter" ? "highlighter" : "pen"] =
        settings.color;
      sync();
      return;
    }
    const width = e.target.closest("[data-ink-width]");
    if (width) {
      settings.width = Number(width.dataset.inkWidth);
      sync();
    }
  });
  on(toolbar.querySelector("[data-ink-color]"), "input", (e) => {
    settings.color = e.target.value;
    colors[settings.tool === "highlighter" ? "highlighter" : "pen"] =
      settings.color;
    sync();
  });
  on(toolbar, "click", (e) => {
    const button = e.target.closest("[data-ink-command]");
    if (!button || !active) return;
    cleanupText();
    const { entry } = active;
    const command = button.dataset.inkCommand;
    if (command === "clear" && !button.dataset.confirm) {
      button.dataset.confirm = "yes";
      button.querySelector("span").textContent = "Confirm clear";
      button.setAttribute("aria-label", "Confirm clear");
      return;
    }
    if (command === "space") {
      const r = active.surface.getBoundingClientRect();
      notebook.extend(
        entry,
        Math.max(entry.data.height, (r.height * 1000) / Math.max(1, r.width)) +
          300,
      );
    } else notebook[command](entry);
    redraw(active);
    report(entry);
    if (command === "clear") {
      button.querySelector("span").textContent = "Clear question";
      button.setAttribute("aria-label", "Clear question");
    }
    delete button.dataset.confirm;
  });
  on(root.querySelector("[data-ink-done]"), "click", () => {
    cleanupText();
    settings.enabled = false;
    sync();
    toggle?.focus();
  });
  on(root, "keydown", (e) => {
    if (
      e.target.closest(
        'textarea,input:not([type="color"]),[contenteditable="true"]',
      ) ||
      root.querySelector('[role="dialog"]')
    )
      return;
    if (e.key === "Escape") {
      root.querySelectorAll(".session-downloads,.ink-help").forEach((d) => {
        d.open = false;
      });
      if (settings.enabled) {
        settings.enabled = false;
        sync();
        toggle?.focus();
      }
    }
    if (!settings.enabled || !active || !(e.ctrlKey || e.metaKey)) return;
    if (e.key.toLowerCase() === "z" || e.key.toLowerCase() === "y") {
      e.preventDefault();
      notebook[e.shiftKey || e.key.toLowerCase() === "y" ? "redo" : "undo"](
        active.entry,
      );
      redraw(active);
      report(active.entry);
    }
  });
  const downloadMenu = root.querySelector(".session-downloads");
  const exportButtons = () =>
    root.querySelectorAll("[data-ink-export],[data-export-all]");
  const downloadStatus = (message) => {
    const el = root.querySelector(".download-status");
    if (el) el.textContent = message;
  };
  for (const b of exportButtons()) b.disabled = exportBusy;
  on(root.querySelector("[data-download-question]"), "change", (e) => {
    const record = records.find(
      (r) => r.surface.dataset.annotationQuestion === e.target.value,
    );
    if (record) {
      activate(record);
      record.surface
        .closest(".question-card")
        .scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  on(root, "click", (e) => {
    const jump = e.target.closest('[data-action="jump"]');
    if (jump && records.length > 1 && records[Number(jump.dataset.index)])
      activate(records[Number(jump.dataset.index)]);
    if (downloadMenu && !downloadMenu.contains(e.target))
      downloadMenu.open = false;
    const help = root.querySelector(".ink-help");
    if (help && !help.contains(e.target)) help.open = false;
  });
  on(root, "click", async (e) => {
    const button = e.target.closest("[data-ink-export],[data-export-all]");
    if (!button || exportBusy) return;
    cleanupText();
    exportBusy = true;
    for (const b of exportButtons()) b.disabled = true;
    const all = button.hasAttribute("data-export-all");
    const questionId = root.querySelector("[data-download-question]").value;
    const format = button.dataset.inkExport || "pdf";
    downloadStatus(`Preparing ${format.toUpperCase()}…`);
    try {
      const cards = all
        ? [...root.querySelectorAll(".review-card")]
        : [
            root
              .querySelector(`[data-annotation-question="${questionId}"]`)
              ?.closest(".question-card"),
          ];
      await exportHandler(
        cards.filter(Boolean),
        format,
        all ? undefined : questionId,
        (current, total) =>
          downloadStatus(`Preparing question ${current} of ${total}…`),
      );
      downloadStatus(
        `${all ? "Full paper" : "Question"} ${format.toUpperCase()} ready · download started`,
      );
    } catch (error) {
      downloadStatus("Download failed. Try again. Your notes are unchanged.");
      console.error("Annotation export failed", error);
    } finally {
      exportBusy = false;
      for (const b of exportButtons()) b.disabled = false;
    }
  });
  const header = root.querySelector(".session-topbar");
  const updateHeaderHeight = () =>
    root.style.setProperty(
      "--session-header-height",
      `${(header?.getBoundingClientRect().height || 0) + 16}px`,
    );
  let observer;
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(() => {
      records.forEach(redraw);
      updateHeaderHeight();
    });
    records.forEach((r) => observer.observe(r.surface));
    if (header) observer.observe(header);
  }
  on(window, "resize", () => records.forEach(redraw));
  sync();
  updateHeaderHeight();
  return () => {
    for (const record of records) {
      const passage = record.surface.querySelector("details.context");
      if (passage) notebook.setContext(record.entry, passage.open);
    }
    cleanupText();
    controller.abort();
    observer?.disconnect();
    records.forEach((r) => r.laser.dispose());
  };
}
