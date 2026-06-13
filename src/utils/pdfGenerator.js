// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';

// // Setup canvas color converter for fast, native color parsing fallback
// const oklchCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
// if (oklchCanvas) {
//   oklchCanvas.width = 1;
//   oklchCanvas.height = 1;
// }
// const oklchCtx = oklchCanvas ? oklchCanvas.getContext('2d', { willReadFrequently: true }) : null;

// function convertUnsupportedColorToRgb(colorStr) {
//   if (!colorStr) return colorStr;
//   const hasUnsupported = colorStr.includes('oklch') || colorStr.includes('oklab') || colorStr.includes('lab(') || colorStr.includes('lch(');
//   if (!hasUnsupported) return colorStr;
//   try {
//     if (oklchCtx) {
//       oklchCtx.fillStyle = colorStr;
//       oklchCtx.clearRect(0, 0, 1, 1);
//       oklchCtx.fillRect(0, 0, 1, 1);
//       const [r, g, b, a] = oklchCtx.getImageData(0, 0, 1, 1).data;
//       return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
//     }
//   } catch (e) {
//     // ignore
//   }
//   return 'rgb(255, 255, 255)';
// }

// function createProxyStyle(style) {
//   return new Proxy(style, {
//     get(target, prop) {
//       if (prop === 'getPropertyValue') {
//         return function (propertyName) {
//           const val = target.getPropertyValue(propertyName);
//           if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab') || val.includes('lab(') || val.includes('lch('))) {
//             if (propertyName === 'background-image' || propertyName === 'background') {
//               return val.replace(/(oklch|oklab|lab|lch)\([^)]+\)/g, (match) => convertUnsupportedColorToRgb(match));
//             }
//             return convertUnsupportedColorToRgb(val);
//           }
//           return val;
//         };
//       }
      
//       const val = target[prop];
//       if (typeof val === 'function') {
//         return val.bind(target);
//       }
//       if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab') || val.includes('lab(') || val.includes('lch('))) {
//         if (prop === 'backgroundImage' || prop === 'background' || prop === 'cssText') {
//           return val.replace(/(oklch|oklab|lab|lch)\([^)]+\)/g, (match) => convertUnsupportedColorToRgb(match));
//         }
//         return convertUnsupportedColorToRgb(val);
//       }
//       return val;
//     }
//   });
// }

// /**
//  * Capture an element on screen and generate/download a premium A4 PDF
//  */
// // export async function downloadPDF(elementId, filename) {
// //   const element = document.getElementById(elementId);
// //   if (!element) {
// //     console.error(`Element with ID ${elementId} not found`);
// //     return;
// //   }

// //   // Preserve styles and force specific dimensions to trigger A4 aspect ratio rendering
// //   const prevWidth = element.style.width;
// //   const prevMaxWidth = element.style.maxWidth;
// //   const prevShadow = element.style.boxShadow;

// //   element.style.width = '794px';
// //   element.style.maxWidth = '794px';
// //   element.style.boxShadow = 'none';

// //   // Back up getComputedStyle functions so we can override them temporarily
// //   const originalGetComputedStyle = window.getComputedStyle;
// //   let originalClonedGetComputedStyle = null;
// //   let clonedWindow = null;

// //   try {
// //     // We wait briefly for any rendering layout updates
// //     await new Promise((resolve) => setTimeout(resolve, 300));

// //     // Inject temporary getComputedStyle mock to catch oklch calls
// //     window.getComputedStyle = function (elt, pseudoElt) {
// //       const style = originalGetComputedStyle.call(this, elt, pseudoElt);
// //       return createProxyStyle(style);
// //     };

// //     const canvas = await html2canvas(element, {
// //       scale: 2, // High resolution (300 DPI alternative)
// //       useCORS: true,
// //       allowTaint: true,
// //       logging: false,
// //       backgroundColor: '#ffffff',
// //       windowWidth: 794,
// //       onclone: (clonedDoc) => {
// //         // Handle cloned document stylesheets and script containers
// //         clonedDoc.querySelectorAll('style').forEach((styleEl) => {
// //           if (styleEl.textContent && (styleEl.textContent.includes('oklch') || styleEl.textContent.includes('oklab') || styleEl.textContent.includes('lab(') || styleEl.textContent.includes('lch('))) {
// //             styleEl.textContent = styleEl.textContent.replace(/(oklch|oklab|lab|lch)\([^)]+\)/g, (match) => {
// //               return convertUnsupportedColorToRgb(match);
// //             });
// //           }
// //         });

