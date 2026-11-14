// Versioned, per-paper/per-question ink. Independent of examination answers.
export const INK_PREFIX = "mlf-ink-v1:";
const tools = new Set([
  "pen",
  "highlighter",
  "line",
  "arrow",
  "rectangle",
  "ellipse",
  "text",
]);
const empty = () => ({ version: 1, objects: [], height: 0 });
export function validObject(o) {
  return (
    o &&
    tools.has(o.tool) &&
    /^#[\da-f]{6}$/i.test(o.color) &&
    Number.isFinite(o.width) &&
    o.width > 0 &&
    o.width <= 40 &&
    Array.isArray(o.points) &&
    o.points.length > 0 &&
    o.points.length <= 12000 &&
    o.points.every(
      (p) =>
        Array.isArray(p) &&
        p.length === 2 &&
        p.every(Number.isFinite) &&
        p.every((n) => n >= 0 && n <= 100000),
    ) &&
    (o.tool !== "text" || (typeof o.text === "string" && o.text.length <= 500))
  );
}
export function createNotebook(storage) {
  const documents = new Map();
  function get(paper, question) {
    const key =
      INK_PREFIX +
      encodeURIComponent(paper) +
      ":" +
      encodeURIComponent(question);
    if (!documents.has(key)) {
      let data = empty(),
        contextOpen = true;
      try {
        const parsed = JSON.parse(storage?.getItem(key) || "null");
        if (parsed?.version === 1 && Array.isArray(parsed.objects)) {
          contextOpen = parsed.contextOpen !== false;
          data = {
            version: 1,
            objects: parsed.objects.filter(validObject),
            height: Math.min(100000, Math.max(0, Number(parsed.height) || 0)),
          };
        }
      } catch {
        /* Corrupt or unavailable storage starts a safe in-memory page. */
      }
      const entry = {
        key,
        data,
        contextOpen,
        past: [],
        future: [],
        saved: true,
      };
      documents.set(key, entry);
    }
    return documents.get(key);
  }
  function persist(entry) {
    try {
      if (!storage) throw new Error("Storage unavailable");
      storage.setItem(
        entry.key,
        JSON.stringify({ ...entry.data, contextOpen: entry.contextOpen }),
      );
      entry.saved = true;
    } catch {
      entry.saved = false;
    }
    return entry.saved;
  }
  function change(entry, update) {
    entry.past.push(entry.data);
    if (entry.past.length > 60) entry.past.shift();
    entry.future = [];
    entry.data = update(entry.data);
    return persist(entry);
  }
  return {
    get,
    setContext(entry, open) {
      entry.contextOpen = Boolean(open);
      return persist(entry);
    },
    add(entry, object) {
      if (!validObject(object)) return false;
      return change(entry, (d) => ({ ...d, objects: [...d.objects, object] }));
    },
    remove(entry, index) {
      return change(entry, (d) => ({
        ...d,
        objects: d.objects.filter((_, i) => i !== index),
      }));
    },
    clear(entry) {
      return change(entry, (d) => ({ ...d, objects: [] }));
    },
    extend(entry, height) {
      return change(entry, (d) => ({ ...d, height }));
    },
    undo(entry) {
      if (!entry.past.length) return;
      entry.future.push(entry.data);
      entry.data = entry.past.pop();
      persist(entry);
    },
    redo(entry) {
      if (!entry.future.length) return;
      entry.past.push(entry.data);
      entry.data = entry.future.pop();
      persist(entry);
    },
  };
}
export function bounds(object) {
  const xs = object.points.map((p) => p[0]),
    ys = object.points.map((p) => p[1]);
  return {
    left: Math.min(...xs),
    right:
      Math.max(...xs) +
      (object.tool === "text" ? Math.min(450, object.text.length * 10) : 0),
    top: Math.min(...ys),
    bottom:
      Math.max(...ys) +
      (object.tool === "text" ? 28 * object.text.split("\n").length : 0),
  };
}
function segmentDistance(p, a, b) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(
      1,
      ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1),
    ),
  );
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
export function hitObject(o, p) {
  const b = bounds(o),
    tolerance = Math.max(12, o.width);
  if (
    p[0] < b.left - tolerance ||
    p[0] > b.right + tolerance ||
    p[1] < b.top - tolerance ||
    p[1] > b.bottom + tolerance
  )
    return false;
  if (o.tool === "text") return true;
  if (o.tool === "rectangle") {
    return (
      Math.min(
        Math.abs(p[0] - b.left),
        Math.abs(p[0] - b.right),
        Math.abs(p[1] - b.top),
        Math.abs(p[1] - b.bottom),
      ) < tolerance
    );
  }
  if (o.tool === "ellipse") {
    const rx = (b.right - b.left) / 2 || 1,
      ry = (b.bottom - b.top) / 2 || 1;
    return (
      Math.abs(
        Math.hypot((p[0] - (b.left + rx)) / rx, (p[1] - (b.top + ry)) / ry) - 1,
      ) *
        Math.min(rx, ry) <
      tolerance
    );
  }
  if (o.points.length === 1)
    return Math.hypot(p[0] - o.points[0][0], p[1] - o.points[0][1]) < tolerance;
  return o.points
    .slice(1)
    .some((b, i) => segmentDistance(p, o.points[i], b) < tolerance);
}
