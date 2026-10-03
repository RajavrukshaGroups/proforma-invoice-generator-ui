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

export const formatServiceItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) return "";
  return items
    .map((item) => {
      const desc = (item.description || "").trim();
      if (!desc) return null;
      const amt = Number(item.amount);
      if (!isNaN(amt) && amt > 0) {
        return `${desc} (₹${amt.toLocaleString("en-IN")})`;
      }
      return desc;
    })
    .filter(Boolean)
    .join(", ");
};

export const addInvoiceToSheet = async (invoice) => {
  const row = [
    invoice.invoiceNumber,
    invoice.customer?.customerName || "",
    invoice.customer?.address || "",
    invoice.subtotal || 0,
    invoice.cgst || 0,
    invoice.sgst || 0,
    invoice.grandTotal || 0,
    invoice.invoiceDate || "",
    invoice.dueDate || "",
    formatServiceItems(invoice.items),
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