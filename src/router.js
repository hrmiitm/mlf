// Hash routing works unchanged under a GitHub Pages project subdirectory.
export function parseRoute(hash = "") {
  try {
    const url = new URL(hash.replace(/^#/, "") || "/", "https://mlf.local");
    const path = url.pathname
      .split("/")
      .filter(Boolean)
      .map(decodeURIComponent);
    const q = Number(url.searchParams.get("q"));
    const question = Number.isInteger(q) && q > 0 ? q : null;
    if (!path.length) return { type: "home" };
    if (path[0] === "collections" && path.length === 2)
      return { type: "collection", section: path[1] };
    if (path[0] === "papers" && path.length === 2)
      return { type: "paper", paper: path[1] };
    if (path[0] === "papers" && path.length === 3 && path[2] === "study")
      return { type: "study", paper: path[1] };
    if (
      path[0] === "attempts" &&
      path.length === 3 &&
      ["exam", "practice", "results"].includes(path[2])
    )
      return { type: "attempt", attemptId: path[1], view: path[2], question };
  } catch {
    /* Malformed URLs use the same recoverable not-found screen. */
  }
  return { type: "not-found" };
}
export function routeForState(state, questionNumber) {
  if (state.screen === "session") {
    const q = state.submitted ? state.reviewQuestion : questionNumber;
    return `#/attempts/${encodeURIComponent(state.attemptId)}/${state.submitted ? "results" : state.mode}${q ? `?q=${q}` : ""}`;
  }
  if (state.screen === "paper")
    return `#/papers/${encodeURIComponent(state.paper)}${state.guide ? "/study" : ""}`;
  if (state.screen === "section")
    return `#/collections/${encodeURIComponent(state.section)}`;
  return "#/";
}
export function syncRoute(state, questionNumber, replace = false) {
  const next = routeForState(state, questionNumber);
  if (window.location.hash === next) return next;
  const sameView = window.location.hash.split("?")[0] === next.split("?")[0];
  const previous = parseRoute(window.location.hash);
  const completedAttempt =
    state.screen === "session" &&
    state.submitted &&
    previous.type === "attempt" &&
    previous.attemptId === state.attemptId;
  window.history[
    replace || sameView || completedAttempt ? "replaceState" : "pushState"
  ](null, "", next);
  return next;
}
