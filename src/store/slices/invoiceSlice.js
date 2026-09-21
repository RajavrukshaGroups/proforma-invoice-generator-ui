import { createSlice } from '@reduxjs/toolkit';

export const getFinancialYear = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
  const month = isNaN(d.getMonth()) ? new Date().getMonth() + 1 : d.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  return `${year - 1}-${String(year).slice(-2)}`;
};

export const getCounterKey = (dateStr) => {
  return `invoice_counter_${getFinancialYear(dateStr)}`;
};

const getInitialCounters = () => {
  const counters = {};
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('invoice_counter_')) {
          const val = parseInt(localStorage.getItem(k), 10);
          if (!isNaN(val)) {
            counters[k] = val;
          }
        }
      }
    } catch (e) {}
  }
  return counters;
};

const initialState = {
  invoices: [],
  draft: null,
  counters: getInitialCounters()
};

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    addOrUpdateInvoice: (state, action) => {
      const index = state.invoices.findIndex(inv => inv.id === action.payload.id);
      if (index !== -1) {
        state.invoices[index] = action.payload;
      } else {
        state.invoices.push(action.payload);
      }
    },
    deleteInvoice: (state, action) => {
      state.invoices = state.invoices.filter(inv => inv.id !== action.payload);
    },
    saveDraft: (state, action) => {
      state.draft = action.payload;
    },
    clearDraft: (state) => {
      state.draft = null;
    },
    setCounter: (state, action) => {
      const { key, count } = action.payload;
      state.counters[key] = count;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(key, count.toString());
        } catch (e) {}
      }
    },
    recordInvoiceCreated: (state, action) => {
      const { invoiceNumber, invoiceDate } = action.payload;
      const key = getCounterKey(invoiceDate);
      let count = state.counters[key] !== undefined 
        ? state.counters[key] 
        : (typeof window !== 'undefined' ? parseInt(localStorage.getItem(key) || '47', 10) : 47);

      if (invoiceNumber) {
        const m = invoiceNumber.match(/DES\/PI\/(\d+)/i) || invoiceNumber.match(/\/(\d+)(?:\/|$)/);
        if (m) {
          const parsedNum = parseInt(m[1], 10);
          if (!isNaN(parsedNum)) {
            count = Math.max(count, parsedNum);
          }
        } else {
          count += 1;
        }
      } else {
        count += 1;
      }

      state.counters[key] = count;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(key, count.toString());
        } catch (e) {}
      }
    },
    syncMaxCounter: (state, action) => {
      const { key, maxCount } = action.payload;
      const current = state.counters[key] !== undefined
        ? state.counters[key]
        : (typeof window !== 'undefined' ? parseInt(localStorage.getItem(key) || '0', 10) : 0);
      const updated = Math.max(current, maxCount);
      state.counters[key] = updated;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(key, updated.toString());
        } catch (e) {}
      }
    },
    incrementCounter: (state, action) => {
      const dateStr = action.payload;
      const key = getCounterKey(dateStr);
      if (state.counters[key] === undefined) {
        state.counters[key] = typeof window !== 'undefined' ? parseInt(localStorage.getItem(key) || '47', 10) : 47;
      }
      state.counters[key] += 1;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(key, state.counters[key].toString());
        } catch (e) {}
      }
    }
  }
});

export const { 
  addOrUpdateInvoice, 
  deleteInvoice, 
  saveDraft, 
  clearDraft, 
  incrementCounter,
  setCounter,
  recordInvoiceCreated,
  syncMaxCounter
} = invoiceSlice.actions;

export const selectInvoices = (state) => state.invoice.invoices;
export const selectDraft = (state) => state.invoice.draft;
export const selectNextInvoiceNumber = (state, dateStr) => {
  const key = getCounterKey(dateStr);
  let currentCount = state.invoice?.counters?.[key];
  if (currentCount === undefined && typeof window !== 'undefined') {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) currentCount = parsed;
    }
  }
  const baseCount = currentCount !== undefined && !isNaN(currentCount) ? currentCount : 47;
  const nextCount = baseCount + 1;
  const fy = getFinancialYear(dateStr);
  return `DES/PI/${String(nextCount).padStart(4, '0')}/${fy}`;
};

export default invoiceSlice.reducer;
