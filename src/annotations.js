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
export function annotationToolbar() {
  return `<div class="ink-toolbar" id="annotation-tools" data-export-controls hidden role="group" aria-label="Annotation tools">
    <span class="ink-current-question"></span>
    <label>Tool <select data-ink-tool aria-label="Annotation tool">${Object.entries(
      toolNames,
    )
      .map(([v, label]) => `<option value="${v}">${label}</option>`)
      .join("")}</select></label>
    <label>Color <input data-ink-color type="color" value="${settings.color}" aria-label="Ink color"></label>
    <label>Size <select data-ink-width aria-label="Stroke width"><option value="2">Fine</option><option value="3">Medium</option><option value="6">Thick</option><option value="12">Broad</option></select></label>
    <details class="ink-edits" open><summary>Edit notes</summary><div class="ink-edit-actions"><button data-ink-command="undo">Undo</button><button data-ink-command="redo">Redo</button><button data-ink-command="space">More space</button>
    <button data-ink-command="clear">Clear question</button></div></details><span class="ink-save-status" role="status">Choose a question to annotate</span>
    <button data-ink-done>Done drawing</button><details class="ink-help"><summary>Help</summary><p>Draw over the question with a mouse, touch, or stylus. Turn Pen mode off to answer. Laser marks disappear and are not saved. Undo: Ctrl/⌘ Z. Exit drawing: Escape.</p></details>
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
  group.append(
    el("polyline", {
      ...attr,
      points: (end.length === 1 ? [a, [a[0] + 0.1, a[1] + 0.1]] : end)
        .map((p) => p.join(","))
        .join(" "),
    }),
  );
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
export function mountAnnotations(root, paperId, exportHandler) {
  const controller = new AbortController(),
    signal = controller.signal;
  const on = (el, event, fn) => el?.addEventListener(event, fn, { signal });
  const toolbar = root.querySelector(".ink-toolbar"),
    toggle = root.querySelector("[data-ink-toggle]");
  if (!toolbar) return () => controller.abort();
  const edits = root.querySelector(".ink-edits");
  let compact = window.innerWidth <= 760;
  if (edits) edits.open = !compact;
  const records = [];
  let active,
    cleanupText = () => {},
    transientTimer;
  const status = toolbar.querySelector(".ink-save-status");
  const report = (entry) => {
    status.textContent = entry.saved
      ? entry.data.objects.length
        ? "Notes saved locally"
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
    activeQuestions.set(paperId, record.surface.dataset.annotationQuestion);
    for (const r of records)
      r.surface.classList.toggle(
        "ink-active-question",
        r === active && settings.enabled,
      );
    report(record.entry);
    const number = record.surface
      .closest(".question-card")
      .id.replace("question-", "");
    toolbar.querySelector(".ink-current-question").textContent =
      `Question ${number}`;
    const questionSelect = root.querySelector("[data-download-question]");
    if (questionSelect)
      questionSelect.value = record.surface.dataset.annotationQuestion;
    const clear = toolbar.querySelector('[data-ink-command="clear"]');
    clear.textContent = "Clear question";
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
      r.svg.style.cursor = settings.tool === "text" ? "text" : "crosshair";
    }
    toolbar.querySelector("[data-ink-tool]").value = settings.tool;
    toolbar.querySelector("[data-ink-color]").value = settings.color;
    toolbar.querySelector("[data-ink-width]").value = String(settings.width);
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
      entry: notebook.get(paperId, surface.dataset.annotationQuestion),
    };
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
      erasing = false;
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
      if (!settings.enabled || e.button > 0 || drawing || erasing) return;
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
      drawing = {
        tool: settings.tool === "laser" ? "pen" : settings.tool,
        points: [point(e)],
        color: settings.tool === "laser" ? "#e02b34" : settings.color,
        width: settings.width,
      };
      preview = inkElement(drawing);
      if (settings.tool === "laser") preview.dataset.inkTransient = "";
      svg.append(preview);
    });
    on(svg, "pointermove", (e) => {
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
      if (settings.tool === "laser") next.dataset.inkTransient = "";
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
      if (!drawing) return;
      if (cancel) preview.remove();
      else if (settings.tool === "laser") {
        const old = preview;
        transientTimer = setTimeout(() => old.remove(), 700);
      } else {
        notebook.add(record.entry, drawing);
        redraw(record);
        report(record.entry);
      }
      drawing = null;
    };
    on(svg, "pointerup", (e) => finish(e));
    on(svg, "pointercancel", (e) => finish(e, true));
    on(surface, "focusin", () => activate(record));
    on(surface, "click", () => {
      if (!settings.enabled) activate(record);
    });
  }
  if (records.length)
    activate(
      records.find(
        (r) =>
          r.surface.dataset.annotationQuestion === activeQuestions.get(paperId),
      ) || records[0],
    );
  on(toggle, "click", () => {
    cleanupText();
    settings.enabled = !settings.enabled;
    sync();
  });
  on(toolbar.querySelector("[data-ink-tool]"), "change", (e) => {
    cleanupText();
    settings.tool = e.target.value;
    settings.color =
      colors[settings.tool === "highlighter" ? "highlighter" : "pen"];
    sync();
  });
  on(toolbar.querySelector("[data-ink-color]"), "input", (e) => {
    settings.color = e.target.value;
    colors[settings.tool === "highlighter" ? "highlighter" : "pen"] =
      settings.color;
  });
  on(toolbar.querySelector("[data-ink-width]"), "change", (e) => {
    settings.width = Number(e.target.value);
  });
  on(toolbar, "click", (e) => {
    const button = e.target.closest("[data-ink-command]");
    if (!button || !active) return;
    cleanupText();
    const { entry } = active;
    const command = button.dataset.inkCommand;
    if (command === "clear" && !button.dataset.confirm) {
      button.dataset.confirm = "yes";
      button.textContent = "Confirm clear";
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
    button.textContent =
      command === "clear" ? "Clear question" : button.textContent;
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
      e.target.closest("input,textarea,select") ||
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
    if (compact && edits && !edits.contains(e.target)) edits.open = false;
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
  on(window, "resize", () => {
    const nextCompact = window.innerWidth <= 760;
    if (nextCompact !== compact && edits) edits.open = !nextCompact;
    compact = nextCompact;
    records.forEach(redraw);
  });
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
    clearTimeout(transientTimer);
  };
}
