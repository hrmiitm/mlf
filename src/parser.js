/** Parse the solved Markdown papers as the single source of question content. */
export function parsePaper(markdown, meta) {
  const guide =
    markdown
      .split("## Before you begin: topics and solving strategies")[1]
      ?.split(/\n## Question 1\b/)[0]
      ?.replace(/\n---\s*$/, "")
      .trim() || "";
  const chunks = markdown.split(/(?=^#{2,3} Question \d+\s*—)/m).slice(1);
  let context = null;
  const questions = [];
  for (const chunk of chunks) {
    const header = chunk.match(/^(#{2,3}) Question (\d+)\s*—\s*(.+)$/m);
    const type = chunk.match(/\*\*Type:\*\*\s*(MCQ|MSQ|SA|COMPREHENSION)/)?.[1];
    const marks = Number(chunk.match(/\*\*Marks:\*\*\s*(\d+)/)?.[1]);
    const id = chunk.match(/\*\*Question ID:\*\*\s*`(\d+)`/)?.[1];
    if (!header || !type || !id || !Number.isFinite(marks))
      throw new Error(`Invalid question in ${meta.id}`);
    const number = Number(header[2]);
    const solution = chunk
      .match(
        /<details>\s*<summary>[^<]*<\/summary>\s*([\s\S]*?)\s*<\/details>/,
      )?.[1]
      ?.trim();
    if (!solution) throw new Error(`Missing solution: ${meta.id} Q${number}`);
    let body = chunk
      .slice(
        chunk.indexOf("\n", chunk.indexOf("**Marks:**")) + 1,
        chunk.indexOf("<details>"),
      )
      .trim();
    const optionMarker = body.indexOf("**Options:**");
    let options = [];
    if (optionMarker !== -1) {
      const optionText = body
        .slice(optionMarker + "**Options:**".length)
        .trim();
      body = body.slice(0, optionMarker).trim();
      const pattern = /^(?:- \[ \] )?(?:\*\*)?([A-D])\.(?:\*\*)?\s*/gm;
      const matches = [...optionText.matchAll(pattern)];
      options = matches.map((match, i) => ({
        label: match[1],
        text: optionText
          .slice(
            match.index + match[0].length,
            matches[i + 1]?.index ?? optionText.length,
          )
          .trim(),
      }));
    }
    body = body.replace(/\*\*Answer \(Numeric\):\*\*\s*_+/g, "").trim();
    const item = {
      id,
      number,
      title: header[3].trim(),
      type,
      marks,
      body,
      options,
      solution,
    };
    if (type === "COMPREHENSION") {
      context = item;
      continue;
    }
    if (header[1] === "###" && context) item.context = context;
    else context = null;
    if (!(number in meta.answers))
      throw new Error(`Missing answer key: ${meta.id} Q${number}`);
    item.answer = meta.answers[number];
    if (
      (type === "MCQ" || type === "MSQ") &&
      (!options.length ||
        item.answer.some((a) => !options.some((o) => o.label === a)))
    )
      throw new Error(`Invalid options or answer: ${meta.id} Q${number}`);
    questions.push(item);
  }
  return {
    ...meta,
    guide,
    questions,
    totalMarks: questions.reduce((n, q) => n + q.marks, 0),
  };
}

/** Numeric answers use a tiny tolerance for normal floating-point representations. */
export function gradeQuestion(question, answer) {
  if (question.type === "SA") {
    if (answer === undefined || answer === null || String(answer).trim() === "")
      return false;
    const value = Number(answer);
    return Number.isFinite(value) && Math.abs(value - question.answer) < 1e-8;
  }
  if (!Array.isArray(answer)) return false;
  return (
    answer.length === question.answer.length &&
    question.answer.every((value) => answer.includes(value))
  );
}
export function isAnswered(answer) {
  return Array.isArray(answer)
    ? answer.length > 0
    : answer !== undefined && answer !== null && String(answer).trim() !== "";
}
