import { createSlice } from '@reduxjs/toolkit';

export const DEFAULT_TERMS = [
  'Payment must be made within 15 days of the invoice date.',
  'Services will be provided as per the agreed scope.',
  'Any additional work will be charged separately.'
];

const initialState = {
  companySettings: {
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
  }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateCompanySettings: (state, action) => {
      state.companySettings = { ...state.companySettings, ...action.payload };
    }
  }
});

export const { updateCompanySettings } = settingsSlice.actions;

export const selectCompanySettings = (state) => state.settings.companySettings;

export default settingsSlice.reducer;