// //         // Also intercept style inquiries inside the cloned context window
// //         clonedWindow = clonedDoc.defaultView;
// //         if (clonedWindow) {
// //           originalClonedGetComputedStyle = clonedWindow.getComputedStyle;
// //           clonedWindow.getComputedStyle = function (elt, pseudoElt) {
// //             const style = originalClonedGetComputedStyle.call(this, elt, pseudoElt);
// //             return createProxyStyle(style);
// //           };
// //         }
// //       }
// //     });

// //     const imgData = canvas.toDataURL('image/jpeg', 0.95);
// //     const pdf = new jsPDF('p', 'mm', 'a4');
    
// //     const pdfWidth = pdf.internal.pageSize.getWidth();
// //     const pdfHeight = pdf.internal.pageSize.getHeight();
    
// //     const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
// //     // Check if the image length fits on one page
// //     if (imgHeight <= pdfHeight) {
// //       pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight, undefined, 'FAST');
// //     } else {
// //       // Split into multiple pages if it leaks over
// //       let heightLeft = imgHeight;
// //       let position = 0;
      
// //       pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
// //       heightLeft -= pdfHeight;
      
// //       while (heightLeft > 0) {
// //         position = heightLeft - imgHeight; // slide up
// //         pdf.addPage();
// //         pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
// //         heightLeft -= pdfHeight;
// //       }
// //     }

// //     pdf.save(filename);
// //   } catch (error) {
// //     console.error('PDF render failed', error);
// //   } finally {
// //     // Restore styling and functions
// //     element.style.width = prevWidth;
// //     element.style.maxWidth = prevMaxWidth;
// //     element.style.boxShadow = prevShadow;
    
// //     window.getComputedStyle = originalGetComputedStyle;
// //     if (clonedWindow && originalClonedGetComputedStyle) {
// //       clonedWindow.getComputedStyle = originalClonedGetComputedStyle;
// //     }
// //   }
// // }
// export async function downloadPDF(elementId, filename) {
//   const element = document.getElementById(elementId);

//   if (!element) {
//     console.error(`Element with ID ${elementId} not found`);
//     return;
//   }

//   const originalGetComputedStyle = window.getComputedStyle;
//   let originalClonedGetComputedStyle = null;
//   let clonedWindow = null;

//   try {
//     await document.fonts.ready;

//     window.getComputedStyle = function (elt, pseudoElt) {
//       const style = originalGetComputedStyle.call(this, elt, pseudoElt);
//       return createProxyStyle(style);
//     };

//     const canvas = await html2canvas(element, {
//       scale: 2,
//       useCORS: true,
//       allowTaint: true,
//       backgroundColor: "#ffffff",
//       logging: false,
//       scrollX: 0,
//       scrollY: -window.scrollY,

//       onclone: (clonedDoc) => {
//         clonedDoc.querySelectorAll("style").forEach((styleEl) => {
//           if (
//             styleEl.textContent &&
//             (
//               styleEl.textContent.includes("oklch") ||
//               styleEl.textContent.includes("oklab") ||
//               styleEl.textContent.includes("lab(") ||
//               styleEl.textContent.includes("lch(")
//             )
//           ) {
//             styleEl.textContent = styleEl.textContent.replace(
//               /(oklch|oklab|lab|lch)\([^)]+\)/g,
//               (match) => convertUnsupportedColorToRgb(match)
//             );
//           }
//         });

//         clonedWindow = clonedDoc.defaultView;

//         if (clonedWindow) {
//           originalClonedGetComputedStyle = clonedWindow.getComputedStyle;

//           clonedWindow.getComputedStyle = function (elt, pseudoElt) {
//             const style = originalClonedGetComputedStyle.call(
//               this,
//               elt,
//               pseudoElt
//             );
//             return createProxyStyle(style);
//           };
//         }
//       }
//     });

//     const imgData = canvas.toDataURL("image/jpeg", 1.0);

//     const pdf = new jsPDF({
//       orientation: "portrait",
//       unit: "mm",
//       format: "a4",
//       compress: true,
//     });

//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const pdfHeight = pdf.internal.pageSize.getHeight();

