import { google } from "googleapis";

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets"]
);

const sheets = google.sheets({
  version: "v4",
  auth,
});

export const addInvoiceToSheet = async (invoice) => {
  const row = [
    invoice.invoiceNumber,
    invoice.customer?.customerName || "",
    invoice.customer?.address || "",
    invoice.customer?.gstin || "",
    invoice.customer?.pan || "",
    invoice.subtotal || 0,
    invoice.cgst || 0,
    invoice.sgst || 0,
    invoice.grandTotal || 0,
    invoice.invoiceDate || "",
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A:J",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row],
    },
  });
};