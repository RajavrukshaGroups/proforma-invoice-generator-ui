import { configureStore } from '@reduxjs/toolkit';
import invoiceReducer from './slices/invoiceSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    invoice: invoiceReducer,
    settings: settingsReducer
  }
});