//     const imgWidth = pdfWidth;
//     const imgHeight = (canvas.height * imgWidth) / canvas.width;

//     // Single-page PDF
//     if (imgHeight <= pdfHeight) {
//       pdf.addImage(
//         imgData,
//         "JPEG",
//         0,
//         0,
//         imgWidth,
//         imgHeight,
//         undefined,
//         "FAST"
//       );
//     } else {
//       // Multi-page PDF
//       let heightLeft = imgHeight;
//       let position = 0;

//       pdf.addImage(
//         imgData,
//         "JPEG",
//         0,
//         position,
//         imgWidth,
//         imgHeight,
//         undefined,
//         "FAST"
//       );

//       heightLeft -= pdfHeight;

//       while (heightLeft > 1) {
//         position = -(imgHeight - heightLeft);

//         pdf.addPage();

//         pdf.addImage(
//           imgData,
//           "JPEG",
//           0,
//           position,
//           imgWidth,
//           imgHeight,
//           undefined,
//           "FAST"
//         );

//         heightLeft -= pdfHeight;
//       }
//     }

//     pdf.save(`${filename}.pdf`);
//   } catch (error) {
//     console.error("PDF render failed:", error);
//   } finally {
//     window.getComputedStyle = originalGetComputedStyle;

//     if (clonedWindow && originalClonedGetComputedStyle) {
//       clonedWindow.getComputedStyle = originalClonedGetComputedStyle;
//     }
//   }
// }
// /**
//  * Invokes browser-native printing for a targeted section
//  */
// export function triggerPrint() {
//   if (typeof window !== 'undefined') {
//     window.print();
//   }
// }


// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';

// // Setup canvas color converter for fast, native color parsing fallback
// const oklchCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
// if (oklchCanvas) {
//   oklchCanvas.width = 1;
//   oklchCanvas.height = 1;
// }
// const oklchCtx = oklchCanvas ? oklchCanvas.getContext('2d', { willReadFrequently: true }) : null;

// function convertUnsupportedColorToRgb(colorStr) {
//   if (!colorStr) return colorStr;
//   const hasUnsupported = colorStr.includes('oklch') || colorStr.includes('oklab') || colorStr.includes('lab(') || colorStr.includes('lch(');
//   if (!hasUnsupported) return colorStr;
//   try {
//     if (oklchCtx) {
//       oklchCtx.fillStyle = colorStr;
//       oklchCtx.clearRect(0, 0, 1, 1);
//       oklchCtx.fillRect(0, 0, 1, 1);
//       const [r, g, b, a] = oklchCtx.getImageData(0, 0, 1, 1).data;
//       return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
//     }
//   } catch (e) {
//     // ignore
//   }
//   return 'rgb(255, 255, 255)';
// }

// function createProxyStyle(style) {
//   return new Proxy(style, {
//     get(target, prop) {
//       if (prop === 'getPropertyValue') {
//         return function (propertyName) {
//           const val = target.getPropertyValue(propertyName);
//           if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab') || val.includes('lab(') || val.includes('lch('))) {
//             if (propertyName === 'background-image' || propertyName === 'background') {
//               return val.replace(/(oklch|oklab|lab|lch)\([^)]+\)/g, (match) => convertUnsupportedColorToRgb(match));
//             }
//             return convertUnsupportedColorToRgb(val);
//           }
//           return val;
//         };
//       }
      
//       const val = target[prop];
//       if (typeof val === 'function') {
//         return val.bind(target);
//       }
//       if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab') || val.includes('lab(') || val.includes('lch('))) {
//         if (prop === 'backgroundImage' || prop === 'background' || prop === 'cssText') {
//           return val.replace(/(oklch|oklab|lab|lch)\([^)]+\)/g, (match) => convertUnsupportedColorToRgb(match));
//         }
//         return convertUnsupportedColorToRgb(val);
//       }
//       return val;
//     }
//   });
// }

// /**
//  * Capture an element on screen and generate/download a premium A4 PDF
//  */
// export async function downloadPDF(elementId, filename) {
//   const element = document.getElementById(elementId);
//   if (!element) {
//     console.error(`Element with ID ${elementId} not found`);
//     return;
//   }

//   // Preserve styles and force specific dimensions to trigger A4 aspect ratio rendering
//   const prevWidth = element.style.width;
//   const prevMaxWidth = element.style.maxWidth;
//   const prevShadow = element.style.boxShadow;

