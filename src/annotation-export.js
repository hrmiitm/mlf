// Export libraries load only when requested; all processing stays in the browser.
export function pageSlices(height, pageHeight) {
  const slices = [];
  for (let top = 0; top < height; top += pageHeight)
    slices.push({ top, height: Math.min(pageHeight, height - top) });
  return slices;
}
// Stateful page packing keeps short questions intact and reuses remaining space.
export function createPdfLayout(pageHeight = 263, gap = 6) {
  let page = 0,
    cursor = 0;
  return {
    place(height, findBreak = (_, limit) => limit) {
      if (!Number.isFinite(height) || height <= 0)
        throw new Error("Invalid question height");
      const segments = [];
      const nextPage = () => {
        page++;
        cursor = 0;
      };
      if (height <= pageHeight && height > pageHeight - cursor && cursor > 0)
        nextPage();
      let top = 0;
      while (height - top > 0.00001) {
        let available = pageHeight - cursor;
        if (
          available < 0.001 ||
          (height - top > available && available < 36 && cursor > 0)
        ) {
          nextPage();
          available = pageHeight;
        }
        let take = Math.min(height - top, available);
        if (height - top > take) {
          const safe = findBreak(top, take);
          if (Number.isFinite(safe) && safe > 0.001 && safe <= take)
            take = safe;
        }
        segments.push({ page, y: cursor, top, height: take });
        top += take;
        cursor += take;
        if (height - top > 0.00001) nextPage();
        else cursor += gap;
      }
      return segments;
    },
  };
}
function whitespaceBreak(canvas, top, maxHeight) {
  const end = Math.floor(top + maxHeight),
    start = Math.max(Math.ceil(top + 20), end - 80);
  if (end <= start) return maxHeight;
  const pixels = canvas
    .getContext("2d")
    .getImageData(0, start, canvas.width, end - start).data;
  for (let row = end - start - 1; row >= 0; row--) {
    let dark = 0;
    for (let x = 0; x < canvas.width; x += 2) {
      const i = (row * canvas.width + x) * 4;
      if (
        pixels[i + 3] > 0 &&
        Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) < 110
      )
        dark++;
    }
    if (dark < Math.max(8, canvas.width * 0.005)) return start + row - top;
  }
  return maxHeight;
}
function trimWritingSpace(card, clone) {
  const source = card.querySelector(".annotation-surface"),
    target = clone.querySelector(".annotation-surface");
  if (!source || !target) return;
  const rect = source.getBoundingClientRect(),
    scale = rect.width / 1000;
  let bottom = 0;
  for (const child of source.children) {
    if (
      !child.classList.contains("ink-layer") &&
      !child.hasAttribute("data-export-controls")
    )
      bottom = Math.max(
        bottom,
        child.getBoundingClientRect().bottom - rect.top,
      );
  }
  const svg = source.querySelector(".ink-layer");
  for (const mark of svg?.children || []) {
    if (mark.hasAttribute("data-ink-transient")) continue;
    const box = mark.getBBox();
    bottom = Math.max(bottom, (box.y + box.height + 40) * scale);
  }
  const height = Math.ceil(bottom + 16);
  target.style.minHeight = `${height}px`;
  target.style.paddingBottom = "16px";
  const ink = target.querySelector(".ink-layer");
  if (ink && scale > 0)
    ink.setAttribute("viewBox", `0 0 1000 ${height / scale}`);
}
function download(blob, name) {
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function exportAnnotations(
  cards,
  format,
  filename,
  title,
  progress = () => {},
) {
  if (!cards.length) throw new Error("No questions to export");
  const stage = document.createElement("div");
  stage.className = "ink-export-stage";
  stage.setAttribute("aria-hidden", "true");
  // Snapshot before awaiting so changing questions cannot alter an ongoing export.
  const snapshots = cards.map((card) => {
    const clone = card.cloneNode(true);
    clone.style.width = `${Math.max(320, Math.ceil(card.getBoundingClientRect().width))}px`;
    const oldFields = card.querySelectorAll("input"),
      newFields = clone.querySelectorAll("input");
    oldFields.forEach((field, i) => {
      newFields[i].value = field.value;
      newFields[i].checked = field.checked;
    });
    clone
      .querySelectorAll("[data-export-controls],.ink-text-editor")
      .forEach((el) => el.remove());
    // Temporary laser traces are presentation only, never part of a download.
    clone.querySelectorAll("[data-ink-transient]").forEach((el) => el.remove());
    if (format === "pdf") trimWritingSpace(card, clone);
    stage.append(clone);
    return clone;
  });
  document.body.append(stage);
  try {
    await document.fonts?.ready;
    const { toCanvas, getFontEmbedCSS } = await import("html-to-image");
    const fontEmbedCSS = await getFontEmbedCSS(stage, {
      preferredFontFormat: "woff2",
    });
    const capture = (node) =>
      toCanvas(node, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        fontEmbedCSS,
        skipAutoScale: false,
      });
    if (format === "png") {
      const canvas = await capture(snapshots[0]);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("PNG generation failed");
      download(blob, `${filename}.png`);
      return;
    }
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });
    pdf.setProperties({
      title,
      subject: "MLF questions with locally saved annotations",
      creator: "MLF Study Room",
    });
    const layout = createPdfLayout();
    let currentPage = -1;
    for (const [index, node] of snapshots.entries()) {
      progress(index + 1, snapshots.length);
      const canvas = await capture(node),
        contentWidth = 186,
        ratio = contentWidth / canvas.width;
      const segments = layout.place(
        canvas.height * ratio,
        (top, max) => whitespaceBreak(canvas, top / ratio, max / ratio) * ratio,
      );
      for (const segment of segments) {
        if (segment.page !== currentPage) {
          if (currentPage >= 0) pdf.addPage();
          currentPage = segment.page;
          pdf.setFontSize(9);
          pdf.setTextColor(70, 83, 101);
          pdf.text(title, 12, 10);
          pdf.text(`MLF Study Room - Page ${currentPage + 1}`, 12, 290);
        }
        const part = document.createElement("canvas");
        part.width = canvas.width;
        part.height = Math.max(1, Math.round(segment.height / ratio));
        part
          .getContext("2d")
          .drawImage(
            canvas,
            0,
            Math.round(segment.top / ratio),
            canvas.width,
            part.height,
            0,
            0,
            canvas.width,
            part.height,
          );
        pdf.addImage(
          part.toDataURL("image/png"),
          "PNG",
          12,
          15 + segment.y,
          contentWidth,
          segment.height,
          undefined,
          "FAST",
        );
        part.width = part.height = 0;
      }
      canvas.width = canvas.height = 0;
    }
    download(pdf.output("blob"), `${filename}.pdf`);
  } finally {
    stage.remove();
  }
}
