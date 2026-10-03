import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, FileText, 
  Receipt, Plus, Check, Clock, AlertCircle, X, ChevronDown, 
  ChevronUp, CheckCircle2, Copy, Download
} from 'lucide-react';
import API from '../api/axios';

const ITEMS_PER_PAGE = 8;

const getTodayStr = () => new Date().toISOString().split('T')[0];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const formatCurrency = (val) => {
  return '₹' + Number(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const getPaymentModeBadge = (mode) => {
  const m = (mode || '').toUpperCase();
  if (m === 'UPI') {
    return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
  }
  if (m === 'NEFT') {
    return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
  }
  if (m === 'IMPS') {
    return 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800';
  }
  if (m === 'RTGS') {
    return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
  }
  if (m === 'CHEQUE') {
    return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
  }
  if (m === 'CASH') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
};

const getInvoicePaymentDetails = (inv) => {
  if (!inv) {
    return { grandTotal: 0, paidAmount: 0, pendingBalance: 0, installments: [] };
  }
  const grandTotal = Number(inv.grandTotal) || 0;
  
  let installments = [];
  if (Array.isArray(inv.installments) && inv.installments.length > 0) {
    installments = inv.installments;
  } else if (
    (inv.paidAmount != null && Number(inv.paidAmount) > 0) || 
    inv.paymentMode || 
    inv.transactionId || 
    (inv.paymentStatus === 'Paid' && grandTotal > 0) ||
    (inv.paidPercentage != null && Number(inv.paidPercentage) > 0)
  ) {
    const legacyPaid = inv.paidAmount != null && inv.paidAmount !== ''
      ? Number(inv.paidAmount) 
      : (inv.paymentStatus === 'Paid' ? grandTotal : ((grandTotal * (Number(inv.paidPercentage) || 0)) / 100));
    
    if (legacyPaid > 0 || inv.paymentMode || inv.transactionId) {
      installments = [{
        installmentNumber: 1,
        amount: Math.round(legacyPaid * 100) / 100,
        paymentMode: inv.paymentMode || 'Cash',
        transactionId: inv.transactionId || '',
        date: inv.invoiceDate || ''
      }];
    }
  }

  const installmentsTotal = installments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const paidAmount = installments.length > 0 
    ? installmentsTotal 
    : (inv.paidAmount != null && inv.paidAmount !== '' 
        ? Number(inv.paidAmount) 
        : (inv.paymentStatus === 'Paid' 
            ? grandTotal 
            : ((grandTotal * (Number(inv.paidPercentage) || 0)) / 100)));

  const pendingBalance = Math.max(0, grandTotal - paidAmount);
  
  return {
    grandTotal,
    paidAmount,
    pendingBalance,
    installments
  };
};

export default function HistoryView() {
  const [invoices, setInvoices] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const clientFilter = location.state?.client || null;

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmId, setShowConfirmId] = useState(null);

  // Installment Ledger Modal state
  const [selectedLedgerInvoice, setSelectedLedgerInvoice] = useState(null);
  const [expandedInstallments, setExpandedInstallments] = useState({});
  const [copiedTxn, setCopiedTxn] = useState(null);

  // New Installment form state inside modal
  const [newInstAmount, setNewInstAmount] = useState('');
  const [newInstMode, setNewInstMode] = useState('UPI');
  const [newInstTxnId, setNewInstTxnId] = useState('');
  const [newInstDate, setNewInstDate] = useState(getTodayStr());
  const [isSubmittingInstallment, setIsSubmittingInstallment] = useState(false);
  const [modalFeedback, setModalFeedback] = useState({ type: '', message: '' });

  const loadInvoices = async () => {
    try {
      const res = await API.get("/getAllPI");
      const data = res.data;

      if (data.success) {
        setInvoices(data.data);
      }
    } catch (error) {
      console.error("Error loading invoices:", error);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleNavigate = (view, selectedId) => {
    if (view === 'create') {
      if (selectedId) navigate(`/create?id=${selectedId}`);
      else navigate('/create');
    } else if (view === 'preview') {
      if (selectedId) navigate(`/preview?id=${selectedId}`);
      else navigate('/preview');
    } else if (view === 'settings') {
      navigate('/settings');
    } else {
      navigate('/history-view');
    }
  };

  const handleEdit = (id) => {
    navigate(`/create?id=${id}`);
  };

  // Search logic: checks both Invoice Number and Customer Name
  const filteredInvoices = useMemo(() => {
    const rawSearch = searchTerm.toLowerCase().trim();
    return invoices.filter(inv => {
      const matchesSearch = rawSearch ? (
        inv.invoiceNumber?.toLowerCase().includes(rawSearch) ||
        inv.customer?.customerName?.toLowerCase().includes(rawSearch) ||
        inv.customer?.city?.toLowerCase().includes(rawSearch) ||
        inv.customer?.state?.toLowerCase().includes(rawSearch)
      ) : true;
      const matchesClient = clientFilter ? inv.customer?.customerName === clientFilter.customerName : true;
      return matchesSearch && matchesClient;
    });
  }, [invoices, searchTerm, clientFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = useMemo(() => {
    // Return sorted descending (by creation date/ID)
    const sorted = [...filteredInvoices].sort((a, b) => (b._id || '').localeCompare(a._id || ''));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const handleDelete = async (id) => {
    try {
      const res = await API.delete(`/deletePI/${id}`);
      const data = res.data;

      if (data.success) {
        setShowConfirmId(null);
        loadInvoices(); // refresh list
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const toggleExpandInstallments = (invoiceId) => {
    setExpandedInstallments(prev => ({
      ...prev,
      [invoiceId]: !prev[invoiceId]
    }));
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTxn(text);
    setTimeout(() => setCopiedTxn(null), 2000);
  };

  const openLedgerModal = (inv) => {
    const details = getInvoicePaymentDetails(inv);
    setSelectedLedgerInvoice(inv);
    setNewInstAmount(details.pendingBalance > 0 ? String(details.pendingBalance) : '');
    setNewInstMode('UPI');
    setNewInstTxnId('');
    setNewInstDate(getTodayStr());
    setModalFeedback({ type: '', message: '' });
  };

  const closeLedgerModal = () => {
    setSelectedLedgerInvoice(null);
    setModalFeedback({ type: '', message: '' });
  };

  const handleAddInstallment = async (e) => {
    e.preventDefault();
    if (!selectedLedgerInvoice) return;

    const amount = Number(newInstAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      setModalFeedback({ type: 'error', message: 'Please enter a valid installment amount greater than 0.' });
      return;
    }

    if (newInstMode !== 'Cash' && !newInstTxnId.trim()) {
      setModalFeedback({ type: 'error', message: `Please enter the ${newInstMode} Transaction ID / Reference.` });
      return;
    }

    setIsSubmittingInstallment(true);
    setModalFeedback({ type: '', message: '' });

    try {
      const inv = selectedLedgerInvoice;
      const details = getInvoicePaymentDetails(inv);
      const currentInst = details.installments;

      const newInstItem = {
        installmentNumber: currentInst.length + 1,
        amount: amount,
        paymentMode: newInstMode,
        transactionId: newInstMode === 'Cash' ? '' : newInstTxnId.trim(),
        date: newInstDate || getTodayStr()
      };

      const updatedInstallments = [...currentInst, newInstItem];
      const grandTotal = Number(inv.grandTotal) || 0;
      const totalPaid = updatedInstallments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const pendingBal = Math.max(0, grandTotal - totalPaid);
      const newStatus = pendingBal <= 0 ? 'Paid' : 'Partial';
      const newPaidPct = grandTotal > 0 ? Math.min(100, Math.round((totalPaid / grandTotal) * 100 * 100) / 100) : 0;

      const payload = {
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customer,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        gstMode: inv.gstMode,
        paymentStatus: newStatus,
        paidPercentage: newPaidPct,
        paidAmount: totalPaid,
        paymentMode: updatedInstallments[0]?.paymentMode || newInstMode,
        transactionId: updatedInstallments[0]?.transactionId || (newInstMode === 'Cash' ? '' : newInstTxnId.trim()),
        installments: updatedInstallments,
        items: inv.items,
        subtotal: inv.subtotal,
        cgst: inv.cgst,
        sgst: inv.sgst,
        grandTotal: inv.grandTotal,
        amountInWords: inv.amountInWords,
        terms: inv.terms,
        company: inv.company
      };

      const res = await API.put(`/updatePI/${inv._id}`, payload);
      if (res.data.success) {
        const savedInvoice = res.data.data || { ...inv, ...payload };
        setSelectedLedgerInvoice(savedInvoice);
        loadInvoices();
        setModalFeedback({ 
          type: 'success', 
          message: `Installment #${newInstItem.installmentNumber} of ${formatCurrency(amount)} recorded successfully!` 
        });
        const nextPending = Math.max(0, grandTotal - totalPaid);
        setNewInstAmount(nextPending > 0 ? String(nextPending) : '');
        setNewInstTxnId('');
      } else {
        setModalFeedback({ type: 'error', message: res.data.message || 'Failed to save installment.' });
      }
    } catch (err) {
      console.error("Installment save error:", err);
      setModalFeedback({ type: 'error', message: err.response?.data?.message || 'Server error while saving installment.' });
    } finally {
      setIsSubmittingInstallment(false);
    }
  };

  const handleDeleteInstallment = async (instIndex) => {
    if (!selectedLedgerInvoice) return;
    if (!window.confirm(`Are you sure you want to delete Installment #${instIndex + 1}?`)) return;

    try {
      const inv = selectedLedgerInvoice;
      const details = getInvoicePaymentDetails(inv);
      const filtered = details.installments
        .filter((_, idx) => idx !== instIndex)
        .map((item, idx) => ({ ...item, installmentNumber: idx + 1 }));

      const grandTotal = Number(inv.grandTotal) || 0;
      const totalPaid = filtered.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const pendingBal = Math.max(0, grandTotal - totalPaid);
      const newStatus = totalPaid <= 0 ? 'Pending' : (pendingBal <= 0 ? 'Paid' : 'Partial');
      const newPaidPct = grandTotal > 0 ? Math.min(100, Math.round((totalPaid / grandTotal) * 100 * 100) / 100) : 0;

      const payload = {
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customer,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        gstMode: inv.gstMode,
        paymentStatus: newStatus,
        paidPercentage: newPaidPct,
        paidAmount: totalPaid,
        paymentMode: newStatus === 'Pending' ? '' : (filtered[0]?.paymentMode || ''),
        transactionId: newStatus === 'Pending' ? '' : (filtered[0]?.transactionId || ''),
        installments: filtered,
        items: inv.items,
        subtotal: inv.subtotal,
        cgst: inv.cgst,
        sgst: inv.sgst,
        grandTotal: inv.grandTotal,
        amountInWords: inv.amountInWords,
        terms: inv.terms,
        company: inv.company
      };

      const res = await API.put(`/updatePI/${inv._id}`, payload);
      if (res.data.success) {
        const savedInvoice = res.data.data || { ...inv, ...payload };
        setSelectedLedgerInvoice(savedInvoice);
        loadInvoices();
        setModalFeedback({ type: 'success', message: 'Installment deleted successfully.' });
      }
    } catch (err) {
      console.error("Installment delete error:", err);
      setModalFeedback({ type: 'error', message: 'Failed to delete installment.' });
    }
  };

  return (
    <div className="space-y-6 p-10">
      
      {/* Search Bar + Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Invoice History Ledger
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Search, edit, preview, and track complete client payment installment histories with transaction IDs and modes.
          </p>
        </div>

        {/* Create Invoice Shortcut */}
        <button
          onClick={() => navigate('/create', { state: { clientData: clientFilter } })}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all hover:scale-102 flex items-center gap-2 self-start md:self-auto hover:cursor-pointer"
        >
          <span>+ Create New Invoice</span>
        </button>
      </div>

      {/* Modern Search/Filter Input Frame */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // reset to page 1 on search
            }}
            placeholder="Search by client name, invoice number, city or state..."
            className="w-full pl-10 pr-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        
        {/* Helper info text */}
        <div className="text-xs text-gray-400 self-center hidden sm:block">
          Showing <span className="font-bold text-gray-700 dark:text-gray-300">{filteredInvoices.length}</span> results
        </div>
      </div>

      {/* Table grid display */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-150 dark:border-gray-800 text-gray-800 dark:text-gray-100 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 whitespace-nowrap min-w-[170px]">Proforma Number</th>
                <th className="py-3 px-4 min-w-[170px]">Client Name</th>
                <th className="py-3 px-4 whitespace-nowrap min-w-[130px]">Billing Date</th>
                <th className="py-3 px-4 text-right whitespace-nowrap min-w-[110px]">Invoice Sum</th>
                <th className="py-3 px-4 text-center min-w-[220px] whitespace-nowrap">Payment Status & History</th>
                <th className="py-3 px-4 text-center whitespace-nowrap min-w-[140px]">Action Checklist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv) => {
                  const paymentDetails = getInvoicePaymentDetails(inv);
                  const status = inv.paymentStatus || 'Pending';
                  const isExpanded = !!expandedInstallments[inv._id];
                  const displayedInstallments = isExpanded ? paymentDetails.installments : paymentDetails.installments.slice(0, 2);

                  return (
                    <tr 
                      key={inv._id} 
                      onClick={() => handleNavigate('preview', inv._id)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-950/30 cursor-pointer transition-colors group"
                    >
                      {/* Col: Invoice Number */}
                      <td className="py-4 px-4 align-top whitespace-nowrap min-w-[170px]">
                        <span className="font-mono text-gray-900 dark:text-white font-extrabold tracking-wide block whitespace-nowrap">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-[10px] text-gray-400 lowercase tracking-wider mt-0.5 block whitespace-nowrap">
                          mode: {inv.gstMode === 'exclusive' ? 'base + gst' : 'inclusive'}
                        </span>
                      </td>

                      {/* Col: Client details */}
                      <td className="py-4 px-4 align-top">
                        <span className="font-bold text-gray-900 dark:text-white block group-hover:text-indigo-600 transition-colors">
                          {inv.customer?.customerName || 'N/A'}
                        </span>
                        <span className="text-[10px] text-gray-400 block italic mt-0.5 truncate max-w-[200px]">
                          {inv.customer?.city ? `${inv.customer.city}, ` : ''}{inv.customer?.state || ''}
                        </span>
                      </td>

                      {/* Col: Invoice and Due Dates */}
                      <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-400 align-top whitespace-nowrap min-w-[130px]">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-bold text-[10px] text-gray-400 shrink-0">IS:</span>
                          <span className="font-medium text-xs text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">{formatDate(inv.invoiceDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 whitespace-nowrap">
                          <span className="font-bold text-[10px] text-rose-500 shrink-0">DU:</span>
                          <span className="text-rose-500 font-bold text-xs tabular-nums whitespace-nowrap">{formatDate(inv.dueDate)}</span>
                        </div>
                      </td>

                      {/* Col: Currency Amount */}
                      <td className="py-4 px-4 text-right align-top whitespace-nowrap min-w-[110px]">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm whitespace-nowrap">
                          {formatCurrency(inv.grandTotal)}
                        </span>
                      </td>

                      {/* Col: Payment Status & Installments History */}
                      <td className="py-4 px-4 text-center align-top" onClick={(e) => e.stopPropagation()}>
                        {status === 'Pending' ? (
                          <div className="space-y-1.5 py-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Pending
                            </span>
                            <span className="text-[10px] text-gray-400 block font-medium">Unpaid</span>
                            <button
                              type="button"
                              onClick={() => openLedgerModal(inv)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:underline cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              Record Payment
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 py-1">
                            {/* Status Badge + Rec / Bal summary */}
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                status === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                {status === 'Paid' ? 'Fully Paid' : 'Partial Payment'}
                              </span>

                              <div className="flex items-center justify-center gap-2 text-[11px] font-bold">
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  Rec: {formatCurrency(paymentDetails.paidAmount)}
                                </span>
                                {status === 'Partial' && (
                                  <>
                                    <span className="text-gray-300 dark:text-gray-600">|</span>
                                    <span className="text-amber-600 dark:text-amber-400">
                                      Bal: {formatCurrency(paymentDetails.pendingBalance)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Installment History Cards */}
                            {paymentDetails.installments.length > 0 ? (
                              <div className="space-y-1.5 text-left max-w-[220px] mx-auto">
                                {displayedInstallments.map((inst, idx) => (
                                  <div 
                                    key={idx}
                                    className="bg-slate-50 dark:bg-gray-800/80 p-2 rounded-xl border border-gray-200/90 dark:border-gray-700 text-xs shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Inst #{inst.installmentNumber || (idx + 1)}
                                      </span>
                                      <span className="font-mono font-bold text-gray-900 dark:text-gray-100 text-[11px]">
                                        {formatCurrency(inst.amount)}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getPaymentModeBadge(inst.paymentMode)}`}>
                                        {inst.paymentMode || 'Cash'}
                                      </span>
                                      {inst.date && (
                                        <span className="text-[10px] text-gray-400 font-mono ml-auto">
                                          {formatDate(inst.date)}
                                        </span>
                                      )}
                                    </div>

                                    {inst.paymentMode !== 'Cash' && inst.transactionId && (
                                      <div className="mt-1 pt-1 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-[10px]">
                                        <span className="text-gray-400 font-medium">Txn ID:</span>
                                        <div className="flex items-center gap-1">
                                          <span className="font-mono text-gray-700 dark:text-gray-300 font-semibold truncate max-w-[110px]" title={inst.transactionId}>
                                            {inst.transactionId}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => copyToClipboard(inst.transactionId)}
                                            className="text-gray-400 hover:text-indigo-600 p-0.5 rounded transition-colors cursor-pointer"
                                            title="Copy Transaction ID"
                                          >
                                            {copiedTxn === inst.transactionId ? (
                                              <Check className="w-3 h-3 text-emerald-500" />
                                            ) : (
                                              <Copy className="w-3 h-3" />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}

                                {/* Expand / Collapse toggle if > 2 installments */}
                                {paymentDetails.installments.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandInstallments(inv._id)}
                                    className="w-full text-center text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline py-0.5 flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    {isExpanded ? (
                                      <>Show Less <ChevronUp className="w-3 h-3" /></>
                                    ) : (
                                      <>+ {paymentDetails.installments.length - 2} more installment{paymentDetails.installments.length - 2 > 1 ? 's' : ''} <ChevronDown className="w-3 h-3" /></>
                                    )}
                                  </button>
                                )}

                                {/* Open Ledger Modal Link */}
                                <div className="text-center pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => openLedgerModal(inv)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:underline cursor-pointer"
                                  >
                                    <Receipt className="w-3 h-3" />
                                    View Full Ledger ({paymentDetails.installments.length})
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1 text-center py-1">
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium">
                                  No installment details yet
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openLedgerModal(inv)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  Record Installment
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Col: Interactive quick buttons */}
                      <td className="py-4 px-4 align-top whitespace-nowrap min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleNavigate('preview', inv._id)}
                            className="p-1 px-2 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Open Layout Preview Screen"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => navigate(`/preview?id=${inv._id}&download=true`)}
                            className="p-1 px-2 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Download Proforma PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleEdit(inv._id)}
                            className="p-1 px-2 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit original values"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openLedgerModal(inv)}
                            className="p-1 px-2 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Installment Payment Ledger"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>

                          {/* Inline Delete check */}
                          {showConfirmId === inv._id ? (
                            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900 border-dashed animate-pulse">
                              <span className="text-[9px] text-rose-600 font-bold uppercase shrink-0">Sure?</span>
                              <button
                                onClick={() => handleDelete(inv._id)}
                                className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                              >
                                Yes
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => setShowConfirmId(null)}
                                className="text-[10px] text-gray-500 font-medium hover:underline cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowConfirmId(inv._id)}
                              className="p-1 px-2 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Delete permanently from records"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-normal">
                    {searchTerm ? (
                      <div>
                        <p className="text-sm font-semibold mb-1">No matching invoices found.</p>
                        <p className="text-xs text-gray-400">Refine search criteria or clear the query bar.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold mb-1">No billing data stored.</p>
                        <p className="text-xs text-gray-400">Create your first proforma to populate records here.</p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Elegant Pagination controls footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-500">
              Page <span className="font-bold text-gray-700 dark:text-gray-300">{currentPage}</span> of <span className="font-bold text-gray-700 dark:text-gray-300">{totalPages}</span>
            </span>
            <div className="relative flex items-center gap-2">
              <label htmlFor="page-select" className="sr-only">Select page</label>
              <select
                id="page-select"
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              >
                {[...Array(totalPages)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Page {i + 1}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -mt-2.5 h-5 w-5 text-gray-400 dark:text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Installment History & Payment Ledger Modal */}
      {selectedLedgerInvoice && (() => {
        const details = getInvoicePaymentDetails(selectedLedgerInvoice);
        const status = selectedLedgerInvoice.paymentStatus || 'Pending';
        const percentPaid = details.grandTotal > 0 
          ? Math.min(100, Math.round((details.paidAmount / details.grandTotal) * 100 * 100) / 100) 
          : 0;

        let runningPaid = 0;
        const installmentsWithRunningBal = details.installments.map((inst) => {
          runningPaid += Number(inst.amount) || 0;
          const remainingAfterInst = Math.max(0, details.grandTotal - runningPaid);
          return {
            ...inst,
            runningPaid,
            remainingAfterInst
          };
        });

        return (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={closeLedgerModal}
          >
            <div 
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Payment History & Installments
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : status === 'Partial'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Proforma: <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{selectedLedgerInvoice.invoiceNumber}</span> • Client: <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedLedgerInvoice.customer?.customerName}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeLedgerModal}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Feedback banner */}
                {modalFeedback.message && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    modalFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {modalFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span className="font-medium">{modalFeedback.message}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setModalFeedback({ type: '', message: '' })}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Metric Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      Total Invoiced
                    </span>
                    <span className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400 block mt-1">
                      {formatCurrency(details.grandTotal)}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      IS: {formatDate(selectedLedgerInvoice.invoiceDate)}
                    </span>
                  </div>

                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                      Total Received ({percentPaid}%)
                    </span>
                    <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-1">
                      {formatCurrency(details.paidAmount)}
                    </span>
                    <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5">
                      {details.installments.length} installment{details.installments.length === 1 ? '' : 's'} recorded
                    </span>
                  </div>

                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                      Pending Balance
                    </span>
                    <span className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400 block mt-1">
                      {formatCurrency(details.pendingBalance)}
                    </span>
                    <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block mt-0.5">
                      {details.pendingBalance <= 0 ? 'Fully settled' : `Due: ${formatDate(selectedLedgerInvoice.dueDate)}`}
                    </span>
                  </div>
                </div>

                {/* Payment Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-600 dark:text-gray-400">Payment Collection Progress</span>
                    <span className="font-mono text-gray-900 dark:text-white">{percentPaid}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentPaid >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-indigo-600'
                      }`}
                      style={{ width: `${percentPaid}%` }}
                    ></div>
                  </div>
                </div>

                {/* Installments Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center justify-between">
                    <span>All Installments Paid History ({details.installments.length})</span>
                  </h4>

                  {details.installments.length > 0 ? (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Payment Mode</th>
                            <th className="py-2.5 px-3">Transaction ID / Ref</th>
                            <th className="py-2.5 px-3 text-right">Amount Paid</th>
                            <th className="py-2.5 px-3 text-right">Bal After</th>
                            <th className="py-2.5 px-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {installmentsWithRunningBal.map((inst, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                              <td className="py-3 px-3 font-bold text-gray-700 dark:text-gray-300">
                                Inst #{inst.installmentNumber || (idx + 1)}
                              </td>
                              <td className="py-3 px-3 font-mono text-gray-600 dark:text-gray-400">
                                {formatDate(inst.date) || '-'}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getPaymentModeBadge(inst.paymentMode)}`}>
                                  {inst.paymentMode || 'Cash'}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                {inst.paymentMode === 'Cash' ? (
                                  <span className="text-gray-400 italic text-[11px]">N/A (Cash)</span>
                                ) : inst.transactionId ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-gray-800 dark:text-gray-200 font-bold text-[11px] truncate max-w-[160px]" title={inst.transactionId}>
                                      {inst.transactionId}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(inst.transactionId)}
                                      className="text-gray-400 hover:text-indigo-600 p-0.5 rounded transition-colors cursor-pointer"
                                      title="Copy Transaction ID"
                                    >
                                      {copiedTxn === inst.transactionId ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic text-[11px]">Not provided</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(inst.amount)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                                {formatCurrency(inst.remainingAfterInst)}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteInstallment(idx)}
                                  className="p-1 text-gray-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                                  title="Delete this installment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                      <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No installments recorded yet</p>
                      <p className="text-xs text-gray-400 mt-0.5">Use the form below to record payments made by this client.</p>
                    </div>
                  )}
                </div>

                {/* Quick Add Installment Form */}
                {details.pendingBalance > 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Record Next Installment Payment</span>
                      </h4>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        Remaining: <span className="font-bold text-amber-600 font-mono">{formatCurrency(details.pendingBalance)}</span>
                      </span>
                    </div>

                    <form onSubmit={handleAddInstallment} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Amount Input */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                            Installment Amount (₹) *
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            max={details.pendingBalance}
                            value={newInstAmount}
                            onChange={(e) => setNewInstAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                          />
                        </div>

                        {/* Payment Date */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                            Payment Date *
                          </label>
                          <input
                            type="date"
                            value={newInstDate}
                            onChange={(e) => setNewInstDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                          />
                        </div>

                        {/* Payment Mode */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                            Payment Mode *
                          </label>
                          <select
                            value={newInstMode}
                            onChange={(e) => setNewInstMode(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI (Transaction ID)</option>
                            <option value="NEFT">NEFT (Transaction ID)</option>
                            <option value="Cheque">Cheque (Transaction ID)</option>
                            <option value="IMPS">IMPS (Transaction ID)</option>
                            <option value="RTGS">RTGS (Transaction ID)</option>
                          </select>
                        </div>

                        {/* Transaction ID (conditional based on mode) */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                            {newInstMode === 'Cash' ? 'Transaction ID' : (
                              newInstMode === 'Cheque' ? 'Cheque No. *' : `${newInstMode} Txn ID / Ref *`
                            )}
                          </label>
                          <input
                            type="text"
                            disabled={newInstMode === 'Cash'}
                            value={newInstMode === 'Cash' ? '' : newInstTxnId}
                            onChange={(e) => setNewInstTxnId(e.target.value)}
                            placeholder={
                              newInstMode === 'Cash' ? 'Not required for Cash' :
                              newInstMode === 'UPI' ? 'Enter UPI Reference ID' :
                              newInstMode === 'NEFT' ? 'Enter NEFT UTR' :
                              newInstMode === 'Cheque' ? 'Enter Cheque Number' :
                              newInstMode === 'IMPS' ? 'Enter IMPS Ref ID' :
                              'Enter RTGS UTR'
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={isSubmittingInstallment}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          {isSubmittingInstallment ? (
                            <>Saving Installment...</>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Record Installment
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedLedgerInvoice._id;
                      closeLedgerModal();
                      navigate(`/create?id=${id}`);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Full Edit in Invoice Editor
                  </button>

                  <span className="text-gray-300 dark:text-gray-700">|</span>

                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedLedgerInvoice._id;
                      closeLedgerModal();
                      navigate(`/preview?id=${id}&download=true`);
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Proforma PDF
                  </button>
                </div>

                <button
                  type="button"
                  onClick={closeLedgerModal}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
