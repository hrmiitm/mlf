const NS = "http://www.w3.org/2000/svg";
export const LASER_LIFETIME = 1050;
export function laserOpacity(age) {
  return (
    Math.max(0, 1 - Math.max(0, age - 100) / (LASER_LIFETIME - 100)) ** 1.6
  );
}
export function smoothPath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].join(" ")} l .1 .1`;
  let d = `M ${points[0].join(" ")}`;
  for (let i = 1; i < points.length - 1; i++)
    d += ` Q ${points[i].join(" ")} ${(points[i][0] + points[i + 1][0]) / 2} ${(points[i][1] + points[i + 1][1]) / 2}`;
  return d + ` L ${points.at(-1).join(" ")}`;
}
export function createLaser(svg, runtime = {}) {
  const now = runtime.now || (() => window.performance.now()),
    raf =
      runtime.raf ||
      ((cb) =>
        window.requestAnimationFrame
          ? window.requestAnimationFrame(cb)
          : window.setTimeout(cb, 16)),
    cancel =
      runtime.cancel ||
      ((id) =>
        window.cancelAnimationFrame
          ? window.cancelAnimationFrame(id)
          : window.clearTimeout(id));
  const group = document.createElementNS(NS, "g");
  group.dataset.inkTransient = "";
  group.classList.add("laser-trail");
  let trails = [],
    current = null,
    tip = null,
    frame = 0,
    disposed = false;
  const element = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };
  function draw() {
    frame = 0;
    if (disposed) return;
    const time = now();
    for (const trail of trails)
      while (trail.length && time - trail[0].time >= LASER_LIFETIME)
        trail.shift();
    trails = trails.filter((t) => t.length || t === current);
    const paths = new Map();
    for (const trail of trails)
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1],
          b = trail[i],
          alpha = laserOpacity(time - b.time),
          bucket = Math.ceil(alpha * 12) / 12;
        if (bucket <= 0) continue;
        paths.set(
          bucket,
          (paths.get(bucket) || "") + `M ${a.x} ${a.y} L ${b.x} ${b.y} `,
        );
      }
    const children = [];
    for (const [opacity, d] of paths) {
      children.push(
        element("path", {
          d,
          fill: "none",
          stroke: "#ff4b45",
          "stroke-width": 11,
          "stroke-linecap": "round",
          opacity: opacity * 0.18,
        }),
      );
      children.push(
        element("path", {
          d,
          fill: "none",
          stroke: "#ff302b",
          "stroke-width": 3.5,
          "stroke-linecap": "round",
          opacity,
        }),
      );
      children.push(
        element("path", {
          d,
          fill: "none",
          stroke: "#ffd3c8",
          "stroke-width": 1.1,
          "stroke-linecap": "round",
          opacity: opacity * 0.9,
        }),
      );
    }
    const tipAlpha = tip ? Math.max(0, 1 - (time - tip.time) / 650) : 0;
    if (tipAlpha > 0) {
      children.push(
        element("circle", {
          cx: tip.x,
          cy: tip.y,
          r: 10,
          fill: "#ff443b",
          opacity: tipAlpha * 0.17,
        }),
      );
      children.push(
        element("circle", {
          cx: tip.x,
          cy: tip.y,
          r: 4,
          fill: "#ff302b",
          opacity: tipAlpha,
        }),
      );
      children.push(
        element("circle", {
          cx: tip.x,
          cy: tip.y,
          r: 1.6,
          fill: "#fff4ea",
          opacity: tipAlpha,
        }),
      );
    }
    group.replaceChildren(...children);
    if (children.length) {
      if (!svg.contains(group)) svg.append(group);
      frame = raf(draw);
    } else group.remove();
  }
  function schedule() {
    if (!frame) frame = raf(draw);
  }
  function sample(p) {
    const next = { x: p[0], y: p[1], time: now() };
    tip = next;
    if (current) {
      current.push(next);
      if (current.length > 512) current.shift();
    }
    schedule();
  }
  return {
    begin(p) {
      current = [];
      trails.push(current);
      sample(p);
    },
    move(p) {
      sample(p);
    },
    hover(p) {
      tip = { x: p[0], y: p[1], time: now() };
      schedule();
    },
    end() {
      current = null;
    },
    leave() {
      if (!current) tip = null;
    },
    clear() {
      current = null;
      trails = [];
      tip = null;
      cancel(frame);
      frame = 0;
      group.remove();
    },
    dispose() {
      this.clear();
      disposed = true;
    },
  };
}
