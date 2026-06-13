import React, { useRef, useState, useEffect } from 'react';
import { downloadPDF, triggerPrint } from '../utils/pdfGenerator';
import { ArrowLeft, Download, Printer, Check, Phone, Mail, Globe, MapPin, Home, Building, CreditCard } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getInvoiceHistory } from '../utils/localStorage';
import Logo from '../assets/logo.png';
import API from '../api/axios';


// Vector fallback logo mirroring the sample image (Digital Elite Service) perfectly
const FallbackLogo = () => (
  <div className="flex items-center gap-3">
    {/* <svg className="w-14 h-14" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 90C15 80 12 70 12 55C12 25 35 15 65 15C95 15 105 35 105 55C105 75 90 95 65 95H20" stroke="url(#logo-grad-1)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M35 80C30 72 28 65 28 55C28 35 44 28 65 28C86 28 92 40 92 55C92 70 80 82 65 82H35" stroke="url(#logo-grad-2)" strokeWidth="8" strokeLinecap="round" />
      <circle cx="65" cy="55" r="12" fill="#e11d48" />
      <defs>
        <linearGradient id="logo-grad-1" x1="12" y1="15" x2="105" y2="95" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0ea5e9" />
          <stop offset="0.5" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="logo-grad-2" x1="28" y1="28" x2="92" y2="82" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f43f5e" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
      </defs>
    </svg> */}
    <img src={Logo} className="w-15 h-full" alt="Logo" />
    <div>
      <div className="text-xl font-extrabold tracking-tight text-slate-800 leading-none">Digital</div>
      <div className="text-xs font-semibold  text-slate-600 tracking-wider">Elite Service</div>
    </div>
  </div>
);

