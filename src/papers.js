import march from "../papers/Q1/Solved-MLF_Practice_15_Mar_2026_Questions.md?raw";
import july from "../papers/Q1/Solved-MLF_Practice_16_Jul_2026_Questions.md?raw";
import { parsePaper } from "./parser.js";
import { marchAnswers, julyAnswers } from "./answer-keys.js";

export const papers = [
  parsePaper(march, {
    id: "march-2026",
    date: "15 March 2026",
    shortDate: "MAR 2026",
    answers: marchAnswers,
  }),
  parsePaper(july, {
    id: "july-2026",
    date: "16 July 2026",
    shortDate: "JUL 2026",
    answers: julyAnswers,
  }),
];
