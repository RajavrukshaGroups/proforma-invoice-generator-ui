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

export const TERMS_STORAGE_KEY = 'pi_terms';
export const TERMS_UPDATED_AT_KEY = 'pi_terms_updated_at';

export const getStoredTerms = () => {
  if (typeof window === 'undefined') return DEFAULT_TERMS;
  try {
    const rawTerms = localStorage.getItem(TERMS_STORAGE_KEY);
    if (rawTerms) {
      const parsed = JSON.parse(rawTerms);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    const rawSettings = localStorage.getItem('pi_settings');
    if (rawSettings) {
      const parsedSettings = JSON.parse(rawSettings);
      if (Array.isArray(parsedSettings?.terms) && parsedSettings.terms.length > 0) {
        return parsedSettings.terms;
      }
    }
  } catch (e) {
    console.error('Failed to parse stored terms', e);
  }
  return DEFAULT_TERMS;
};

export const saveStoredTerms = (terms) => {
  if (typeof window === 'undefined' || !Array.isArray(terms)) return;
  try {
    localStorage.setItem(TERMS_STORAGE_KEY, JSON.stringify(terms));
    localStorage.setItem(TERMS_UPDATED_AT_KEY, Date.now().toString());
    const rawSettings = localStorage.getItem('pi_settings');
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      parsed.terms = terms;
      localStorage.setItem('pi_settings', JSON.stringify(parsed));
    }
  } catch (e) {
    console.error('Failed to save terms', e);
  }
};

export const getCompanySettings = () => {
  try {
    const data = localStorage.getItem('pi_settings');
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        terms: getStoredTerms()
      };
    }
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
    website: 'www.digitaleliteservices.in',
    terms: getStoredTerms()
  };
};

export const saveCompanySettings = (settings) => {
  localStorage.setItem('pi_settings', JSON.stringify(settings));
  if (Array.isArray(settings?.terms)) {
    saveStoredTerms(settings.terms);
  }
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
  const count = parseInt(localStorage.getItem(key) || '47', 10) + 1;
  const fy = getFinancialYear(dateStr);
  return `DES/PI/${String(count).padStart(4, '0')}/${fy}`;
};

export const incrementInvoiceCounter = (dateStr, createdInvoiceNumber) => {
  const key = getCounterKey(dateStr);
  let count = parseInt(localStorage.getItem(key) || '47', 10);

  if (createdInvoiceNumber) {
    const m = createdInvoiceNumber.match(/DES\/PI\/(\d+)/i) || createdInvoiceNumber.match(/\/(\d+)(?:\/|$)/);
    if (m) {
      const parsedNum = parseInt(m[1], 10);
      if (!isNaN(parsedNum)) {
        count = Math.max(count, parsedNum);
        localStorage.setItem(key, count.toString());
        const fy = getFinancialYear(dateStr);
        return `DES/PI/${String(count).padStart(4, '0')}/${fy}`;
      }
    }
  }

  count += 1;
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
