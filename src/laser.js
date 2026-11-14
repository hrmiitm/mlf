const NS = "http://www.w3.org/2000/svg";
export const LASER_LIFETIME = 1450;
export function laserOpacity(age) {
  return (
    Math.max(0, 1 - Math.max(0, age - 350) / (LASER_LIFETIME - 350)) ** 1.8
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
    // Curve through midpoints instead of drawing separate straight line samples.
    // Age controls both opacity and thickness, leaving a tapered, receding tail.
    const paths = new Map();
    for (const trail of trails) {
      if (trail.length < 2) continue;
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i],
          previous = trail[i - 1],
          next = trail[i + 1];
        const start = previous
          ? [(previous.x + p.x) / 2, (previous.y + p.y) / 2]
          : [p.x, p.y];
        const end = next
          ? [(p.x + next.x) / 2, (p.y + next.y) / 2]
          : [p.x, p.y];
        const opacity = Math.round(laserOpacity(time - p.time) * 32) / 32;
        if (!opacity) continue;
        paths.set(
          opacity,
          (paths.get(opacity) || "") +
            `M ${start.join(" ")} Q ${p.x} ${p.y} ${end.join(" ")} `,
        );
      }
    }
    const children = [];
    // All widths are screen pixels, so the pointer does not grow on wide papers.
    const stroke = (d, color, width, opacity) =>
      element("path", {
        d,
        fill: "none",
        stroke: color,
        "stroke-width": width,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "vector-effect": "non-scaling-stroke",
        opacity,
      });
    for (const [opacity, d] of paths) {
      const taper = 0.15 + 0.85 * Math.sqrt(opacity);
      children.push(stroke(d, "#ff332b", 6 * taper, opacity * 0.12));
      children.push(stroke(d, "#f32620", 2.4 * taper, opacity));
      children.push(stroke(d, "#ffe0d4", 0.6 * taper, opacity * 0.65));
    }
    const tipAlpha = tip
      ? current || tip.hover
        ? 1
        : Math.max(0, 1 - (time - tip.time) / 400)
      : 0;
    if (tipAlpha > 0) {
      const unit = 1000 / (svg.getBoundingClientRect().width || 1000);
      for (const [r, fill, opacity] of [
        [6, "#ff332b", tipAlpha * 0.12],
        [2.8, "#f32620", tipAlpha],
        [1, "#fff0e8", tipAlpha * 0.9],
      ])
        children.push(
          element("circle", {
            cx: tip.x,
            cy: tip.y,
            r: r * unit,
            fill,
            opacity,
          }),
        );
    }
    group.replaceChildren(...children);
    if (children.length) {
      if (!svg.contains(group)) svg.append(group);
      if (trails.some((trail) => trail.length) || (!current && !tip?.hover))
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
      const last = current.at(-1);
      if (!last || Math.hypot(next.x - last.x, next.y - last.y) > 0.4)
        current.push(next);
      if (current.length > 1024) current.shift();
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
      tip = { x: p[0], y: p[1], time: now(), hover: true };
      schedule();
    },
    end() {
      current = null;
      if (tip) tip.time = now();
      schedule();
    },
    leave() {
      if (!current) {
        tip = null;
        schedule();
      }
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
