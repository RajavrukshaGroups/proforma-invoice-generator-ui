import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { addOrUpdateInvoice, incrementCounter, clearDraft, saveDraft, selectDraft, selectNextInvoiceNumber } from '../store/slices/invoiceSlice';
import { selectCompanySettings, updateCompanySettings, DEFAULT_TERMS } from '../store/slices/settingsSlice';
import { calculateGST } from '../utils/calculations';
import { store } from '../store/store';
import { Plus, Trash, Save, FileText, Check, AlertTriangle, RefreshCcw } from 'lucide-react';
import API from '../api/axios';


const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/i;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;

const invoiceSchema = z.object({
  customerName: z.string().min(3, { message: 'Customer Name must be at least 3 characters' }),
  address: z.string().min(1, { message: 'Address is required' }),
  city: z.string().min(1, { message: 'City is required' }),
  state: z.string().min(1, { message: 'State is required' }),
  pincode: z.string().length(6, { message: 'Pincode must be exactly 6 digits' }).regex(/^\d+$/, { message: 'Pincode must contain digits only' }),
  gstin: z.string().regex(gstRegex, { message: 'Customer GSTIN must be a valid 15-character identifier (e.g. 29AAZFD0061B1ZH)' }).optional().or(z.literal('')),
  invoiceDate: z.string().min(1, { message: 'Invoice Date is required' }),
  dueDate: z.string().min(1, { message: 'Due Date is required' }),
  gstMode: z.enum(['exclusive', 'inclusive']),
  paymentStatus: z.enum(['Pending', 'Partial', 'Paid']).default('Pending'),
  paidPercentage: z.coerce.number().min(0).max(100).default(0),
  items: z.array(z.object({
    description: z.string().min(1, { message: 'Description is required' }),
    timeFrame: z.coerce.number().gt(0, { message: 'Timeframe must be greater than 0' }),
    timeFrameUnit: z.string().optional().default('Months'),
    amount: z.coerce.number().gt(0, { message: 'Amount must be greater than 0' })
  })).min(1, { message: 'At least one service item is required' })
}).refine(data => {
  const invDate = new Date(data.invoiceDate);
  const dDate = new Date(data.dueDate);
  return dDate > invDate;
}, {
  message: 'Due Date must be greater than Invoice Date',
  path: ['dueDate']
});

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const clientData = location.state?.clientData;
  const idParam = searchParams.get('id');
  const duplicateParam = searchParams.get('duplicate');

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const dispatch = useDispatch();
  const [editingInvoiceSnap, setEditingInvoiceSnap] = useState(null);
  
  // Custom states outside the schema for bank details snap and manual T&C
  const companySnapshot = useSelector(selectCompanySettings);
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [newTerm, setNewTerm] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const [toast, setToast] = useState(null);

  // Default dates: Today and Today + 30 days
  const getTodayStr = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getDueDateDefault = () => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    return defaultDate.toISOString().split('T')[0];
  };

  // Determine initial values
  const defaultFormValues = {
    paymentStatus: 'Pending',
    paidPercentage: 0,
    customerName: clientData?.customerName || '',
    address: clientData?.address || '',
    city: clientData?.city || '',
    state: clientData?.state || '',
    pincode: clientData?.pincode || '',
    gstin: clientData?.gstin || '',
    pan: clientData?.pan || '',
    invoiceDate: getTodayStr(),
    dueDate: getDueDateDefault(),
    gstMode: 'exclusive',
    items: [
      { description: 'Digital Marketing', timeFrame: 1, timeFrameUnit: 'Months', amount: 15000 },
      { description: 'Social Media Management', timeFrame: 1, timeFrameUnit: 'Months', amount: 15000 }
    ]
  };

  const { register, control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultFormValues
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  useEffect(() => {
  const fetchInvoice = async () => {
    if (!idParam) return;

    try {
      const res = await API.get(`/getPI/${idParam}`);
      const data = res.data;

      if (!data.success) return;

      const inv = data.data;

      setIsEditMode(true);
      setEditingInvoiceSnap(inv);
      setInvoiceNumber(inv.invoiceNumber);
      dispatch(updateCompanySettings(inv.company));
      setTerms(inv.terms);

      reset({
        customerName: inv.customer.customerName,
        address: inv.customer.address,
        city: inv.customer.city,
        state: inv.customer.state,
        pincode: inv.customer.pincode,
        gstin: inv.customer.gstin || '',
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        gstMode: inv.gstMode,
        paymentStatus: inv.paymentStatus || 'Pending',
        paidPercentage: inv.paidPercentage ?? 0,
        items: inv.items
      });

    } catch (err) {
      console.error("Edit load error:", err);
    }
  };

  fetchInvoice();
}, [idParam, dispatch, reset]);

  // Handle invoice dynamic changes to adjust auto-numbered label instantly
  const watchedDate = watch('invoiceDate');
  useEffect(() => {
    if (!isEditMode && watchedDate) {
      const nextNo = selectNextInvoiceNumber(store.getState(), watchedDate);
      setInvoiceNumber(nextNo);
    }
  }, [watchedDate, isEditMode, store]);

  // Watch form fields for live auto-calculations
  const watchedItems = watch('items');
  const watchedGstMode = watch('gstMode');
  const watchedPaymentStatus = watch('paymentStatus');

  useEffect(() => {
    if (watchedPaymentStatus === 'Pending') {
      setValue('paidPercentage', 0);
    } else if (watchedPaymentStatus === 'Paid') {
      setValue('paidPercentage', 100);
    }
  }, [watchedPaymentStatus, setValue]);

  // Triggering instant GST values summary
  const totals = calculateGST(watchedItems || [], watchedGstMode || 'exclusive');

  // Auto-save form draft to LocalStorage every 3 seconds
  const isFirstDraftSave = useRef(true);
  useEffect(() => {
    // Avoid running on immediate mounting or in edit mode
    if (isEditMode) return;

    const subscription = watch((value) => {
      if (isFirstDraftSave.current) {
        isFirstDraftSave.current = false;
        return;
      }
      dispatch(saveDraft({
        ...value,
        terms,
        companySnapshot
      }));
    });
    return () => subscription.unsubscribe();
  }, [watch, terms, companySnapshot, isEditMode, dispatch]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleDiscardDraft = () => {
    dispatch(clearDraft());
    reset(defaultFormValues);
    setTerms(DEFAULT_TERMS);
    // companySnapshot will reflect default via selector
    const nextNo = selectNextInvoiceNumber(store.getState(), getTodayStr());
    setInvoiceNumber(nextNo);
    setDraftRestored(false);
    showToast('success', 'Form draft cleared successfully.');
  };

  // Terms and conditions helpers
  const handleAddTerm = () => {
    if (newTerm.trim()) {
      setTerms(prev => [...prev, newTerm.trim()]);
      setNewTerm('');
    }
  };

  const handleRemoveTerm = (index) => {
    setTerms(prev => prev.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    navigate('/history-view');
  };

const onSubmit = async (data) => {
  // validations (unchanged)
  if (data.gstin) {
    const gstinVal = data.gstin.toUpperCase().trim();
    if (!gstRegex.test(gstinVal)) {
      showToast('warn', 'Invalid GSTIN format');
      return;
    }
  }

  if (data.pan) {
    const panVal = data.pan.toUpperCase().trim();
    if (!panRegex.test(panVal)) {
      showToast('warn', 'Invalid PAN format');
      return;
    }
  }

  const payload = {
    invoiceNumber,
    customer: {
      customerName: data.customerName,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      gstin: data.gstin ? data.gstin.toUpperCase().trim() : undefined,
    },
    invoiceDate: data.invoiceDate,
    dueDate: data.dueDate,
    gstMode: data.gstMode,
    paymentStatus: data.paymentStatus,
    paidPercentage: data.paidPercentage,
    items: totals.subtotal > 0 ? data.items : [],
    subtotal: totals.subtotal,
    cgst: totals.cgst,
    sgst: totals.sgst,
    grandTotal: totals.grandTotal,
    amountInWords: totals.amountInWords,
    terms,
    company: companySnapshot
  };

  try {

    // ✅ UPDATE FLOW
    if (isEditMode && editingInvoiceSnap?._id) {
      const response = await API.put(`/updatePI/${editingInvoiceSnap._id}`, payload);

      const result = response.data;

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(result.message || "Update failed");
      }

      showToast("success", "Invoice updated successfully");

      navigate(`/preview?id=${result.data._id}`);
      return;
    }

    // ✅ CREATE FLOW
    const response = await API.post("/createPI", payload);

    const result = response.data;

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(result.message || "Create failed");
    }

    // Increment local counter so the next invoice has a new unique number
    dispatch(incrementCounter(data.invoiceDate));

    showToast("success", "Invoice created successfully");

    navigate(`/preview?id=${result.data._id}`);

  } catch (error) {
    console.error(error);
    showToast("warn", error.message);
  }
};
  return (
    <div className="max-w-5xl mx-auto space-y-6 p-10">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-55 p-4 rounded-xl shadow-lg border text-sm max-w-sm flex items-center gap-3 transition-transform ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300' 
            : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300'
        }`}>
          {toast.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          )}
          <span className="font-medium">{toast.msg}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            {isEditMode ? `Edit Proforma Invoice (${invoiceNumber})` : 'Create Proforma Invoice'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-450 mt-1">
            {isEditMode 
              ? 'Update customer details, date ranges, items lists, or localized GST computation settings.' 
              : 'Build a compliant, sequential proforma billing item. Calculations update dynamically with tax schedules.'
            }
          </p>
        </div>
        
        {draftRestored && (
          <button
            onClick={handleDiscardDraft}
            className="flex items-center gap-2 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/40 font-medium hover:cursor-pointer"
            title="Reset form and delete currently stored draft"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Clear Draft
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main left block (2 Columns wide): Core Inputs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Box 1: Customer Details */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 uppercase tracking-wider">
                Customer Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    {...register('customerName')}
                    className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                    placeholder="Full Company or Individual Name"
                  />
                  {errors.customerName && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{errors.customerName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Billing Street Address *</label>
                  <input
                    type="text"
                    {...register('address')}
                    className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                    placeholder="Floor, building, street locator name"
                  />
                  {errors.address && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">City *</label>
                    <input
                      type="text"
                      {...register('city')}
                      className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                      placeholder="e.g. Hassan"
                    />
                    {errors.city && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">State *</label>
                    <input
                      type="text"
                      {...register('state')}
                      className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                      placeholder="e.g. Karnataka"
                    />
                    {errors.state && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">{errors.state.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Pincode *</label>
                    <input
                      type="text"
                      {...register('pincode')}
                      maxLength={6}
                      className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                      placeholder="e.g. 573211"
                    />
                    {errors.pincode && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">{errors.pincode.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Customer GSTIN (Optional)</label>
                    <input
                      type="text"
                      {...register('gstin')}
                      className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium uppercase"
                      placeholder="e.g. 29AAZFD0061B1ZH"
                    />
                    {errors.gstin && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">{errors.gstin.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Service Items Table block */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Service Items</h2>
                <button
                  type="button"
                  onClick={() => append({ description: '', timeFrame: 1, timeFrameUnit: 'Months', amount: 0 })}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold border border-indigo-200 dark:border-indigo-800/40 px-3 py-1.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 hover:cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Service
                </button>
              </div>

              {errors.items && !Array.isArray(errors.items) && (
                <p className="text-xs text-rose-500 mb-3 font-medium">{errors.items.message}</p>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-3 items-start border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Description *</label>
                      <input
                        type="text"
                        {...register(`items.${index}.description`)}
                        className="w-full px-3 py-1.5 bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                        placeholder="e.g. Digital Marketing"
                      />
                      {errors.items?.[index]?.description && (
                        <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.items[index]?.description?.message}</p>
                      )}
                    </div>

                    <div className="col-span-6 md:col-span-3">
                      <select
                        {...register(`items.${index}.timeFrameUnit`)}
                        className="block w-auto bg-transparent border-none p-0 pr-6 text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 focus:ring-0 cursor-pointer"
                      >
                        <option value="Months">MONTHS *</option>
                        <option value="Quantity">SERVICE QTY *</option>
                      </select>
                      <input
                        type="number"
                        {...register(`items.${index}.timeFrame`)}
                        className="w-full px-3 py-1.5 bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                        placeholder="1"
                        min={1}
                      />
                      {errors.items?.[index]?.timeFrame && (
                        <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.items[index]?.timeFrame?.message}</p>
                      )}
                    </div>

                    <div className="col-span-5 md:col-span-2">
                      <label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        {...register(`items.${index}.amount`)}
                        className="w-full px-3 py-1.5 bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                        placeholder="0"
                        min={1}
                      />
                      {errors.items?.[index]?.amount && (
                        <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.items[index]?.amount?.message}</p>
                      )}
                    </div>

                    <div className="col-span-1 flex items-center justify-center pt-5">
                      <button
                        type="button"
                        onClick={() => {
                          if (fields.length > 1) remove(index);
                          else showToast('warn', 'You need at least 1 service item.');
                        }}
                        disabled={fields.length <= 1}
                        className="p-1.5 text-gray-400 hover:text-rose-500 disabled:opacity-30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hover:cursor-pointer"
                        title="Delete this row"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 3: Custom Terms and Conditions */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 uppercase tracking-wider">
                Terms &amp; Conditions
              </h2>
              
              <div className="space-y-3 mb-4">
                {terms.map((term, i) => (
                  <div key={i} className="flex gap-2 items-start bg-gray-50 dark:bg-gray-950 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-600 mt-0.5">{i + 1}.</span>
                    <span className="text-xs text-gray-950 dark:text-gray-300 flex-1 leading-relaxed">{term}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(i)}
                      className="text-xs text-red-600 hover:text-rose-500 font-medium hover:cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="Insert custom legal term or corporate clause..."
                  className="flex-1 px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={handleAddTerm}
                  className="px-4 py-2 bg-gray-150 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-500 dark:text-gray-200 rounded-xl text-xs font-bold select-none transition-colors hover:cursor-pointer"
                >
                  Add Clause
                </button>
              </div>
            </div>

          </div>

          {/* Right sidebar block (1 Column wide): Metadata & Calculations Summary */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Box 4: Document Metadata (Read only proforma number, dates) */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-950 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-2 uppercase tracking-wider">
                Proforma Info
              </h2>

              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-400 uppercase tracking-wider mb-1">Proforma Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono font-bold"
                  placeholder="e.g. DES/PI/0065/2026-27"
                />
                <p className="text-[10px] text-gray-800 dark:text-gray-500 mt-1 leading-normal">You can manually override the auto-generated sequential number.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-400 tracking-wider mb-1 uppercase">Invoice Date *</label>
                <input
                  type="date"
                  {...register('invoiceDate')}
                  className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono font-bold"
                />
                {errors.invoiceDate && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{errors.invoiceDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-400 tracking-wider mb-1 uppercase">Due Date *</label>
                <input
                  type="date"
                  {...register('dueDate')}
                  className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono font-bold"
                />
                {errors.dueDate && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{errors.dueDate.message}</p>
                )}
              </div>
            </div>

            {/* Box 5: Live VAT/GST Toggle Engine and Values Screen */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-2 uppercase tracking-wider">
                GST Tax Mode
              </h2>

              {/* Toggle Buttons */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-850">
                <button
                  type="button"
                  onClick={() => setValue('gstMode', 'exclusive')}
                  className={`py-2 px-3 text-[11px] font-bold rounded-lg transition-all hover:cursor-pointer ${
                    watchedGstMode === 'exclusive' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
                  }`}
                >
                  Base + GST (18%)
                </button>
                <button
                  type="button"
                  onClick={() => setValue('gstMode', 'inclusive')}
                  className={`py-2 px-3 text-[11px] font-bold rounded-lg transition-all hover:cursor-pointer ${
                    watchedGstMode === 'inclusive' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
                  }`}
                >
                  Amount Inc. GST
                </button>
                <div className="flex flex-col gap-3 py-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-800 dark:text-gray-400 uppercase tracking-wider mb-1">Payment Status</label>
                    <select
                      {...register('paymentStatus')}
                      className="w-full px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Partial">Partial</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                  {watchedPaymentStatus === 'Partial' && (
                    <div>
                      <label className="block text-[11px] font-bold text-gray-800 dark:text-gray-400 uppercase tracking-wider mb-1">Paid Percentage (%)</label>
                      <input
                        type="number"
                        {...register('paidPercentage')}
                        min={0}
                        max={100}
                        className="w-full px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                        placeholder="e.g. 45"
                      />
                    </div>
                  )}
                </div>
                <hr className="my-3 border-gray-200 dark:border-gray-800" />
              </div>

              {/* Computation card */}
              <div className="space-y-3 pt-3">
                <div className="flex justify-between text-sm font-medium text-gray-950 dark:text-gray-400">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono text-gray-900 dark:text-white font-bold">₹ {totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-700 dark:text-gray-400">
                  <span>CGST (9.0%):</span>
                  <span className="font-mono text-gray-900 dark:text-white font-bold">₹ {totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-700 dark:text-gray-400 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <span>SGST (9.0%):</span>
                  <span className="font-mono text-gray-900 dark:text-white font-bold">₹ {totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-gray-900 dark:text-white">
                  <span>Grand Total:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 text-sm font-bold">₹ {totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="mt-3 bg-indigo-50/50 dark:bg-indigo-950/15 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-900/40 text-[11px] text-indigo-800 dark:text-indigo-300 leading-normal">
                  <span className="font-bold block uppercase tracking-wider text-[9px] text-indigo-550 mb-1">Words:</span>
                  {totals.amountInWords}
                </div>
              </div>
            </div>

            {/* Actions Footer inside sidebar */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 text-center border border-gray-350 dark:border-gray-700 text-gray-950 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-xl font-bold text-xs hover:bg-gray-800 dark:hover:bg-gray-800 transition-colors hover:cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors hover:cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isEditMode ? 'Update' : 'Generate'}
              </button>
            </div>

          </div>

        </div>
      </form>
    </div>
  );
}
