// import React, { useState, useMemo } from 'react';
// import { deleteInvoice } from '../utils/localStorage';
// import { Search, Eye, Edit2, Copy, Trash2, Download, ChevronLeft, ChevronRight, FileText, Calendar, DollarSign, User } from 'lucide-react';

// const ITEMS_PER_PAGE = 8;

// export default function HistoryView({ invoices, onNavigate, onEdit, onDuplicate, onRefresh }) {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [showConfirmId, setShowConfirmId] = useState(null);

//   // Search logic: checks both Invoice Number and Customer Name
//   const filteredInvoices = useMemo(() => {
//     const rawSearch = searchTerm.toLowerCase().trim();
//     if (!rawSearch) return invoices;
    
//     return invoices.filter(inv => {
//       return (
//         inv.invoiceNumber.toLowerCase().includes(rawSearch) ||
//         inv.customer.customerName.toLowerCase().includes(rawSearch) ||
//         (inv.customer.city && inv.customer.city.toLowerCase().includes(rawSearch)) ||
//         (inv.customer.state && inv.customer.state.toLowerCase().includes(rawSearch))
//       );
//     });
//   }, [invoices, searchTerm]);

//   // Pagination logic
//   const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
//   const paginatedInvoices = useMemo(() => {
//     // Return sorted descending (by creation date/ID)
//     const sorted = [...filteredInvoices].sort((a, b) => b.id.localeCompare(a.id));
//     const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
//     return sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
//   }, [filteredInvoices, currentPage]);

//   const handleDelete = (id) => {
//     deleteInvoice(id);
//     setShowConfirmId(null);
//     onRefresh();
//   };

//   const formatDate = (dateStr) => {
//     if (!dateStr) return '';
//     const parts = dateStr.split('-');
//     if (parts.length === 3) {
//       return `${parts[2]}-${parts[1]}-${parts[0]}`;
//     }
//     return dateStr;
//   };

//   const formatCurrency = (val) => {
//     return '₹' + val.toLocaleString('en-IN', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     });
//   };

//   return (
//     <div className="space-y-6">
//       {/* Search Bar + Controls */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
//             <FileText className="w-6 h-6 text-indigo-600" />
//             Invoice History Ledger
//           </h1>
//           <p className="text-sm text-gray-500 dark:text-gray-450 mt-1">
//             Search, sort, edit, or copy previous proforma billing sheets. Every draft has locked and sequential numbering.
//           </p>
//         </div>
//         {/* Create Invoice Shortcut */}
//         <button
//           onClick={() => onNavigate('create')}
//           className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all hover:scale-102 flex items-center gap-2 self-start md:self-auto hover:cursor-pointer"
//         >
//           <span>+ Create New Invoice</span>
//         </button>
//       </div>

//       {/* Modern Search/Filter Input Frame */}
//       <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-sm">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => {
//               setSearchTerm(e.target.value);
//               setCurrentPage(1); // reset to page 1 on search
//             }}
//             placeholder="Search by client name, invoice number, city or state..."
//             className="w-full pl-10 pr-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
//           />
//         </div>
//         {/* Helper info text */}
//         <div className="text-xs text-gray-450 self-center hidden sm:block">
//           Showing <span className="font-bold text-gray-750 dark:text-gray-300">{filteredInvoices.length}</span> results
//         </div>
//       </div>

