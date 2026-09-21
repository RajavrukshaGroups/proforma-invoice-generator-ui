import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSettings } from '../context/SettingsContext';
import { 
  Save, 
  Upload, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  FileText
} from 'lucide-react';
import API from '../api/axios';
import { 
  DEFAULT_TERMS, 
  updateCompanySettings, 
  updateTerms, 
  resetTerms 
} from '../store/slices/settingsSlice';
import { getStoredTerms, saveStoredTerms, TERMS_UPDATED_AT_KEY } from '../utils/localStorage';

export default function Settings() {
  const dispatch = useDispatch();
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
    website: '',
    terms: getStoredTerms()
  });

  const [notif, setNotif] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  // Terms-specific management states
  const [newTerm, setNewTerm] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [termsSaveStatus, setTermsSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'

  // Initialize local form once when contextSettings loads
  const isContextInitializedRef = React.useRef(false);
  useEffect(() => {
    if (contextSettings && !isContextInitializedRef.current) {
      isContextInitializedRef.current = true;
      setSettings(prev => ({
        ...prev,
        ...contextSettings,
        terms: (Array.isArray(contextSettings.terms) && contextSettings.terms.length > 0)
          ? contextSettings.terms
          : getStoredTerms()
      }));
      if (contextSettings.companyLogo) {
        setLogoPreview(contextSettings.companyLogo);
      }
    }
  }, [contextSettings]);

  // Central terms persistence handler - saves to State, localStorage, Redux, Context, and Backend API
  const persistTerms = (updatedTerms) => {
    // 1. Immediately update local React state
    setSettings(prev => ({
      ...prev,
      terms: updatedTerms
    }));

    // 2. Immediately persist to localStorage
    saveStoredTerms(updatedTerms);

    // 3. Immediately sync Redux and Context
    dispatch(updateTerms(updatedTerms));
    dispatch(updateCompanySettings({ terms: updatedTerms }));
    setContextSettings(prev => ({
      ...prev,
      terms: updatedTerms
    }));

    // 4. Immediately persist to Backend Database so hard refresh preserves them
    setTermsSaveStatus('saving');
    API.post('/saveSettings', {
      companyName: settings.companyName,
      companyLogo: settings.companyLogo,
      gstin: settings.gstin,
      pan: settings.pan,
      address: settings.address,
      bankName: settings.bankName,
      accountNumber: settings.accountNumber,
      ifscCode: settings.ifscCode,
      branch: settings.branch,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      terms: updatedTerms
    })
      .then(() => {
        setTermsSaveStatus('saved');
        setTimeout(() => setTermsSaveStatus('idle'), 2500);
      })
      .catch((err) => {
        console.warn('Backend sync failed, stored locally in storage & Redux', err);
        setTermsSaveStatus('saved');
        setTimeout(() => setTermsSaveStatus('idle'), 2500);
      });
  };

  // Fetch settings from backend on mount
  useEffect(() => {
    API.get('/getSettings')
      .then((res) => {
        const payload = res.data;
        const list = Array.isArray(payload?.data)
          ? payload.data
          : (Array.isArray(payload) ? payload : []);

        if (list.length > 0) {
          const latest = list[0];
          const currentStored = getStoredTerms();
          const safeTerms = Array.isArray(latest.terms) && latest.terms.length > 0
            ? latest.terms
            : currentStored;

          saveStoredTerms(safeTerms);
          dispatch(updateTerms(safeTerms));

          const safeLatest = {
            ...latest,
            terms: safeTerms
          };
          setContextSettings(safeLatest);
          setSettings((prev) => ({ ...prev, ...safeLatest }));
          if (safeLatest.companyLogo) {
            setLogoPreview(safeLatest.companyLogo);
          }
        }
      })
      .catch(() => {
        // Silently ignore errors; fallback to local storage
      });
  }, [dispatch, setContextSettings]);

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

  // Terms and conditions handlers - permanently persist on any action to State, LocalStorage, Redux, Context & Backend API
  const handleAddTerm = (e) => {
    if (e) e.preventDefault();
    const trimmed = newTerm.trim();
    if (!trimmed) return;

    const updated = [...(settings.terms || []), trimmed];
    setNewTerm('');
    persistTerms(updated);
  };

  const handleDeleteTerm = (index) => {
    if ((settings.terms || []).length <= 1) {
      setNotif({ type: 'error', message: 'At least one Terms & Conditions clause is mandatory.' });
      setTimeout(() => setNotif(null), 3000);
      return;
    }

    const updated = (settings.terms || []).filter((_, i) => i !== index);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingText('');
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
    persistTerms(updated);
  };

  const handleStartEdit = (index, currentText) => {
    setEditingIndex(index);
    setEditingText(currentText);
  };

  const handleSaveEdit = (index) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      handleDeleteTerm(index);
      return;
    }

    const updated = [...(settings.terms || [])];
    updated[index] = trimmed;
    setEditingIndex(null);
    setEditingText('');
    persistTerms(updated);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  const handleMoveTerm = (index, direction) => {
    const termsList = settings.terms || [];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= termsList.length) return;

    const list = [...termsList];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    if (editingIndex === index) {
      setEditingIndex(targetIndex);
    } else if (editingIndex === targetIndex) {
      setEditingIndex(index);
    }
    persistTerms(list);
  };

  const handleResetTermsOnly = () => {
    if (window.confirm('Reset all Terms & Conditions to standard defaults?')) {
      const resetList = [...DEFAULT_TERMS];
      setEditingIndex(null);
      setEditingText('');
      persistTerms(resetList);
      setNotif({ type: 'success', message: 'Terms & Conditions reset to default clauses.' });
      setTimeout(() => setNotif(null), 3000);
    }
  };

  const saveSettings = (e) => {
    e.preventDefault();
    
    // Terms mandatory check
    if (!settings.terms || settings.terms.length === 0) {
      setNotif({ type: 'error', message: 'At least one Terms & Conditions clause is mandatory.' });
      return;
    }

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
      pan: settings.pan.toUpperCase(),
      terms: Array.isArray(settings.terms) && settings.terms.length > 0 ? settings.terms : DEFAULT_TERMS
    };

    setContextSettings(finalizedSettings);
    dispatch(updateTerms(finalizedSettings.terms));
    dispatch(updateCompanySettings(finalizedSettings));
    saveStoredTerms(finalizedSettings.terms);

    // Persist to backend
    API.post('/saveSettings', {
      companyName: finalizedSettings.companyName,
      companyLogo: finalizedSettings.companyLogo,
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
      terms: finalizedSettings.terms
    })
      .then((res) => {
        setNotif({ type: 'success', message: 'Company profile & terms saved successfully!' });
      })
      .catch(() => {
        // Saved locally even if server gives error
        setNotif({ type: 'success', message: 'Settings saved locally!' });
      });
    
    setTimeout(() => {
      setNotif(null);
    }, 4000);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset company details and terms to the standard Digital Elite Service template?')) {
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
        website: 'www.digitaleliteservices.in',
        terms: [...DEFAULT_TERMS]
      };
      setSettings(defaultData);
      setLogoPreview('');
      setEditingIndex(null);
      setEditingText('');
      setContextSettings(defaultData);
      saveStoredTerms(defaultData.terms);
      dispatch(resetTerms());
      dispatch(updateCompanySettings(defaultData));
      API.post('/saveSettings', defaultData).catch(() => {});
      setNotif({ type: 'success', message: 'Reset to default company settings and terms.' });
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

        {/* Standard Terms & Conditions Section */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                  Standard Terms &amp; Conditions <span className="text-rose-500 font-bold">*</span>
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-100 dark:border-indigo-900">
                  {settings.terms?.length || 0} {settings.terms?.length === 1 ? 'clause' : 'clauses'}
                </span>
                {termsSaveStatus === 'saving' && (
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                    Saving...
                  </span>
                )}
                {termsSaveStatus === 'saved' && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium transition-all">
                    <Check className="w-3.5 h-3.5" />
                    Stored
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                These terms are mandatory and maintained in Redux &amp; storage so every newly created invoice automatically inherits them.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetTermsOnly}
              className="self-start sm:self-auto text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1.5 hover:underline hover:cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Standard Clauses
            </button>
          </div>

          {/* List of Terms */}
          <div className="space-y-2.5 mb-4">
            {(!settings.terms || settings.terms.length === 0) ? (
              <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950">
                <p className="text-xs text-gray-500 dark:text-gray-400">At least one clause is mandatory. Add a clause below.</p>
              </div>
            ) : (
              settings.terms.map((term, index) => {
                const isEditing = editingIndex === index;
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                      isEditing
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 shadow-xs'
                        : 'bg-gray-50 dark:bg-gray-950/60 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    {/* Index Badge */}
                    <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[11px] font-bold text-gray-600 dark:text-gray-400 shrink-0 mt-0.5 shadow-2xs">
                      {index + 1}
                    </div>

                    {/* Content / Edit input */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEdit(index);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            autoFocus
                            rows={2}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-indigo-400 dark:border-indigo-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                            placeholder="Edit clause text..."
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(index)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors hover:cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors hover:cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">
                              Press Enter to save, Esc to cancel
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed break-words py-0.5">
                          {term}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons (Only when not editing) */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        {/* Reorder Buttons */}
                        <div className="flex flex-col gap-0.5 mr-1">
                          <button
                            type="button"
                            onClick={() => handleMoveTerm(index, -1)}
                            disabled={index === 0}
                            title="Move Up"
                            className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-20 disabled:pointer-events-none hover:cursor-pointer transition-colors"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveTerm(index, 1)}
                            disabled={index === (settings.terms?.length || 0) - 1}
                            title="Move Down"
                            className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-20 disabled:pointer-events-none hover:cursor-pointer transition-colors"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(index, term)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:cursor-pointer transition-colors"
                          title="Edit Clause"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteTerm(index)}
                          disabled={(settings.terms?.length || 0) <= 1}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-25 disabled:pointer-events-none hover:cursor-pointer transition-colors"
                          title={(settings.terms?.length || 0) <= 1 ? "At least one clause is mandatory" : "Delete Clause"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Add Clause Row */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTerm(e);
                }
              }}
              placeholder="Type a new clause (e.g. 'Payment must be made via NEFT/RTGS to the given bank account.')..."
              className="flex-1 px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
            />
            <button
              type="button"
              onClick={handleAddTerm}
              disabled={!newTerm.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors hover:cursor-pointer shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Clause
            </button>
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
