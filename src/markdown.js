import { marked } from "marked";
import katex from "katex";

// Protect TeX before Markdown interprets underscores and backslashes.
export function renderMarkdown(text = "") {
  const equations = [];
  const protectedText = text.replace(
    /\$\$([\s\S]+?)\$\$|(?<!\\)\$([^$\n]+?)(?<!\\)\$/g,
    (_, display, inline) => {
      const rendered = katex.renderToString((display ?? inline).trim(), {
        displayMode: display !== undefined,
        throwOnError: false,
        strict: false,
      });
      const token = `MATHPLACEHOLDER${equations.length}END`;
      equations.push(rendered);
      return token;
    },
  );
  return marked
    .parse(protectedText)
    .replace(/MATHPLACEHOLDER(\d+)END/g, (_, i) => equations[Number(i)])
    .replace(
      /<table>/g,
      '<div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable table"><table>',
    )
    .replace(/<\/table>/g, "</table></div>");
}
