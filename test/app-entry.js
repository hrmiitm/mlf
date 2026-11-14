// Test-only preloading keeps synchronous DOM interactions deterministic.
// Production src/main.js imports only catalog metadata and loads on navigation.
import { loadPaper } from "../src/papers.js";
window.__mlfReady = Promise.all([
  loadPaper("march-2026"),
  loadPaper("july-2026"),
]).then(() => import("../src/main.js"));
