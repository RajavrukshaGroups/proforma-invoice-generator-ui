// pdfGenerator.js
// Uses browser's native window.print() on the current window to generate a clean vector PDF.
// This bypasses popup blockers on mobile devices and utilizes modern CSS print media queries.

export async function downloadPDF(elementId, filename = 'Proforma-Invoice') {
  // Wait for fonts to be fully loaded
  if (document.fonts) {
    await document.fonts.ready;
  }

  // Save the original document title
  const originalTitle = document.title;
  
  // Set the title to the desired filename so the printed file has the correct name
  const title = filename.endsWith('.pdf') ? filename.slice(0, -4) : filename;
  document.title = title;

  // Add the printing helper class to body
  document.body.classList.add('is-printing');

  // Trigger print dialog
  window.print();

  // Restore the original title and remove class after a short delay (so the print dialog gets the custom title)
  setTimeout(() => {
    document.title = originalTitle;
    document.body.classList.remove('is-printing');
  }, 1000);
}

export function triggerPrint(elementId, title = 'Proforma Invoice') {
  downloadPDF(elementId, title);
}

export default { downloadPDF, triggerPrint };