// pdfGenerator.js

export async function downloadPDF(elementId, filename = "Proforma-Invoice") {
  // Wait until fonts are loaded before printing
  if (document.fonts) {
    await document.fonts.ready;
  }

  const originalTitle = document.title;

  const title = filename.endsWith(".pdf") ? filename.slice(0, -4) : filename;

  document.title = title;

  // Activate print-specific CSS
  document.body.classList.add("is-printing");

  const cleanup = () => {
    document.title = originalTitle;
    document.body.classList.remove("is-printing");

    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);

  // Give browser one frame to apply .is-printing styles
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.print();
    });
  });
}

export function triggerPrint(elementId, title = "Proforma Invoice") {
  return downloadPDF(elementId, title);
}

export default {
  downloadPDF,
  triggerPrint,
};
