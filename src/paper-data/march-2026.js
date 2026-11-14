import "katex/dist/katex.min.css";
export { renderMarkdown } from "../markdown.js";
import markdown from "../../papers/Q1/Solved-MLF_Practice_15_Mar_2026_Questions.md?raw";
import { parsePaper } from "../parser.js";
import { marchAnswers } from "../answer-keys.js";
export default parsePaper(markdown, {
  id: "march-2026",
  section: "q1",
  date: "15 March 2026",
  shortDate: "MAR 2026",
  answers: marchAnswers,
});
