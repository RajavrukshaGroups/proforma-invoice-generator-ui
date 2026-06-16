import { createSlice } from '@reduxjs/toolkit';

const getFinancialYear = (dateStr) => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  return `${year - 1}-${String(year).slice(-2)}`;
};

const getCounterKey = (dateStr) => {
  return `invoice_counter_${getFinancialYear(dateStr)}`;
};

const initialState = {
  invoices: [],
  draft: null,
  counters: {} // Maps counter key to count e.g., { 'invoice_counter_2023-24': 47 }
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
    incrementCounter: (state, action) => {
      const dateStr = action.payload;
      const key = getCounterKey(dateStr);
      // Fallback logic to start at 47 if undefined to match previous logic
      if (state.counters[key] === undefined) {
        state.counters[key] = 47;
      }
      state.counters[key] += 1;
    }
  }
});

export const { addOrUpdateInvoice, deleteInvoice, saveDraft, clearDraft, incrementCounter } = invoiceSlice.actions;

export const selectInvoices = (state) => state.invoice.invoices;
export const selectDraft = (state) => state.invoice.draft;
export const selectNextInvoiceNumber = (state, dateStr) => {
  const key = getCounterKey(dateStr);
  const currentCount = state.invoice.counters[key] !== undefined ? state.invoice.counters[key] : 47;
  const nextCount = currentCount + 1;
  const fy = getFinancialYear(dateStr);
  return `DES/PI/${String(nextCount).padStart(4, '0')}/${fy}`;
};

export default invoiceSlice.reducer;
