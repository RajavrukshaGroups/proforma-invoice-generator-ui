import React, { createContext, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const SettingsContext = createContext();

const defaultSettings = {
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

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useLocalStorage('pi_settings', defaultSettings);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
