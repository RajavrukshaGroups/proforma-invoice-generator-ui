// import React from 'react';
// import { Plus, Users, Receipt, TrendingUp, Settings, FileSpreadsheet, Eye, Download, Star } from 'lucide-react';
// import { triggerPrint, downloadPDF } from '../utils/pdfGenerator';
// import { useNavigate } from 'react-router-dom';

// /**
//  * Dashboard view displaying analytics, recent invoices, and quick actions.
//  * @param {{ invoices: Array<any>, onNavigate: (page: string, id?: string) => void }} props
//  */
// export default function DashboardView({ invoices = [], onNavigate }) {
//   const navigate = useNavigate();
//   // Calculate analytics
//   const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
//   const totalInvoices = invoices.length;
//   const uniqueCustomers = Array.from(new Set(invoices.map(inv => inv.customer.customerName.trim().toUpperCase()))).length;
//   const averageValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

//   // Most recent 5 invoices (sorted by ID descending)
//   const sortedRecent = [...invoices]
//     .sort((a, b) => b.id.localeCompare(a.id))
//     .slice(0, 5);

//   const formatCurrency = val => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

//   const formatDateLabel = dateStr => {
//     if (!dateStr) return '';
//     const parts = dateStr.split('-');
//     if (parts.length === 3) {
//       return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
//     }
//     return dateStr;
//   };

//   const handleQuickDownload = async (invoice, e) => {
//     e.stopPropagation();
//     // Navigate to preview so the DOM is ready for PDF generation
//     onNavigate('preview', invoice.id);
//   };

