export const DEFAULT_TERMS = [
  'Payment must be made within 15 days of the invoice date.',
  'Services will be provided as per the agreed scope.',
  'Any additional work will be charged separately.'
];
// Key for storing invoice history in localStorage
export const INVOICES_KEY = 'proforma_invoice_history';

// Helper to retrieve invoice history array
export const getInvoiceHistory = () => {
  try {
    const data = localStorage.getItem(INVOICES_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse invoice history', e);
  }
  return [];
};

/**
 * Delete an invoice by id
 * @param {string} id - Invoice identifier
 */
export const deleteInvoice = (id) => {
  if (typeof window === 'undefined') return;
  const list = getInvoiceHistory();
  const updated = list.filter(item => item.id !== id);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
};

export const getCompanySettings = () => {
  try {
    const data = localStorage.getItem('pi_settings');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse company settings', e);
  }
  return {
    companyName: 'Digital Elite Service',
    companyLogo: '',
    gstin: '29AAZFD0061B1ZH',
    pan: 'AAZFD0061B',
    address: '35A, Kowdi, 2nd Floor, 1st Main Road, Chiranjeevi Layout, Hebbal Kempapura, Bengaluru, Karnataka 560024',
    bankName: 'HDFC Bank',
    accountNumber: '99999945221100',
    ifscCode: 'HDFC0001036',
    branch: 'SAHAKAR NAGAR',
    phone: '+91 63669 30178',
    email: 'info@digitaleliteservices.in',
    website: 'www.digitaleliteservices.in'
  };
};

export const saveCompanySettings = (settings) => {
  localStorage.setItem('pi_settings', JSON.stringify(settings));
};

export const getInvoices = () => {
  try {
    const data = localStorage.getItem('proforma_invoice_history');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse invoice history', e);
  }
  return [];
};

export const saveInvoice = (invoice) => {
  const invoices = getInvoices();
  const index = invoices.findIndex(inv => inv.id === invoice.id);
  if (index !== -1) {
    invoices[index] = invoice;
  } else {
    invoices.push(invoice);
  }
  localStorage.setItem('proforma_invoice_history', JSON.stringify(invoices));
};

export const getDraft = () => {
  try {
    const data = localStorage.getItem('proforma_invoice_draft');
    if (data) return JSON.parse(data);
  } catch (e) {}
  return null;
};

export const saveDraft = (draft) => {
  localStorage.setItem('proforma_invoice_draft', JSON.stringify(draft));
};

export const clearDraft = () => {
  localStorage.removeItem('proforma_invoice_draft');
};

const getCounterKey = (dateStr) => {
  return `invoice_counter_${getFinancialYear(dateStr)}`;
};

const getFinancialYear = (dateStr) => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }

  return `${year - 1}-${String(year).slice(-2)}`;
};

export const peekNextInvoiceNumber = (dateStr) => {
  const key = getCounterKey(dateStr);
  const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;

  const fy = getFinancialYear(dateStr);

  return `DES/PI/${String(count).padStart(4, '0')}/${fy}`;
};

export const incrementInvoiceCounter = (dateStr) => {
  const key = getCounterKey(dateStr);

  //const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
  const count = parseInt(localStorage.getItem(key) || '47', 10) + 1;
  localStorage.setItem(key, count.toString());

  const fy = getFinancialYear(dateStr);

  return `DES/PI/${String(count).padStart(4, '0')}/${fy}`;
};


// export const peekNextInvoiceNumber = (dateStr) => {
//   const key = getCounterKey(dateStr);
//   const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
//   const d = new Date(dateStr);
//   const year = d.getFullYear().toString().slice(-2);
//   const month = String(d.getMonth() + 1).padStart(2, '0');
//   return `PI-${year}${month}-${String(count).padStart(3, '0')}`;
// };

// export const incrementInvoiceCounter = (dateStr) => {
//   const nextNo = peekNextInvoiceNumber(dateStr);
//   const key = getCounterKey(dateStr);
//   const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
//   localStorage.setItem(key, count.toString());
//   return nextNo;
// };
