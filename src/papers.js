// Keep the catalog small. Questions, solutions and keys are fetched only on demand.
export const papers = [
  {
    id: "march-2026",
    section: "q1",
    date: "15 March 2026",
    shortDate: "MAR 2026",
    questionCount: 16,
    totalMarks: 40,
  },
  {
    id: "july-2026",
    section: "q1",
    date: "16 July 2026",
    shortDate: "JUL 2026",
    questionCount: 13,
    totalMarks: 40,
  },
];
const loaders = {
  "march-2026": () => import("./paper-data/march-2026.js"),
  "july-2026": () => import("./paper-data/july-2026.js"),
};
let renderer;
export const renderPaperMarkdown = (text) => {
  if (!renderer) throw new Error("Paper renderer is not loaded");
  return renderer(text);
};
const cache = new Map(),
  pending = new Map();
export const getLoadedPaper = (id) => cache.get(id);
export function loadPaper(id) {
  if (cache.has(id)) return Promise.resolve(cache.get(id));
  if (!loaders[id])
    return Promise.reject(new Error("This paper is not available."));
  if (!pending.has(id)) {
    const request = loaders[id]()
      .then(({ default: paper, renderMarkdown }) => {
        renderer = renderMarkdown;
        cache.set(id, paper);
        pending.delete(id);
        return paper;
      })
      .catch((error) => {
        pending.delete(id);
        throw error;
      });
    pending.set(id, request);
  }
  return pending.get(id);
}