//   element.style.width = '794px';
//   element.style.maxWidth = '794px';
//   element.style.boxShadow = 'none';

//   // Back up getComputedStyle functions so we can override them temporarily
//   const originalGetComputedStyle = window.getComputedStyle;
//   let originalClonedGetComputedStyle = null;
//   let clonedWindow = null;

//   try {
//     // We wait briefly for any rendering layout updates
//     await new Promise((resolve) => setTimeout(resolve, 300));

//     // Inject temporary getComputedStyle mock to catch oklch calls
//     window.getComputedStyle = function (elt, pseudoElt) {
//       const style = originalGetComputedStyle.call(this, elt, pseudoElt);
//       return createProxyStyle(style);
//     };

//     const canvas = await html2canvas(element, {
//       scale: 2, // High resolution (300 DPI alternative)
//       useCORS: true,
//       allowTaint: true,
//       logging: false,
//       backgroundColor: '#ffffff',
//       windowWidth: 794,
//       onclone: (clonedDoc) => {
//         // Handle cloned document stylesheets and script containers
//         clonedDoc.querySelectorAll('style').forEach((styleEl) => {
//           if (styleEl.textContent && (styleEl.textContent.includes('oklch') || styleEl.textContent.includes('oklab') || styleEl.textContent.includes('lab(') || styleEl.textContent.includes('lch('))) {
//             styleEl.textContent = styleEl.textContent.replace(/(oklch|oklab|lab|lch)\([^)]+\)/g, (match) => {
//               return convertUnsupportedColorToRgb(match);
//             });
//           }
//         });

//         // Also intercept style inquiries inside the cloned context window
//         clonedWindow = clonedDoc.defaultView;
//         if (clonedWindow) {
//           originalClonedGetComputedStyle = clonedWindow.getComputedStyle;
//           clonedWindow.getComputedStyle = function (elt, pseudoElt) {
//             const style = originalClonedGetComputedStyle.call(this, elt, pseudoElt);
//             return createProxyStyle(style);
//           };
//         }
//       }
//     });

//     const imgData = canvas.toDataURL('image/jpeg', 0.95);
//     const pdf = new jsPDF('p', 'mm', 'a4');
    
//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const pdfHeight = pdf.internal.pageSize.getHeight();
    
//     const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
//     // Check if the image length fits on one page
//     // If it's close to 1 page (within 120mm threshold), we scale it down proportionally to fit on exactly 1 page
//     const singlePageTolerance = 120; 
//     if (imgHeight <= pdfHeight + singlePageTolerance) {
//       const scaleFactor = imgHeight > pdfHeight ? (pdfHeight / imgHeight) : 1;
//       const printWidth = pdfWidth * scaleFactor;
//       const printHeight = imgHeight * scaleFactor;
//       const xOffset = (pdfWidth - printWidth) / 2;
//       pdf.addImage(imgData, 'JPEG', xOffset, 0, printWidth, printHeight, undefined, 'FAST');
//     } else {
//       // Split into multiple pages if it leaks over
//       let heightLeft = imgHeight;
//       let position = 0;
      
//       pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
//       heightLeft -= pdfHeight;
      
//       while (heightLeft > 0) {
//         position = heightLeft - imgHeight; // slide up
//         pdf.addPage();
//         pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
//         heightLeft -= pdfHeight;
//       }
//     }

//     pdf.save(filename);
//   } catch (error) {
//     console.error('PDF render failed', error);
//   } finally {
//     // Restore styling and functions
//     element.style.width = prevWidth;
//     element.style.maxWidth = prevMaxWidth;
//     element.style.boxShadow = prevShadow;
    
//     window.getComputedStyle = originalGetComputedStyle;
//     if (clonedWindow && originalClonedGetComputedStyle) {
//       clonedWindow.getComputedStyle = originalClonedGetComputedStyle;
//     }
//   }
// }

// /**
//  * Invokes browser-native printing for a targeted section
//  */
// export function triggerPrint() {
//   if (typeof window !== 'undefined') {
//     window.print();
//   }
// }




/**
 * Downloads PDF using browser's native print-to-PDF functionality
 * This generates a true vector PDF (crisp text, selectable) and uses CSS fixes for mobile viewports.
 */