// Formatter for Indian currency format with comma separators e.g. 35,400.00
const formatIndianCurrency = (num) => {
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Date Formatter: YYYY-MM-DD -> DD-MM-YYYY
const formatDateString = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

export default function InvoicePreview({ invoice: propInvoice, onBack: propOnBack }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [invoice, setInvoice] = useState(propInvoice);
  
  const containerRef = useRef(null);
  const [zoomScale, setZoomScale] = useState(1);

  const idFromQuery = searchParams.get('id');

  useEffect(() => {
    let animationFrameId;

    const handleResize = () => {
      if (containerRef.current && containerRef.current.parentElement) {
        // Measure the actual parent container width to determine safe available space
        const parentWidth = containerRef.current.parentElement.getBoundingClientRect().width;
        
        // Subtract container paddings. p-2 gives 16px horizontal padding.
        const isMobile = window.innerWidth < 640;
        const containerPadding = isMobile ? 32 : 64; 
        
        const availableWidth = parentWidth - containerPadding;
        
        if (availableWidth > 0 && availableWidth < 794) {
          setZoomScale(availableWidth / 794);
        } else {
          setZoomScale(1);
        }
      }
    };

    const throttledResize = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleResize);
    };

    // Initial calculation
    throttledResize();
    setTimeout(throttledResize, 100);

    // Use ResizeObserver for rock-solid DOM width tracking
    const observer = new ResizeObserver(() => {
      throttledResize();
    });

    if (containerRef.current && containerRef.current.parentElement) {
      observer.observe(containerRef.current.parentElement);
      observer.observe(document.body);
    }

    window.addEventListener('resize', throttledResize);
    
    return () => {
      window.removeEventListener('resize', throttledResize);
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

useEffect(() => {
  const fetchInvoice = async () => {
    try {
      if (propInvoice) {
        setInvoice(propInvoice);
        return;
      }

      if (idFromQuery) {
        const res = await API.get(`/getPI/${idFromQuery}`);
        const data = res.data;

        if (data.success) {
          setInvoice(data.data);
        } else {
          setInvoice(null);
        }
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      setInvoice(null);
    }
  };

  fetchInvoice();
}, [propInvoice, idFromQuery]);


  const handleBack = () => {
    if (propOnBack) {
      propOnBack();
    } else {
      navigate('/history-view');
    }
  };

  if (!invoice) {
    return (
      <div className="text-center p-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <p className="text-sm font-semibold text-gray-500 mb-2">Selected invoice not found.</p>
        <button
          onClick={handleBack}
          className="text-xs font-bold text-indigo-650 hover:underline hover:cursor-pointer"
        >
          Return to History Ledger
        </button>
      </div>
    );
  }

  const printableAreaId = `printable-proforma-invoice-${invoice.id}`;

  const handleDownload = async () => {
    setDownloading(true);
    const safeFilename = `${invoice.customer.customerName} - Proforma Invoice`;
    await downloadPDF(printableAreaId, safeFilename);
    setDownloading(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-10 w-full max-w-full box-border overflow-x-hidden">
      {/* Control Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 hover:cursor-pointer text-sm font-medium text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => triggerPrint(printableAreaId, `${invoice.customer.customerName} - Proforma Invoice`)}
            className="flex items-center gap-2 px-4 py-2 hover:cursor-pointer border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 dark:hover:text-gray-900 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-100 text-sm font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Proforma
          </button>
          
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 hover:cursor-pointer border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 dark:hover:text-gray-900 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-100 text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Rendering PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Screen Preview Wrapper with Responsive Zoom Scale */}
      {/* <div 
        ref={containerRef}
        className="w-full bg-slate-100 dark:bg-slate-950 p-2 sm:p-8 rounded-2xl flex justify-center overflow-x-auto min-h-[600px] border border-gray-200 dark:border-gray-900 shadow-inner "
      style={{border:"orenge 4px"}}
      >
         */}
      <div
  ref={containerRef}
  className="w-full bg-slate-100 dark:bg-slate-950 p-2 sm:p-8 rounded-2xl flex justify-center overflow-x-auto min-h-[600px] shadow-inner"
>
        {/* Scaled Wrapper to perfectly fit the A4 dimension within mobile viewports */}
        <div 
          className="relative transition-all duration-200 ease-out"
          style={{
             width: `${794 * zoomScale}px`,
             height: `${1123 * zoomScale}px`
          }}
        >
          <div 
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top left',
              // borderTop: "12px solid #f59e0b",
              // borderRight: "12px solid #f59e0b",
 
            }}
            className="absolute top-0 left-0"

          >
            {/* Printable/A4 Document Block */}
            {/* Force bg-white text-black so it renders beautifully in print mode and Canvas extraction */}
            <div 
              id={printableAreaId}
              className="relative bg-white text-slate-900 border border-slate-350 shadow-2xl p-8 pointer-events-auto rounded-none text-[12px] font-sans overflow-hidden print:border-0 print:shadow-none print:p-8"
              style={{
                width: '794px',
                minHeight: '1123px', // standard A4 aspect
                boxSizing: 'border-box',
                fontFamily: 'Calibri, "Segoe UI", Roboto, Arial, sans-serif',
             
    // borderTop: "12px solid #f59e0b",
    // borderRight: "12px solid #f59e0b",
 
              }}
            >
          {/* Accent top decoration matching "Digital Elite Service" banner vibes */}
          {/* <div className="absolute top-0 right-0 w-32 h-16 bg-gradient-to-bl from-orange-400/90 to-amber-300/10 rounded-bl-full" />
          <div className="absolute top-0 left-0 w-16 h-40 bg-gradient-to-br from-sky-400/20 to-blue-500/0 rounded-r-full" /> */}

           {/* Top Orange Border */}
          <div className="absolute top-0 left-0 w-full h-5 bg-orange-400" ></div>

          {/* Top Right Curved Corner */}
          <div className="absolute top-0 right-0 w-5 h-46 bg-orange-400 rounded-bl-[30px] "></div>

                     {/* Right Side Guide Line */}
          <div className="absolute right-4 top-[360px] h-25 flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-black"></div>
            <div className="w-[1.5px]  flex-1 bg-black"></div>
            {/* <div className="w-[2px] flex-1 bg-gray-500"></div> */}
          </div>

          {/* Second Guide Line */}
          <div className="absolute right-4 top-[490px] h-130 flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-black"></div>
            <div className="w-[2px]  flex-1 bg-black"></div>
            {/* <div className="w-[2px] flex-1 bg-gray-500"></div> */}
          </div>

          {/* Left Third Guide Line */}
          <div className="absolute left-4 top-[790px] h-30 flex flex-col items-center">
            <div className="w-[2px] flex-1 bg-black"></div>
            <div className="w-2 h-2 rounded-full bg-black"></div>
            
          </div>


          
          {/* Header Row: Fallback Logo or Base64 custom Business Logo */}
          <div className="flex justify-between items-start mb-6 mt-2">
            <div className="flex items-center gap-4">
              {invoice.company.companyLogo ? (
                <div className="w-18 h-18 rounded-xl overflow-hidden border border-slate-100 p-1 flex items-center justify-center bg-white shadow-sm">
                  <img src={invoice.company.companyLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <FallbackLogo />
              )}
            </div>
           
          </div>
           <hr className="border-black my-4 w-full mb-20" />

          {/* Section: PROFORMA INVOICE Highlight box */}
          <div className="border border-slate-900 bg-slate-50 p-1 text-center font-bold text-base tracking-wider uppercase mb-5">
            PROFORMA INVOICE
          </div>

          {/* Section: Details split columns */}
          <div className="grid grid-cols-12 gap-4 pb-4 mb-4">
            
            {/* Bill To Info */}
            <div className="col-span-7 flex flex-col justify-between border-r border-slate-200 pr-4">
              <div>
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">BILL TO</div>
                <div className="text-sm font-extrabold text-slate-900">{invoice.customer.customerName}</div>
                <div className="text-slate-700 leading-relaxed max-w-[320px] whitespace-pre-line mt-1">
                  {invoice.customer.address}, {invoice.customer.city}, {invoice.customer.state} - {invoice.customer.pincode}
                </div>
              </div>

              {invoice.customer.gstin && (
                <div className="mt-2 text-xs font-semibold text-slate-800">
                  GSTIN: <span className="font-mono">{invoice.customer.gstin}</span>
                </div>
              )}
            </div>

            {/* Invoicing Metadata Info (Right Column) */}
            <div className="col-span-5 pl-2 space-y-2">
               {invoice.company.gstin && (
                  <div className="grid grid-cols-12  items-center">
                    <span className="col-span-4 font-bold text-slate-800">GSTIN:</span>
                    <span className="col-span-8 font-mono text-slate-900 font-extrabold tracking-wide">{invoice.company.gstin}</span>
                  </div>
                )}
                {invoice.company.pan && (
                  <div className="grid grid-cols-12  items-center">
                    <span className="col-span-4 font-bold text-slate-800">PAN:</span>
                    <span className="col-span-8 font-mono text-slate-900 font-extrabold tracking-wide">{invoice.company.pan}</span>
                  </div>
                )}
              <div className="grid grid-cols-12  items-center">
                
                <span className="col-span-4 font-bold text-slate-800">Proforma No:</span>
                <span className="col-span-8 font-mono text-slate-900 font-extrabold tracking-wide">{invoice.invoiceNumber}</span>
              </div>


              {/* Vendor PAN/GSTIN snapshots */}
              <div className="border-t border-dashed border-slate-200 pt-2 space-y-1 text-[11px]">
                <div className="grid grid-cols-12  items-center pt-2">
                <span className="col-span-4 font-bold text-slate-800">Date:</span>
                <span className="col-span-8 font-mono font-medium text-slate-950">{formatDateString(invoice.invoiceDate)}</span>
              </div>

              <div className="grid grid-cols-12 gap-1 items-center">
                <span className="col-span-4 font-bold text-slate-800">Due Date:</span>
                <span className="col-span-8 font-mono font-weight-560 text-slate-950">{formatDateString(invoice.dueDate)}</span>
              </div>
                
              </div>
            </div>

          </div>

          {/* Service items table */}
          <div className="border border-slate-900 mb-5 rounded-sm overflow-hidden">
            
            {/* Table Header */}
            <div className="grid grid-cols-12 border-b border-slate-900 bg-slate-50 font-bold text-slate-850 uppercase text-center text-[11px] select-none">
              <div className="col-span-7 py-2.5 px-3 border-r border-slate-800 text-left">DESCRIPTION</div>
              <div className="col-span-2 py-2.5 px-2 border-r border-slate-800">QTY / TIME FRAME</div>
              <div className="col-span-3 py-2.5 px-3 text-right">AMOUNT</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-300">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, index) => (
                  <div key={item.id || index} className="grid grid-cols-12 text-slate-800 items-stretch min-h-[44px]">
                    
                    {/* Item Description col */}
                    <div className="col-span-7 py-3 text-xm px-3 border-r border-slate-900 flex items-center bg-white text-left whitespace-pre-line font-medium text-slate-900">
                      <div>
                        <span className="font-bold  text-slate-950 mr-1.5">{index + 1}.</span>
                        {item.description}
                      </div>
                    </div>

                    {/* Quantity / timeframe col */}
                    <div className="col-span-2 py-3 px-2 border-r border-slate-900 flex flex-col items-center justify-center font-mono text-center">
                      <span className="font-bold text-sm leading-none">{item.timeFrame}</span>
                      <span className="text-[8px] text-slate-500 font-sans tracking-widest uppercase mt-1">{item.timeFrameUnit === 'Quantity' ? 'Qty' : (item.timeFrameUnit || 'Months')}</span>
                    </div>

                    {/* Numeric Amount col */}
                    <div className="col-span-3 py-3 px-4 flex items-center justify-end font-mono font-semibold text-right text-slate-900">
                      {formatIndianCurrency(item.amount)}
                    </div>

                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400">No billable lines defined.</div>
              )}
            </div>

          </div>
   

          {/* Core breakdown row: Bank details on Left vs Totals column on Right */}
          <div className="grid grid-cols-12 gap-4 border border-slate-900 mb-4 divide-x divide-slate-900 overflow-hidden rounded-sm">
            
            {/* Bank details widget */}
            <div className="col-span-6 p-3 bg-white space-y-1.5 flex flex-col justify-center">
              <div className="text-[12px] font-extrabold text-slate-950 uppercase tracking-widest border-b border-slate-100 pb-1 mb-1">
                BANK REMITTANCE DETAILS
              </div>
              <div className="grid grid-cols-12 gap-y-1 text-[11px] leading-tight text-slate-800">
                <span className="col-span-4 font-bold text-slate-900">A/c Name:</span>
                <span className="col-span-8 font-semibold text-slate-900">{invoice.company.companyName}</span>
                
                <span className="col-span-4 font-bold text-slate-900">A/c No:</span>
                <span className="col-span-8 font-mono font-bold text-slate-900">{invoice.company.accountNumber || '---'}</span>
                
                <span className="col-span-4 font-bold text-slate-900">Bank Name:</span>
                <span className="col-span-8 text-slate-950 font-medium">{invoice.company.bankName || '---'}</span>
                
                <span className="col-span-4 font-bold text-slate-900">IFSC Code:</span>
                <span className="col-span-8 font-mono font-bold text-slate-950">{invoice.company.ifscCode || '---'}</span>
                
                <span className="col-span-4 font-bold text-slate-900">Branch:</span>
                <span className="col-span-8 text-slate-950">{invoice.company.branch || '---'}</span>
              </div>
            </div>

            {/* Invoice exact totals column */}
            <div className="col-span-6 flex flex-col justify-between">
              
              <div className="divide-y divide-slate-900 flex-1">
                <div className="grid grid-cols-12 py-2 px-3">
                  <span className="col-span-7 font-extrabold text-[13px] text-slate-900">SUB TOTAL</span>
                  <span className="col-span-5 text-right font-mono text-[14px] font-bold text-slate-900">
                    {formatIndianCurrency(invoice.subtotal)}
                  </span>
                </div>

                <div className="grid grid-cols-12 py-2 px-3">
                  <span className="col-span-7 font-semibold text-slate-600">CGST (9%)</span>
                  <span className="col-span-5 text-right font-mono font-semibold text-slate-800">
                    {formatIndianCurrency(invoice.cgst)}
                  </span>
                </div>

                <div className="grid grid-cols-12 py-2 px-3">
                  <span className="col-span-7 font-semibold text-slate-600">SGST (9%)</span>
                  <span className="col-span-5 text-right font-mono font-semibold text-slate-800">
                    {formatIndianCurrency(invoice.sgst)}
                  </span>
                </div>

                <div className="grid grid-cols-12 py-2.5 px-3 bg-slate-50 font-extrabold text-[13px] text-slate-900">
                  <span className="col-span-7 uppercase">TOTAL</span>
                  <span className="col-span-5 font-extrabold text-right font-mono text-indigo-700">
                    {formatIndianCurrency(invoice.grandTotal)}
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Amount In Words Row */}
          <div className="border border-slate-900 bg-slate-50 px-4 py-2.5 text-slate-900 text-xs font-bold font-serif mb-5 flex items-center justify-center">
            {invoice.amountInWords}
          </div>

          {/* Terms and conditions block */}
          <div className="border border-slate-900 p-3 bg-white text-[11px] rounded-sm space-y-1.5">
            <div className="font-extrabold text-slate-900 underline uppercase tracking-wider text-[10px] mb-1">
              Terms and Conditions: -
            </div>
            
            {invoice.terms && invoice.terms.length > 0 ? (
              <ol className="list-decimal pl-4 space-y-1 text-slate-900 leading-relaxed">
                {invoice.terms.map((term, idx) => (
                  <li key={idx} className="font-normal">
                    {term.includes('agreed scope') ? (
                      <span>Services will be provided as per the <strong className="text-slate-905">agreed scope</strong>.</span>
                    ) : term.includes('agreed terms') ? (
                      <span>Payment must be made as per <strong className="text-slate-905">agreed terms</strong> to continue services.</span>
                    ) : term.includes('additional work') ? (
                      <span>Any <strong className="text-slate-905">additional work</strong> will be charged separately.</span>
                    ) : (
                      <span>{term}</span>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-slate-400">None declared.</p>
            )}

            <div className="border-t border-dashed border-slate-200 pt-2 mt-2 leading-relaxed text-slate-700 text-[10.5px]">
              If you have any questions about this proforma, please contact <strong className="text-slate-900">{invoice.company.phone || '+91 63669 30178'}</strong>
            </div>

            <div className="border border-slate-300 p-1 text-center font-bold tracking-wider italic text-[11px] text-slate-900 mt-2 bg-slate-50/50">
              Thank You For Your Business!
            </div>
          </div>

          {/* Small designer frame footer */}
          <div className="mt-8 border-t border-slate-100 pt-4 grid grid-cols-12 items-center text-[10.5px] text-slate-500">
            
            {/* Address */}
            <div className="col-span-7 flex items-center gap-2">
              <Home className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="block italic leading-tight text-slate-800 font-medium">{invoice.company.address}</span>
            </div>

            {/* Channels contacts */}
            <div className="col-span-5 pl-3 border-l border-slate-200 grid grid-cols-1 gap-1">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="font-mono font-medium text-slate-800">{invoice.company.phone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="font-medium text-slate-800 truncate">{invoice.company.email}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Globe className="w-3 h-3 text-indigo-500 shrink-0" />
                <span className="text-slate-800 truncate">{invoice.company.website}</span>
              </div>
              {/* Top Orange Border */}
               <div className="absolute bottom-0 right-0 w-full h-5 bg-blue-400" ></div>

              {/* Top Right Curved Corner */}
              <div className="absolute bottom-0 left-0 w-5 h-46 bg-blue-400 rounded-tr-[30px]"></div>
            </div>
                
         
          </div>

          {/* Accent bottom-left decoration */}
          <div className="absolute bottom-0 left-0 w-32 h-16 bg-gradient-to-tr from-sky-450/30 to-indigo-500/0 rounded-tr-full" />

        </div>
          </div>
        </div>

      </div>
    </div>
  );
}