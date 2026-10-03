import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  Receipt, 
  TrendingUp, 
  Settings, 
  Eye, 
  Download, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight 
} from 'lucide-react';
import API from '../api/axios';

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const loadInvoices = async () => {
      try {
        const res = await API.get("/getAllPI");
        const data = res.data;

        if (data.success && isMounted) {
          setInvoices(data.data || []);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInvoices();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNavigate = (view, selectedId) => {
    if (view === 'dashboard' || view === '/') {
      navigate('/');
    } else if (view === 'create') {
      if (selectedId) navigate(`/create?id=${selectedId}`);
      else navigate('/create');
    } else if (view === 'preview') {
      if (selectedId) navigate(`/preview?id=${selectedId}`);
      else navigate('/preview');
    } else if (view === 'history') {
      navigate('/history-view');
    } else if (view === 'clients') {
      navigate('/clients');
    } else if (view === 'settings') {
      navigate('/settings');
    }
  };

  const parseAmount = (val) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/,/g, '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  // 1. Total Raised Amount
  const totalRaisedAmount = invoices.reduce((sum, inv) => {
    return sum + parseAmount(inv.grandTotal);
  }, 0);

  // 2. Total Payment Received
  const totalPaymentReceived = invoices.reduce((sum, inv) => {
    const total = parseAmount(inv.grandTotal);
    if (Array.isArray(inv.installments) && inv.installments.length > 0) {
      const instSum = inv.installments.reduce((s, inst) => s + parseAmount(inst.amount), 0);
      if (instSum > 0) return sum + instSum;
    }
    if (inv.paidAmount != null && inv.paidAmount !== '') {
      return sum + parseAmount(inv.paidAmount);
    }
    const status = (inv.paymentStatus || '').toLowerCase();
    if (status === 'paid') {
      return sum + total;
    }
    if (status === 'partial') {
      const pct = Math.min(100, Math.max(0, parseFloat(inv.paidPercentage) || 0));
      return sum + (total * pct) / 100;
    }
    if (inv.paidPercentage && parseFloat(inv.paidPercentage) > 0) {
      const pct = Math.min(100, Math.max(0, parseFloat(inv.paidPercentage) || 0));
      return sum + (total * pct) / 100;
    }
    return sum;
  }, 0);

  // 3. Total Pending Payment
  const totalPendingPayment = Math.max(0, totalRaisedAmount - totalPaymentReceived);

  // 4. Total Clients
  const totalClients = Array.from(
    new Set(
      invoices
        .map((inv) => inv.customer?.customerName?.trim().toLowerCase())
        .filter(Boolean)
    )
  ).length;

  // 5. Total Invoices
  const totalInvoices = invoices.length;

  // Percentage calculations
  const receivedPercentage = totalRaisedAmount > 0 
    ? Math.round((totalPaymentReceived / totalRaisedAmount) * 100) 
    : 0;

  const pendingPercentage = totalRaisedAmount > 0 
    ? Math.round((totalPendingPayment / totalRaisedAmount) * 100) 
    : 0;

  // Sorting list by ID (which incorporates timestamp) to show 5 most recent
  const sortedRecent = [...invoices]
    .sort((a, b) => (b._id || '').localeCompare(a._id || ''))
    .slice(0, 5);

  const formatCurrency = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
    }
    return dateStr;
  };

  const handleQuickDownload = async (invoice, e) => {
    e.stopPropagation();
    handleNavigate('preview', invoice._id);
  };

  return (
    <div className="space-y-8 p-4">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-indigo-700 via-indigo-650 to-purple-800 text-white p-6 sm:p-8 rounded-2xl overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-white/5 rounded-full -mb-8 pointer-events-none" />
        
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="bg-indigo-500/30 text-indigo-200 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-400/20">
            Billing Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Proforma Invoice Hub</h1>
          <p className="text-sm text-indigo-100 leading-relaxed">
            Generate, dispatch, and track premium proforma compliance forms. Your company details are snapshotted on creation to guarantee tax timeline history.
          </p>
          <div className="pt-4 flex flex-wrap gap-3">
            <button
              onClick={() => handleNavigate('create')}
              className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-slate-50 rounded-xl text-sm font-bold shadow-md transition-all hover:scale-102 hover:cursor-pointer"
            >
              + Create Proforma
            </button>
            <button
               onClick={() => handleNavigate('settings')}
               className="px-4 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/40 text-white rounded-xl text-xs font-bold transition-colors hover:cursor-pointer"
            >
              Configure Company Profile
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Panels Grid (5 Cards: Raised, Received, Pending, Clients, Invoices) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-5 gap-4 sm:gap-5">
        
        {/* Metric Card 1: Total Raised Amount */}
        <div 
          onClick={() => handleNavigate('history')}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-4.5 xl:p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 flex flex-col group cursor-pointer lg:col-span-2 xl:col-span-1"
        >
          <div className="h-12 flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-snug">
              Total Raised
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 ring-1 ring-indigo-500/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-[1.25rem] lg:text-[1.2rem] xl:text-[1.35rem] font-bold font-sans text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
              {formatCurrency(totalRaisedAmount)}
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs font-medium">
            <span className="text-gray-500 dark:text-gray-400 truncate">Total invoiced</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold inline-flex items-center shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform">
              View <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Metric Card 2: Total Payment Received */}
        <div 
          onClick={() => handleNavigate('history')}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-4.5 xl:p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 flex flex-col group cursor-pointer lg:col-span-2 xl:col-span-1"
        >
          <div className="h-12 flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-snug">
              Payment Received
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 ring-1 ring-emerald-500/20 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-[1.25rem] lg:text-[1.2rem] xl:text-[1.35rem] font-bold font-sans text-emerald-600 dark:text-emerald-400 tracking-tight whitespace-nowrap">
              {formatCurrency(totalPaymentReceived)}
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 truncate">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              {receivedPercentage}% collected
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform">
              View <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Metric Card 3: Total Pending Payment */}
        <div 
          onClick={() => handleNavigate('history')}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-4.5 xl:p-5 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 flex flex-col group cursor-pointer lg:col-span-2 xl:col-span-1"
        >
          <div className="h-12 flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-snug">
              Pending Payment
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 ring-1 ring-amber-500/20 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-[1.25rem] lg:text-[1.2rem] xl:text-[1.35rem] font-bold font-sans text-amber-600 dark:text-amber-400 tracking-tight whitespace-nowrap">
              {formatCurrency(totalPendingPayment)}
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 truncate">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
              {pendingPercentage}% pending
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold inline-flex items-center shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform">
              View <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Metric Card 4: Total Clients */}
        <div 
          onClick={() => handleNavigate('clients')}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-4.5 xl:p-5 shadow-sm hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 transition-all duration-200 flex flex-col group cursor-pointer lg:col-span-3 xl:col-span-1"
        >
          <div className="h-12 flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-snug">
              Total Clients
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 ring-1 ring-sky-500/20 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-[1.25rem] lg:text-[1.2rem] xl:text-[1.35rem] font-bold font-sans text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
              {totalClients}
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs font-medium">
            <span className="text-gray-500 dark:text-gray-400 truncate">Active clients</span>
            <span className="text-sky-600 dark:text-sky-400 font-semibold inline-flex items-center shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform">
              View <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Metric Card 5: Total Invoices */}
        <div 
          onClick={() => handleNavigate('history')}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-4.5 xl:p-5 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 flex flex-col group cursor-pointer lg:col-span-3 xl:col-span-1"
        >
          <div className="h-12 flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-snug">
              Total Invoices
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 ring-1 ring-purple-500/20 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-[1.25rem] lg:text-[1.2rem] xl:text-[1.35rem] font-bold font-sans text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
              {totalInvoices}
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs font-medium">
            <span className="text-gray-500 dark:text-gray-400 truncate">All proformas</span>
            <span className="text-purple-600 dark:text-purple-400 font-semibold inline-flex items-center shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform">
              View <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

      </div>

      {/* Main Content Dashboard layout: Recent List vs Quick Actions panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column (2/3 width) - Recent Invoices */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-md font-bold text-gray-900 dark:text-white">Recently Drafted</h2>
              <p className="text-xs text-gray-700 dark:text-gray-200">View, preview, and download your 5 most recently compiled bills.</p>
            </div>
            <button
              onClick={() => handleNavigate('history')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold hover:underline hover:cursor-pointer"
            >
              See All History →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-3 whitespace-nowrap">Invoice No</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3 whitespace-nowrap">Issued Date</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Sum Total</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Payment Status</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
                {sortedRecent.length > 0 ? (
                  sortedRecent.map((inv) => (
                    <tr 
                      key={inv._id} 
                      onClick={() => handleNavigate('preview', inv._id)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-950/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">{inv.customer?.customerName}</td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDateLabel(inv.invoiceDate)}</td>
                      <td className="py-3 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{formatCurrency(inv.grandTotal)}</td>
                      <td className="py-3 px-3 text-center">
                        {(() => {
                          const status = (inv.paymentStatus || 'Pending').toLowerCase();
                          const grandTotal = parseAmount(inv.grandTotal);
                          const instList = Array.isArray(inv.installments) ? inv.installments : [];
                          const instSum = instList.reduce((s, it) => s + parseAmount(it.amount), 0);
                          const paid = instList.length > 0 
                            ? instSum 
                            : (inv.paidAmount != null && inv.paidAmount !== '' 
                                ? parseAmount(inv.paidAmount) 
                                : (status === 'paid' ? grandTotal : (grandTotal * (parseFloat(inv.paidPercentage) || 0) / 100)));
                          const pending = Math.max(0, grandTotal - paid);

                          return (
                            <div>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                    : status === 'partial'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                }`}
                              >
                                {inv.paymentStatus || 'Pending'}
                              </span>

                              {status === 'partial' && (
                                <div className="mt-1 text-[11px] font-bold space-y-0.5">
                                  <span className="text-emerald-600 dark:text-emerald-400 block">
                                    Rec: {formatCurrency(paid)}
                                  </span>
                                  <span className="text-amber-600 dark:text-amber-400 block">
                                    Bal: {formatCurrency(pending)}
                                  </span>
                                </div>
                              )}

                              {status !== 'pending' && (
                                <div className="mt-1">
                                  {instList.length > 1 ? (
                                    <span className="inline-block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded">
                                      {instList.length} Installments
                                    </span>
                                  ) : (
                                    (inv.paymentMode || instList[0]?.paymentMode) && (
                                      <div>
                                        <span className="inline-block text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                          {inv.paymentMode || instList[0]?.paymentMode}
                                        </span>
                                        {(inv.transactionId || instList[0]?.transactionId) && (
                                          <span className="block font-mono text-[9.5px] text-gray-400 truncate max-w-[120px] mx-auto" title={inv.transactionId || instList[0]?.transactionId}>
                                            {inv.transactionId || instList[0]?.transactionId}
                                          </span>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleNavigate('preview', inv._id)}
                            className="p-1.5 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Open layout preview pane"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleQuickDownload(inv, e)}
                            className="p-1.5 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Interactive PDF render"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 font-normal">
                      No invoices found in your system. Start by creating a new proforma.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column (1/3 width) - Fast utilities */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-md font-bold text-gray-900 dark:text-white">Workspace Guides</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Everything is stored securely with data sovereignty.</p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <span className="block text-xs font-bold text-gray-800 dark:text-white">Set Company Details</span>
                  <span className="block text-[11px] text-gray-500 dark:text-gray-400 leading-normal">Customize settings to configure bank numbers, GSTIN identifier, logo, and phone line records.</span>
                </div>
              </div>

              <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <span className="block text-xs font-bold text-gray-800 dark:text-white">Prepare Bill Items</span>
                  <span className="block text-[11px] text-gray-500 dark:text-gray-400 leading-normal">Enter customer records and service lists. Select exclusive/inclusive matching values.</span>
                </div>
              </div>

              <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                <div>
                  <span className="block text-xs font-bold text-gray-800 dark:text-white">PDF Render Engine</span>
                  <span className="block text-[11px] text-gray-500 dark:text-gray-400 leading-normal">Download crisp A4 vector PDFs matching company specs for print distribution instantly.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-2">
            <button
              onClick={() => handleNavigate('settings')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-gray-200 rounded-xl text-xs font-semibold select-none transition-colors hover:cursor-pointer"
            >
              <Settings className="w-4 h-4 " />
              Manage Billing Presets
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
