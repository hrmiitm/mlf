// Export libraries load only when requested; all processing stays in the browser.
export function pageSlices(height, pageHeight) {
  const slices = [];
  for (let top = 0; top < height; top += pageHeight)
    slices.push({ top, height: Math.min(pageHeight, height - top) });
  return slices;
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
    let first = true;
    for (const [index, node] of snapshots.entries()) {
      progress(index + 1, snapshots.length);
      const canvas = await capture(node),
        contentWidth = 186;
      const ratio = contentWidth / canvas.width;
      const maxSlice = Math.floor(263 / ratio);
      for (const slice of pageSlices(canvas.height, maxSlice)) {
        if (!first) pdf.addPage();
        first = false;
        pdf.setFontSize(9);
        pdf.setTextColor(70, 83, 101);
        pdf.text(title, 12, 10);
        const part = document.createElement("canvas");
        part.width = canvas.width;
        part.height = slice.height;
        part
          .getContext("2d")
          .drawImage(
            canvas,
            0,
            slice.top,
            canvas.width,
            slice.height,
            0,
            0,
            canvas.width,
            slice.height,
          );
        pdf.addImage(
          part.toDataURL("image/png"),
          "PNG",
          12,
          15,
          contentWidth,
          slice.height * ratio,
          undefined,
          "FAST",
        );
        pdf.text(`MLF Study Room · Page ${pdf.getNumberOfPages()}`, 12, 290);
        part.width = part.height = 0;
      }
      canvas.width = canvas.height = 0;
    }
    download(pdf.output("blob"), `${filename}.pdf`);
  } finally {
    stage.remove();
  }
}
