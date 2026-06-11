import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Save, Upload, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import API from '../api/axios';

export default function Settings() {
  const { settings: contextSettings, setSettings: setContextSettings } = useSettings();

  const [settings, setSettings] = useState({
    companyName: '',
    companyLogo: '',
    gstin: '',
    pan: '',
    address: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    phone: '',
    email: '',
    website: ''
  });

  const [notif, setNotif] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    if (contextSettings) {
      setSettings(prev => ({ ...prev, ...contextSettings }));
      if (contextSettings.companyLogo) {
        setLogoPreview(contextSettings.companyLogo);
      }
    }
  }, [contextSettings]);

  // Fetch settings from backend on mount
  useEffect(() => {
    API.get('/getSettings')
      .then((res) => {
        const data = res.data;
        if (data && data.length > 0) {
          const latest = data[0];
          setContextSettings(latest);
          setSettings((prev) => ({ ...prev, ...latest }));
          if (latest.companyLogo) {
            setLogoPreview(latest.companyLogo);
          }
        }
      })
      .catch(() => {
        // Silently ignore errors; fallback to local storage
      });
  }, []);


  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setNotif({ type: 'error', message: 'Logo image must be smaller than 2MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setLogoPreview(base64String);
        setSettings(prev => ({
          ...prev,
          companyLogo: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = (e) => {
    e.preventDefault();
    
    // Quick validations
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (settings.gstin && !gstinRegex.test(settings.gstin.toUpperCase())) {
      setNotif({ type: 'error', message: 'Invalid Indian GSTIN Format' });
      return;
    }

    if (settings.pan && !panRegex.test(settings.pan.toUpperCase())) {
      setNotif({ type: 'error', message: 'Invalid Indian PAN Format' });
      return;
    }

    // Convert keys to uppercase where applicable
    const finalizedSettings = {
      ...settings,
      gstin: settings.gstin.toUpperCase(),
      pan: settings.pan.toUpperCase()
    };

    setContextSettings(finalizedSettings);
    // Persist to backend (only the selected fields)
    API.post('/saveSettings', {
      gstin: finalizedSettings.gstin,
      pan: finalizedSettings.pan,
      address: finalizedSettings.address,
      bankName: finalizedSettings.bankName,
      accountNumber: finalizedSettings.accountNumber,
      ifscCode: finalizedSettings.ifscCode,
      branch: finalizedSettings.branch,
      phone: finalizedSettings.phone,
      email: finalizedSettings.email,
      website: finalizedSettings.website,
    })
      .then((res) => {
        const data = res.data;
        setNotif({ type: 'success', message: 'Company settings saved successfully!' });
      })
      .catch(() => {
        setNotif({ type: 'error', message: 'Error saving settings to server' });
      });
    
    setTimeout(() => {
      setNotif(null);
    }, 4000);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset company details to the standard Digital Elite Service template?')) {
      const defaultData = {
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
      setSettings(defaultData);
      setLogoPreview('');
      setContextSettings(defaultData);
      setNotif({ type: 'success', message: 'Reset to default company settings.' });
      setTimeout(() => setNotif(null), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Company Profile &amp; Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure your core business variables. Registered information is pre-filled automatically on every newly generated proforma invoice.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors hover:cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Default
        </button>
      </div>

      {notif && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          notif.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'
        }`}>
          {notif.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{notif.message}</span>
        </div>
      )}

      <form onSubmit={saveSettings} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Core Profile Area */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="md:col-span-1 flex flex-col items-center">
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2 self-start md:self-center">Company Logo</label>
            <div className="relative group w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors hover:border-indigo-500">
              {logoPreview ? (
                <>
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs text-white font-medium">Replace Image</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-center p-3">
                  <Upload className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-[11px] font-medium text-gray-400">Max size 2MB</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            {logoPreview && (
              <button
                type="button"
                onClick={() => {
                  setLogoPreview('');
                  setSettings(prev => ({ ...prev, companyLogo: '' }));
                }}
                className="mt-2 text-xs text-rose-500 hover:underline hover:cursor-pointer"
              >
                Remove Logo
              </button>
            )}
          </div>

          <div className="md:col-span-3 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Company Registered Name *</label>
              <input
                type="text"
                name="companyName"
                value={settings.companyName}
                onChange={handleTextChange}
                required
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="e.g. Digital Elite Service"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Business Slogan / Tagline</label>
              <textarea
                name="address"
                value={settings.address}
                onChange={handleTextChange}
                required
                rows={3}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Full address of the registered business office"
              />
            </div>
          </div>
        </div> */}

        {/* Regulatory Block */}
        <div>
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Regulatory Identifiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Company GSTIN</label>
              <input
                type="text"
                name="gstin"
                value={settings.gstin}
                onChange={handleTextChange}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase"
                placeholder="e.g. 29AAZFD0061B1ZH (15 characters)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Company PAN</label>
              <input
                type="text"
                name="pan"
                value={settings.pan}
                onChange={handleTextChange}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase"
                placeholder="e.g. AAZFD0061B (10 characters)"
              />
            </div>
          </div>
        </div>

        {/* Financial Details (Bank Details Section) */}
        <div>
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Permanent Bank Remittance Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={settings.bankName}
                onChange={handleTextChange}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="e.g. HDFC Bank"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={settings.accountNumber}
                onChange={handleTextChange}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="e.g. 99999945221100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={settings.ifscCode}
                onChange={handleTextChange}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase"
                placeholder="e.g. HDFC0001036"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Branch Name</label>
              <input
                type="text"
                name="branch"
                value={settings.branch}
                onChange={handleTextChange}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="e.g. SAHAKAR NAGAR"
              />
            </div>
          </div>
        </div>

        {/* Contacts Section */}
        <div>
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Official Communication Channels</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Office Telephone / Phone</label>
              <input
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleTextChange}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="e.g. +91 63669 30178"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Business Email Address</label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleTextChange}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="e.g. info@digitaleliteservices.in"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Professional Website</label>
              <input
                type="text"
                name="website"
                value={settings.website}
                onChange={handleTextChange}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="e.g. www.digitaleliteservices.in"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-colors text-sm hover:cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Profile Settings
          </button>
        </div>
      </form>
    </div>
  );
}