export async function downloadPDF(elementId, filename = 'document') {
  try {
    console.log('Starting PDF generation for element:', elementId);
    
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }
    
    // Show loading indicator
    const loadingToast = showLoadingIndicator();
    
    // Clone the element deeply
    const originalContent = element.cloneNode(true);
    
    // Get all styles from the document
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    let stylesHTML = '';
    styles.forEach(style => {
      if (style.tagName === 'STYLE') {
        stylesHTML += `<style>${style.innerHTML}</style>`;
      } else if (style.href && style.href.includes('.css')) {
        try {
          stylesHTML += `<link href="${style.href}" rel="stylesheet">`;
        } catch (e) {
          console.warn('Could not load stylesheet:', style.href);
        }
      }
    });
    
    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);
    
    // Write content to iframe
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    
    // The key to fixing mobile printing is locking the viewport to the exact 794px width
    // and removing any artificial CSS scaling, relying entirely on the browser's A4 fit.
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=794, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          ${stylesHTML}
          <style>
            @media print {
              @page {
                size: 210mm 297mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background: white;
                width: 210mm !important;
              }
              .no-print {
                display: none !important;
              }
              #print-container {
                width: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
              }
              /* Override inline styles of the cloned element to ensure it fills the 210mm space without overflowing */
              #print-container > div {
                width: 210mm !important;
                min-height: 297mm !important;
              }
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: Calibri, "Segoe UI", Roboto, Arial, sans-serif;
              background: white;
            }
            
            #print-container {
              width: 100%;
              margin: 0;
              background: white;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div id="print-container">
            ${originalContent.outerHTML}
          </div>
          <script>
            // Auto-trigger print when loaded
            window.onload = () => {
              setTimeout(() => {
                const originalTitle = window.parent.document.title;
                window.parent.document.title = "${filename}";
                window.print();
                setTimeout(() => {
                  window.parent.document.title = originalTitle;
                  window.parent.document.body.removeChild(window.frameElement);
                }, 1000);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    iframeDoc.close();
    
    hideLoadingIndicator(loadingToast);
    showSuccessToast('Print dialog opened! Use "Save as PDF" to download.');
    
  } catch (error) {
    console.error('Error in downloadPDF:', error);
    showErrorToast(`Failed to generate PDF: ${error.message}`);
    throw error;
  }
}

/**
 * Triggers print dialog
 */
export function triggerPrint(elementId = 'printable-proforma-invoice', filename = 'Proforma Invoice') {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
    }
    
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    let stylesHTML = '';
    styles.forEach(style => {
      if (style.tagName === 'STYLE') {
        stylesHTML += `<style>${style.innerHTML}</style>`;
      } else if (style.href) {
        stylesHTML += `<link href="${style.href}" rel="stylesheet">`;
      }
    });
    
    const content = element.cloneNode(true);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <meta charset="utf-8">
          ${stylesHTML}
          <style>
            @media print {
              @page {
                size: 210mm 297mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                width: 210mm !important;
              }
              #print-content {
                width: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              #print-content > div {
                width: 210mm !important;
                min-height: 297mm !important;
              }
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Calibri, "Segoe UI", Roboto, Arial, sans-serif;
            }
            #print-content {
              width: 100%;
              margin: 0 auto;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div id="print-content">
            ${content.outerHTML}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                setTimeout(() => {
                  window.close();
                }, 1000);
              }, 500);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
    
  } catch (error) {
    console.error('Error in triggerPrint:', error);
    showErrorToast(`Failed to print: ${error.message}`);
    throw error;
  }
}

// Utility functions
function showLoadingIndicator() {
  const toast = document.createElement('div');
  toast.id = 'pdf-loading-toast';
  toast.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1e293b;
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 10px;
    ">
      <div style="
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      "></div>
      <span>Preparing PDF...</span>
    </div>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;
  document.body.appendChild(toast);
  return toast;
}

function hideLoadingIndicator(toast) {
  if (toast && toast.parentNode) {
    setTimeout(() => {
      toast.remove();
    }, 500);
  }
}

function showErrorToast(message) {
  const toast = document.createElement('div');
  toast.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #dc2626;
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 350px;
    ">
      ❌ ${message}
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 5000);
}

function showSuccessToast(message) {
  const toast = document.createElement('div');
  toast.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    ">
      ✓ ${message}
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 3000);
}

// Default export for compatibility
export default {
  downloadPDF,
  triggerPrint
};