//   return (
//     <div className="space-y-8">
//       {/* Welcome Banner */}
//       <div className="relative bg-gradient-to-r from-indigo-700 via-indigo-650 to-purple-800 text-white p-6 sm:p-8 rounded-2xl overflow-hidden shadow-md">
//         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
//         <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-white/5 rounded-full -mb-8 pointer-events-none" />
//         <div className="relative z-10 max-w-xl space-y-2">
//           <span className="bg-indigo-500/30 text-indigo-200 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-400/20">
//             Billing Portal
//           </span>
//           <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Proforma Invoice Hub</h1>
//           <p className="text-sm text-indigo-100 leading-relaxed">
//             Generate, dispatch, and track premium proforma compliance forms. Your company details are snapshotted on creation to guarantee tax timeline history.
//           </p>
//           <div className="pt-4 flex flex-wrap gap-3">
//             <button
//               onClick={() => navigate('/create')}
//               className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-slate-50 rounded-xl text-sm font-bold shadow-md transition-all hover:scale-102 hover:cursor-pointer"
//             >
//               + Create Proforma
//             </button>
//             <button
//               onClick={() => navigate('/settings')}
//               className="px-4 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/40 text-white rounded-xl text-xs font-bold transition-colors hover:cursor-pointer"
//             >
//               Configure Company Profile
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Statistics Panels Grid */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
//         {/* Total Revenue */}
//         <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
//           <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
//             <TrendingUp className="w-6 h-6" />
//           </div>
//           <div>
//             <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">Total Revenue</span>
//             <span className="text-xl font-bold font-mono text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</span>
//           </div>
//         </div>
//         {/* Invoices Drafted */}
//         <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
//           <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-500 dark:text-orange-400 shrink-0">
//             <Receipt className="w-6 h-6" />
//           </div>
//           <div>
//             <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">Invoices Drafted</span>
//             <span className="text-xl font-bold font-mono text-gray-900 dark:text-white">{totalInvoices}</span>
//           </div>
//         </div>
//         {/* Total Clients */}
//         <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
//           <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-sky-500 dark:text-sky-400 shrink-0">
//             <Users className="w-6 h-6" />
//           </div>
//           <div>
//             <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">Total Clients</span>
//             <span className="text-xl font-bold font-mono text-gray-900 dark:text-white">{uniqueCustomers}</span>
//           </div>
//         </div>
//         {/* Avg Ticket Value */}
//         <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
//           <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0">
//             <Star className="w-6 h-6" />
//           </div>
//           <div>
//             <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">Avg Ticket Value</span>
//             <span className="text-xl font-bold font-mono text-gray-900 dark:text-white">{formatCurrency(averageValue)}</span>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Recent Invoices */}
//         <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-md font-bold text-gray-900 dark:text-white">Recently Drafted</h2>
//               <p className="text-xs text-gray-500 dark:text-gray-450">View, preview, and download your 5 most recently compiled bills.</p>
//             </div>
//             <button
//               onClick={() => onNavigate('history')}
//               className="text-xs text-indigo-650 hover:text-indigo-750 font-bold hover:underline hover:cursor-pointer"
//             >
//               See All History →
//             </button>
//           </div>
//           <div className="overflow-x-auto">
//             <table className="w-full text-left font-sans text-xs border-collapse">
//               <thead>
//                 <tr className="border-b border-gray-150 dark:border-gray-850 text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
//                   <th className="py-3 px-3">Invoice No</th>
//                   <th className="py-3 px-3">Client</th>
//                   <th className="py-3 px-3">Issued Date</th>
//                   <th className="py-3 px-3 text-right">Sum Total</th>
//                   <th className="py-3 px-3 text-center">Action</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
//                 {sortedRecent.length > 0 ? (
//                   sortedRecent.map(inv => (
//                     <tr
//                       key={inv.id}
//                       onClick={() => onNavigate('preview', inv.id)}
//                       className="hover:bg-slate-50 dark:hover:bg-slate-950/40 cursor-pointer transition-colors group"
//                     >
//                       <td className="py-3 px-3 font-mono font-bold text-gray-900 dark:text-white">{inv.invoiceNumber}</td>
//                       <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">{inv.customer.customerName}</td>
//                       <td className="py-3 px-3 font-mono text-gray-500 dark:text-gray-400">{formatDateLabel(inv.invoiceDate)}</td>
//                       <td className="py-3 px-3 text-right font-mono font-bold text-indigo-650 dark:text-indigo-400">{formatCurrency(inv.grandTotal)}</td>
//                       <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
//                         <div className="flex items-center justify-center gap-1.5">
//                           <button
//                             onClick={() => onNavigate('preview', inv.id)}
//                             className="p-1 px-2 border border-gray-200 dark:border-gray-855 rounded-lg text-gray-650 dark:text-gray-400 hover:text-indigo-650 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
//                             title="Open layout preview pane"
//                           >
//                             <Eye className="w-3.5 h-3.5" />
//                           </button>
//                           <button
//                             onClick={e => handleQuickDownload(inv, e)}
//                             className="p-1 px-2 border border-gray-200 dark:border-gray-855 rounded-lg text-gray-650 dark:text-gray-400 hover:text-emerald-650 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
//                             title="Interactive PDF render"
//                           >
//                             <Download className="w-3.5 h-3.5" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={5} className="py-8 text-center text-gray-400 font-normal">
//                       No invoices found in your system. Start by creating a new proforma.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//         {/* Workspace Guides */}
//         <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-6">
//           <div className="space-y-4">
//             <div>
//               <h2 className="text-md font-bold text-gray-900 dark:text-white">Workspace Guides</h2>
//               <p className="text-xs text-gray-500 dark:text-gray-450">Everything is stored securely inside sandboxed LocalStorage for data sovereignty.</p>
//             </div>
//             <div className="space-y-3">
//               <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
//                 <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">1</span>
//                 <div>
//                   <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">Set Company Details</span>
//                   <span className="block text-[11px] text-gray-400 leading-normal">Customize settings to configure bank numbers, GSTIN identifier, logo, and phone line records.</span>
//                 </div>
//               </div>
//               <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
//                 <span className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-655 dark:text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">2</span>
//                 <div>
//                   <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">Prepare Bill Items</span>
//                   <span className="block text-[11px] text-gray-400 leading-normal">Enter customer records and service lists. Select exclusive/inclusive matching values.</span>
//                 </div>
//               </div>
//               <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
//                 <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">3</span>
//                 <div>
//                   <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">PDF Render Engine</span>
//                   <span className="block text-[11px] text-gray-400 leading-normal">Download crisp A4 vector PDFs matching company specs for print distribution instantly.</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="border-t border-gray-100 dark:border-gray-810 pt-4 mt-2">
//             <button
//               onClick={() => navigate('/settings')}
//               className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-700 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold select-none transition-colors hover:cursor-pointer"
//             >
//               <Settings className="w-4 h-4 text-gray-500" />
//               Manage Billing Presets
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoiceHistory } from '../utils/localStorage';
import { Plus, Users, Receipt, TrendingUp, Settings, Eye, Download, Star } from 'lucide-react';
import API from '../api/axios';

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const navigate = useNavigate();

  // useEffect(() => {
  //   setInvoices(getInvoiceHistory());
  // }, []);

  useEffect(() => {
  const loadInvoices = async () => {
    try {
      const res = await API.get("/getAllPI");
      const data = res.data;

      if (data.success) {
        setInvoices(data.data);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  loadInvoices();
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
    } else if (view === 'settings') {
      navigate('/settings');
    }
  };

  // Calculate analytics
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalInvoices = invoices.length;
  
  const uniqueCustomers = Array.from(new Set(invoices.map(inv => inv.customer?.customerName?.trim().toUpperCase() || ''))).filter(Boolean).length;
  
  const averageValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  // Sorting list by ID (which incorporates timestamp) to show 5 most recent
  const sortedRecent = [...invoices]
    .sort((a, b) => b._id.localeCompare(a._id))
    .slice(0, 5);

  const formatCurrency = (val) => {
    return '₹' + val.toLocaleString('en-IN', {
      maximumFractionDigits: 0
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
    // Since rendering needs the preview DOM to be active, let's navigate to the preview screen 
    // to allow a seamless download, or trigger it. Opening the preview is the cleanest design experience.
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

      {/* Statistics Panels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Metric Card 1 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-indigo-600 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">Total Revenue</span>
            <span className="text-xl font-bold font-mono text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-500 dark:text-orange-400 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-orange-500 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">Invoices Drafted</span>
            <span className="text-xl font-bold font-mono text-gray-900 dark:text-white">{totalInvoices}</span>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-sky-500 dark:text-sky-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-sky-500 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">Total Clients</span>
            <span className="text-xl font-bold font-mono text-gray-900 dark:text-white">{uniqueCustomers}</span>
          </div>
        </div>

        {/* Metric Card 4 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-emerald-700 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">Avg Ticket Value</span>
            <span className="text-xl font-bold font-mono text-gray-900 dark:text-white">{formatCurrency(averageValue)}</span>
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
              className="text-xs text-indigo-650 hover:text-indigo-750 font-bold hover:underline hover:cursor-pointer"
            >
              See All History →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-150 dark:border-gray-850 text-blue-800 dark:text-gray-200 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Invoice No</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Issued Date</th>
                  <th className="py-3 px-3 text-right">Sum Total</th>
                  <th className="py-3 px-3 text-center">Action</th>
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
                      <td className="py-3 px-3 font-mono font-bold text-gray-900 dark:text-white">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">{inv.customer?.customerName}</td>
                      <td className="py-3 px-3 font-mono text-gray-900 dark:text-gray-300">{formatDateLabel(inv.invoiceDate)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-indigo-650 dark:text-indigo-400">{formatCurrency(inv.grandTotal)}</td>
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleNavigate('preview', inv._id)}
                            className="p-1 px-2 border border-gray-200 dark:border-gray-855 rounded-lg text-gray-650 dark:text-gray-400 hover:text-indigo-650 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            title="Open layout preview pane"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleQuickDownload(inv, e)}
                            className="p-1 px-2 border border-gray-200 dark:border-gray-855 rounded-lg text-gray-650 dark:text-gray-400 hover:text-emerald-650 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
                    <td colSpan={5} className="py-8 text-center text-gray-400 font-normal">
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
              <p className="text-sm text-gray-800 dark:text-gray-200">Everything is stored securely with data sovereignty.</p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <span className="block text-xs font-bold text-gray-800 dark:text-white">Set Company Details</span>
                  <span className="block text-[11px] text-gray-800 dark:text-gray-200 leading-normal">Customize settings to configure bank numbers, GSTIN identifier, logo, and phone line records.</span>
                </div>
              </div>

              <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-655 dark:text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <span className="block text-xs font-bold text-gray-800 dark:text-white">Prepare Bill Items</span>
                  <span className="block text-[11px] text-gray-800 dark:text-gray-200 leading-normal">Enter customer records and service lists. Select exclusive/inclusive matching values.</span>
                </div>
              </div>

              <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                <div>
                  <span className="block text-xs font-bold text-gray-800 dark:text-white">PDF Render Engine</span>
                  <span className="block text-[11px] text-gray-800 dark:text-gray-200 leading-normal">Download crisp A4 vector PDFs matching company specs for print distribution instantly.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-810 pt-4 mt-2">
            <button
              onClick={() => handleNavigate('settings')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-300 dark:bg-slate-950 dark:hover:bg-slate-850 dark:hover:text-gray-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-gray-200 rounded-xl text-xs font-semibold select-none transition-colors hover:cursor-pointer"
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