//       {/* Table grid display */}
//       <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left font-sans text-xs border-collapse">
//             <thead>
//               <tr className="border-b border-gray-150 dark:border-gray-810 text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
//                 <th className="py-3 px-4">Proforma Number</th>
//                 <th className="py-3 px-4">Client Name</th>
//                 <th className="py-3 px-4">Billing Date</th>
//                 <th className="py-3 px-4 text-right">Invoice Sum</th>
//                 <th className="py-3 px-4 text-center">Action Checklist</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
//               {paginatedInvoices.length > 0 ? (
//                 paginatedInvoices.map((inv) => (
//                   <tr 
//                     key={inv.id} 
//                     onClick={() => onNavigate('preview', inv.id)}
//                     className="hover:bg-slate-50 dark:hover:bg-slate-950/30 cursor-pointer transition-colors group"
//                   >
//                     {/* Col: Invoice Number */}
//                     <td className="py-4 px-4">
//                       <span className="font-mono text-gray-900 dark:text-white font-extrabold tracking-wide block">
//                         {inv.invoiceNumber}
//                       </span>
//                       <span className="text-[10px] text-gray-400 lowercase tracking-wider mt-0.5 block">
//                         mode: {inv.gstMode === 'exclusive' ? 'base + gst' : 'inclusive'}
//                       </span>
//                     </td>
//                     {/* Col: Client details */}
//                     <td className="py-4 px-4">
//                       <span className="font-bold text-gray-900 dark:text-white block group-hover:text-indigo-655 transition-colors">
//                         {inv.customer.customerName}
//                       </span>
//                       <span className="text-[10px] text-gray-450 block italic mt-0.5 truncate max-w-[200px]">
//                         {inv.customer.city}, {inv.customer.state}
//                       </span>
//                     </td>
//                     {/* Col: Invoice and Due Dates */}
//                     <td className="py-4 px-4 font-mono text-slate-655 dark:text-slate-400">
//                       <div className="flex items-center gap-1">
//                         <span className="font-bold text-[10px] text-gray-400">IS:</span>
//                         <span>{formatDate(inv.invoiceDate)}</span>
//                       </div>
//                       <div className="flex items-center gap-1 mt-0.5">
//                         <span className="font-bold text-[10px] text-rose-450">DU:</span>
//                         <span className="text-rose-500 font-bold">{formatDate(inv.dueDate)}</span>
//                       </div>
//                     </td>
//                     {/* Col: Currency Amount */}
//                     <td className="py-4 px-4 text-right">
//                       <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
//                         {formatCurrency(inv.grandTotal)}
//                       </span>
//                     </td>
//                     {/* Col: Interactive quick buttons */}
//                     <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
//                       <div className="flex items-center justify-center gap-1.5">
//                         <button
//                           onClick={() => onNavigate('preview', inv.id)}
//                           className="p-1 px-2 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-650 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
//                           title="Open Layout Preview Screen"
//                         >
//                           <Eye className="w-3.5 h-3.5" />
//                         </button>
//                         <button
//                           onClick={() => onEdit(inv.id)}
//                           className="p-1 px-2 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-650 dark:text-gray-400 hover:text-amber-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
//                           title="Edit original values"
//                         >
//                           <Edit2 className="w-3.5 h-3.5" />
//                         </button>
//                         <button
//                           onClick={() => onDuplicate(inv)}
//                           className="p-1 px-2 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-650 dark:text-gray-400 hover:text-sky-605 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
//                           title="Duplicate into fresh consecutive draft"
//                         >
//                           <Copy className="w-3.5 h-3.5" />
//                         </button>
//                         {/* Inline Delete check */}
//                         {showConfirmId === inv.id ? (
//                           <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900 border-dashed animate-pulse">
//                             <span className="text-[9px] text-rose-600 font-bold uppercase shrink-0">Sure?</span>
//                             <button
//                               onClick={() => handleDelete(inv.id)}
//                               className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline"
//                             >
//                               Yes
//                             </button>
//                             <span className="text-gray-300">|</span>
//                             <button
//                               onClick={() => setShowConfirmId(null)}
//                               className="text-[10px] text-gray-500 font-medium hover:underline"
//                             >
//                               No
//                             </button>
//                           </div>
//                         ) : (
//                           <button
//                             onClick={() => setShowConfirmId(inv.id)}
//                             className="p-1 px-2 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-650 dark:text-gray-400 hover:text-rose-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
//                             title="Delete permanently from records"
//                           >
//                             <Trash2 className="w-3.5 h-3.5" />
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan={5} className="py-12 text-center text-gray-400 font-normal">
//                     {searchTerm ? (
//                       <div>
//                         <p className="text-sm font-semibold mb-1">No matching invoices found.</p>
//                         <p className="text-xs text-gray-400">Refine search criteria or clear the query bar.</p>
//                       </div>
//                     ) : (
//                       <div>
//                         <p className="text-sm font-semibold mb-1">No billing data stored.</p>
//                         <p className="text-xs text-gray-450">Create your first proforma to populated records here.</p>
//                       </div>
//                     )}
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//         {/* Elegant Pagination controls footer */}
//         {totalPages > 1 && (
//           <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-850">
//             <span className="text-xs text-gray-500">
//               Page <span className="font-bold text-gray-700 dark:text-gray-300">{currentPage}</span> of <span className="font-bold text-gray-700 dark:text-gray-300">{totalPages}</span>
//             </span>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                 disabled={currentPage === 1}
//                 className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors disabled:opacity-40 hover:cursor-pointer"
//               >
//                 <ChevronLeft className="w-4 h-4" />
//               </button>
//               <button
//                 onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//                 disabled={currentPage === totalPages}
//                 className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors disabled:opacity-40 hover:cursor-pointer"
//               >
//                 <ChevronRight className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoiceHistory, deleteInvoice } from '../utils/localStorage';
import { Search, Eye, Edit2, Copy, Trash2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

export default function HistoryView() {
  const [invoices, setInvoices] = useState([]);
  const navigate = useNavigate();

  // const loadInvoices = () => {
  //   setInvoices(getInvoiceHistory());
  // };
  const loadInvoices = async () => {
  try {
    const res = await fetch("http://localhost:5000/getAllPI");
    const data = await res.json();

    if (data.success) {
      setInvoices(data.data);
    }
  } catch (error) {
    console.error("Error loading invoices:", error);
  }
};

  // useEffect(() => {
  //   loadInvoices();
  // }, []);
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

  const handleDuplicate = (invoice) => {
    navigate(`/create?duplicate=${invoice._id}`);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmId, setShowConfirmId] = useState(null);

  // Search logic: checks both Invoice Number and Customer Name
  const filteredInvoices = useMemo(() => {
    const rawSearch = searchTerm.toLowerCase().trim();
    if (!rawSearch) return invoices;
    
    return invoices.filter(inv => {
      // return (
      //   inv.invoiceNumber.toLowerCase().includes(rawSearch) ||
      //   inv.customer.customerName.toLowerCase().includes(rawSearch) ||
      //   (inv.customer.city && inv.customer.city.toLowerCase().includes(rawSearch)) ||
      //   (inv.customer.state && inv.customer.state.toLowerCase().includes(rawSearch))
      // );
      return (
        inv.invoiceNumber?.toLowerCase().includes(rawSearch) ||
        inv.customer?.customerName?.toLowerCase().includes(rawSearch) ||
        inv.customer?.city?.toLowerCase().includes(rawSearch) ||
        inv.customer?.state?.toLowerCase().includes(rawSearch)
      );
    });
  }, [invoices, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = useMemo(() => {
    // Return sorted descending (by creation date/ID)
    const sorted = [...filteredInvoices].sort((a, b) => b._id.localeCompare(a._id));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  // const handleDelete = (id) => {
  //   deleteInvoice(id);
  //   setShowConfirmId(null);
  //   loadInvoices();
  // };
const handleDelete = async (id) => {
  try {
    const res = await fetch(`http://localhost:5000/deletePI/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      setShowConfirmId(null);
      loadInvoices(); // refresh list
    }
  } catch (error) {
    console.error("Delete error:", error);
  }
};

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const formatCurrency = (val) => {
    return '₹' + val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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
          <p className="text-sm text-gray-500 dark:text-gray-450 mt-1">
            Search, sort, edit, or copy previous proforma billing sheets. Every draft has locked and sequential numbering.
          </p>
        </div>

        {/* Create Invoice Shortcut */}
        <button
          onClick={() => handleNavigate('create')}
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
        <div className="text-xs text-gray-450 self-center hidden sm:block">
          Showing <span className="font-bold text-gray-750 dark:text-gray-300">{filteredInvoices.length}</span> results
        </div>
      </div>

      {/* Table grid display */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-150 dark:border-gray-810 text-gray-800 dark:text-gray-100 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Proforma Number</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Billing Date</th>
                <th className="py-3 px-4 text-right">Invoice Sum</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-center">Action Checklist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv) => (
                  <tr 
                    key={inv._id} 
                    onClick={() => handleNavigate('preview', inv._id)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-950/30 cursor-pointer transition-colors group"
                  >
                    
                    {/* Col: Invoice Number */}
                    <td className="py-4 px-4">
                      <span className="font-mono text-gray-900 dark:text-white font-extrabold tracking-wide block">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-[10px] text-gray-400 lowercase tracking-wider mt-0.5 block">
                        mode: {inv.gstMode === 'exclusive' ? 'base + gst' : 'inclusive'}
                      </span>
                    </td>

                    {/* Col: Client details */}
                    <td className="py-4 px-4">
                      <span className="font-bold text-gray-900 dark:text-white block group-hover:text-indigo-655 transition-colors">
                        {inv.customer.customerName}
                      </span>
                      <span className="text-[10px] text-gray-455 block italic mt-0.5 truncate max-w-[200px]">
                        {inv.customer.city}, {inv.customer.state}
                      </span>
                    </td>

                    {/* Col: Invoice and Due Dates */}
                    <td className="py-4 px-4 font-mono text-slate-655 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[10px] text-gray-400">IS:</span>
                        <span>{formatDate(inv.invoiceDate)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="font-bold text-[10px] text-rose-450">DU:</span>
                        <span className="text-rose-500 font-bold">{formatDate(inv.dueDate)}</span>
                      </div>
                    </td>

                    {/* Col: Currency Amount */}
                    <td className="py-4 px-4 text-right">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        {formatCurrency(inv.grandTotal)}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className={`font-medium ${
                        inv.paymentStatus === 'Pending' ? 'text-rose-500 dark:text-rose-400' : 
                        inv.paymentStatus === 'Partial' ? 'text-amber-500 dark:text-amber-400' : 
                        inv.paymentStatus === 'Paid' ? 'text-emerald-500 dark:text-emerald-400' : 
                        'text-gray-700 dark:text-gray-300'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                      {inv.paymentStatus === 'Partial' && inv.paidPercentage != null && (
                        <span className="text-xs text-gray-500 block mt-0.5">{inv.paidPercentage}%</span>
                      )}
                    </td>
                    {/* Col: Interactive quick buttons */}
                    <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleNavigate('preview', inv._id)}
                          className="p-1 px-2 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-650 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Open Layout Preview Screen"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleEdit(inv._id)}
                          className="p-1 px-2 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-650 dark:text-gray-400 hover:text-amber-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit original values"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* <button
                          onClick={() => handleDuplicate(inv)}
                          className="p-1 px-2 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-650 dark:text-gray-400 hover:text-sky-605 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Duplicate into fresh consecutive draft"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button> */}

                        {/* Inline Delete check */}
                        {showConfirmId === inv._id ? (
                          <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900 border-dashed animate-pulse">
                            <span className="text-[9px] text-rose-600 font-bold uppercase shrink-0">Sure?</span>
                            <button
                              onClick={() => handleDelete(inv._id)}
                              className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline"
                            >
                              Yes
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => setShowConfirmId(null)}
                              className="text-[10px] text-gray-500 font-medium hover:underline"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowConfirmId(inv._id)}
                            className="p-1 px-2 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-650 dark:text-gray-400 hover:text-rose-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete permanently from records"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 font-normal">
                    {searchTerm ? (
                      <div>
                        <p className="text-sm font-semibold mb-1">No matching invoices found.</p>
                        <p className="text-xs text-gray-450">Refine search criteria or clear the query bar.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold mb-1">No billing data stored.</p>
                        <p className="text-xs text-gray-450">Create your first proforma to populate records here.</p>
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
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-850">
            <span className="text-xs text-gray-500">
              Page <span className="font-bold text-gray-700 dark:text-gray-300">{currentPage}</span> of <span className="font-bold text-gray-700 dark:text-gray-300">{totalPages}</span>
            </span>
            <div className="relative flex items-center gap-2">
                {/* Page selection dropdown */}
                <label htmlFor="page-select" className="sr-only">Select page</label>
                <select
                  id="page-select"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[...Array(totalPages)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Page {i + 1}
                    </option>
                  ))}
                </select>
                {/* Hidden SVG arrow for dropdown */}
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

    </div>
  );
}
