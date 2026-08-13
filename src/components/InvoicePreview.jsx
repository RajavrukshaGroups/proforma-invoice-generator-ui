import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  Globe,
  Home,
  Mail,
  Phone,
  Printer,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { downloadPDF, triggerPrint } from "../utils/pdfGenerator";
import API from "../api/axios";

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const FallbackLogo = () => (
  <div className="flex items-center gap-2">
    <img
      // src="https://res.cloudinary.com/dxdgk4v3t/image/upload/v1781084316/DES_LOGO4.bd62bce8_ggsd9h.png"
      src="https://res.cloudinary.com/dxdgk4v3t/image/upload/v1786604770/DES_NEW_LOGO_l2fisv.png"
      className="h-[58px] w-auto object-contain"
      alt="Digital Elite Service"
    />
  </div>
);

const formatIndianCurrency = (num) => {
  const value = Number(num || 0);

  return (
    "₹ " +
    value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

const formatDateString = (dateStr) => {
  if (!dateStr) return "";

  const dateOnly = String(dateStr).split("T")[0];
  const parts = dateOnly.split("-");

  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return dateStr;
};

/* -------------------------------------------------------------------------- */
/*                              INVOICE PREVIEW                               */
/* -------------------------------------------------------------------------- */

export default function InvoicePreview({
  invoice: propInvoice,
  onBack: propOnBack,
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(propInvoice);
  const [downloading, setDownloading] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  const containerRef = useRef(null);

  const idFromQuery = searchParams.get("id");

  /* ------------------------------------------------------------------------ */
  /*                            RESPONSIVE A4 SCALE                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let animationFrameId;

    const handleResize = () => {
      if (!containerRef.current || !containerRef.current.parentElement) return;

      const parentWidth =
        containerRef.current.parentElement.getBoundingClientRect().width;

      const isMobile = window.innerWidth < 640;
      const containerPadding = isMobile ? 24 : 64;

      const availableWidth = parentWidth - containerPadding;

      if (availableWidth > 0 && availableWidth < 794) {
        setZoomScale(availableWidth / 794);
      } else {
        setZoomScale(1);
      }
    };

    const throttledResize = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(handleResize);
    };

    throttledResize();

    const timeout = setTimeout(throttledResize, 100);

    const observer = new ResizeObserver(throttledResize);

    if (containerRef.current?.parentElement) {
      observer.observe(containerRef.current.parentElement);
    }

    window.addEventListener("resize", throttledResize);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", throttledResize);
      observer.disconnect();

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                              FETCH INVOICE                               */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        if (propInvoice) {
          setInvoice(propInvoice);
          return;
        }

        if (!idFromQuery) {
          setInvoice(null);
          return;
        }

        const res = await API.get(`/getPI/${idFromQuery}`);

        if (res.data?.success) {
          setInvoice(res.data.data);
        } else {
          setInvoice(null);
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        setInvoice(null);
      }
    };

    fetchInvoice();
  }, [propInvoice, idFromQuery]);

  /* ------------------------------------------------------------------------ */
  /*                                  BACK                                    */
  /* ------------------------------------------------------------------------ */

  const handleBack = () => {
    if (propOnBack) {
      propOnBack();
      return;
    }

    navigate("/history-view");
  };

  if (!invoice) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="mb-2 text-sm font-semibold text-gray-500">
          Selected invoice not found.
        </p>

        <button
          onClick={handleBack}
          className="text-xs font-bold text-indigo-600 hover:underline"
        >
          Return to History Ledger
        </button>
      </div>
    );
  }

  const printableAreaId = `printable-proforma-invoice-${
    invoice.id || invoice._id || "invoice"
  }`;

  /* ------------------------------------------------------------------------ */
  /*                              DOWNLOAD PDF                                */
  /* ------------------------------------------------------------------------ */

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const customerName = invoice?.customer?.customerName || "Customer";

      const safeFilename = `${customerName} - Proforma Invoice`;

      await downloadPDF(printableAreaId, safeFilename);
    } catch (error) {
      console.error("Download Error:", error);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to generate PDF",
      );
    } finally {
      setDownloading(false);
    }
  };

  const company = invoice.company || {};
  const customer = invoice.customer || {};
  const items = invoice.items || [];
  const terms = invoice.terms || [];

  /* ------------------------------------------------------------------------ */
  /*                                  UI                                      */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="invoice-page-root w-full max-w-full space-y-4 overflow-x-hidden p-4 sm:space-y-6 sm:p-10 print:m-0 print:p-0">
      {/* ================================================================ */}
      {/* ACTION BAR                                                      */}
      {/* ================================================================ */}
      <div className="no-print flex flex-col justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center dark:border-gray-800">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() =>
              triggerPrint(
                printableAreaId,
                `${customer.customerName || "Customer"} - Proforma Invoice`,
              )
            }
            className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            Print Proforma
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />

            {downloading ? "Rendering PDF..." : "Download PDF"}
          </button>
        </div>
      </div>
      {/* ================================================================ */}
      {/* PREVIEW CONTAINER                                                */}
      {/* ================================================================ */}
      <div
        ref={containerRef}
        className="print-reset-container flex min-h-[600px] w-full justify-center overflow-x-auto rounded-2xl bg-slate-100 p-2 shadow-inner sm:p-8 print:m-0 print:bg-white print:p-0 print:shadow-none"
      >
        <div
          className="print-reset-wrapper relative"
          style={{
            width: `${794 * zoomScale}px`,
            height: `${1123 * zoomScale}px`,
          }}
        >
          <div
            className="print-reset-scale absolute left-0 top-0"
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: "top left",
            }}
          >
            {/* ========================================================== */}
            {/* EXACT A4 INVOICE                                           */}
            {/* ========================================================== */}

            <div
              id={printableAreaId}
              className="printable-invoice-area relative overflow-hidden bg-white text-black shadow-2xl print:shadow-none"
              style={{
                width: "794px",
                height: "1123px",
                boxSizing: "border-box",
                fontFamily: '"Times New Roman", Times, serif',
                fontSize: "12px",
                lineHeight: 1.18,
              }}
            >
              {/* ======================================================== */}
              {/* ORANGE TOP DECORATION                                   */}
              {/* ======================================================== */}

              <div
                className="absolute left-0 top-0 bg-[#f9a10b]"
                style={{
                  width: "100%",
                  height: "26px",
                }}
              />

              <div
                className="absolute right-0 top-0 bg-[#f9a10b]"
                style={{
                  width: "28px",
                  height: "236px",
                  borderBottomLeftRadius: "28px",
                }}
              />

              {/* ======================================================== */}
              {/* BLUE BOTTOM DECORATION                                  */}
              {/* ======================================================== */}

              <div
                className="absolute bottom-0 left-0 bg-[#3989e9]"
                style={{
                  width: "100%",
                  height: "22px",
                }}
              />

              <div
                className="absolute bottom-0 left-0 bg-[#3989e9]"
                style={{
                  width: "34px",
                  height: "200px",
                  borderTopRightRadius: "34px",
                }}
              />
              {/* ======================================================== */}
              {/* SIDE GUIDE LINES                                        */}
              {/* ======================================================== */}

              <div
                className="absolute"
                style={{
                  right: "26px",
                  top: "417px",
                  height: "69px",
                  width: "1px",
                  background: "#111",
                }}
              >
                <span
                  className="absolute rounded-full bg-black"
                  style={{
                    width: "8px",
                    height: "8px",
                    left: "-3.5px",
                    top: "-2px",
                  }}
                />
              </div>

              <div
                className="absolute"
                style={{
                  right: "26px",
                  top: "514px",
                  height: "479px",
                  width: "1px",
                  background: "#111",
                }}
              >
                <span
                  className="absolute rounded-full bg-black"
                  style={{
                    width: "8px",
                    height: "8px",
                    left: "-3.5px",
                    top: "-2px",
                  }}
                />
              </div>

              <div
                className="absolute"
                style={{
                  left: "19px",
                  top: "691px",
                  height: "184px",
                  width: "1px",
                  background: "#111",
                }}
              >
                <span
                  className="absolute rounded-full bg-black"
                  style={{
                    width: "8px",
                    height: "8px",
                    left: "-3.5px",
                    bottom: "-2px",
                  }}
                />
              </div>

              {/* ======================================================== */}
              {/* PAGE CONTENT                                            */}
              {/* ======================================================== */}

              <div
                className="relative flex h-full flex-col"
                style={{
                  padding: "39px 37px 32px 37px",
                }}
              >
                {/* ====================================================== */}
                {/* LOGO HEADER                                           */}
                {/* ====================================================== */}

                {/* ====================================================== */}
                {/* LOGO HEADER                                           */}
                {/* ====================================================== */}

                <div
                  className="flex items-center"
                  style={{
                    height: "110px",
                  }}
                >
                  <div className="flex items-center">
                    {company.companyLogo ? (
                      <img
                        src={company.companyLogo}
                        alt={company.companyName || "Company"}
                        referrerPolicy="no-referrer"
                        style={{
                          width: "180px",
                          height: "90px",
                          objectFit: "contain",
                          objectPosition: "left center",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <img
                        src="https://res.cloudinary.com/dxdgk4v3t/image/upload/v1786604770/DES_NEW_LOGO_l2fisv.png"
                        alt="Logo"
                        style={{
                          width: "180px",
                          height: "90px",
                          objectFit: "contain",
                          objectPosition: "left center",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                </div>
                {/* Header horizontal divider */}

                <div
                  style={{
                    borderTop: "1px solid #444",
                  }}
                />

                {/* Controlled spacing between divider and invoice title */}

                <div style={{ height: "72px" }} />

                {/* ====================================================== */}
                {/* PROFORMA TITLE                                        */}
                {/* ====================================================== */}

                <div
                  className="flex items-center justify-center"
                  style={{
                    height: "44px",
                    border: "1px solid #111",
                    background: "#f5f5f5",
                  }}
                >
                  <span
                    style={{
                      fontSize: "23px",
                      fontWeight: 700,
                    }}
                  >
                    PROFORMA INVOICE
                  </span>
                </div>

                {/* ====================================================== */}
                {/* CUSTOMER / INVOICE DETAILS                            */}
                {/* ====================================================== */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "52% 48%",
                    minHeight: "162px",
                    borderLeft: "1px solid #111",
                    borderRight: "1px solid #111",
                    boxSizing: "border-box",
                  }}
                >
                  {/* ================= LEFT : CUSTOMER ================= */}

                  <div
                    style={{
                      padding: "22px 18px 12px 14px",
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "12px",
                        lineHeight: 1.2,
                      }}
                    >
                      BILL TO
                    </div>

                    <div
                      style={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        marginTop: "3px",
                        fontSize: "12px",
                        lineHeight: 1.2,
                      }}
                    >
                      {customer.customerName || ""}
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        maxWidth: "330px",
                        fontSize: "12px",
                        lineHeight: 1.35,
                      }}
                    >
                      {customer.address && (
                        <>
                          {customer.address}
                          {customer.city ? `, ${customer.city}` : ""}
                          {customer.state ? `, ${customer.state}` : ""}
                          {customer.pincode ? `, ${customer.pincode}` : ""}
                        </>
                      )}
                    </div>

                    {/* Push GSTIN toward bottom while keeping consistent spacing */}

                    {customer.gstin && (
                      <div
                        style={{
                          marginTop: "auto",
                          paddingTop: "20px",
                          fontSize: "12px",
                          lineHeight: 1.2,
                        }}
                      >
                        <strong>GSTIN:</strong> {customer.gstin}
                      </div>
                    )}
                  </div>

                  {/* ================= RIGHT : INVOICE INFO ================= */}

                  <div
                    style={{
                      padding: "22px 14px 12px 22px",
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                      fontSize: "12px",
                    }}
                  >
                    {company.gstin && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "82px 1fr",
                          alignItems: "baseline",
                          lineHeight: 1.25,
                        }}
                      >
                        <strong>GSTIN:</strong>
                        <span>{company.gstin}</span>
                      </div>
                    )}

                    {company.pan && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "82px 1fr",
                          alignItems: "baseline",
                          marginTop: "4px",
                          lineHeight: 1.25,
                        }}
                      >
                        <strong>PAN:</strong>
                        <span>{company.pan}</span>
                      </div>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "82px 1fr",
                        alignItems: "baseline",
                        marginTop: "4px",
                        lineHeight: 1.25,
                      }}
                    >
                      <strong>Proforma No:</strong>
                      <span>{invoice.invoiceNumber}</span>
                    </div>

                    {/* Controlled space between invoice identifiers and dates */}

                    <div style={{ height: "34px" }} />

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "82px 1fr",
                        alignItems: "baseline",
                        lineHeight: 1.25,
                      }}
                    >
                      <strong>Date:</strong>
                      <span>{formatDateString(invoice.invoiceDate)}</span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "82px 1fr",
                        alignItems: "baseline",
                        marginTop: "5px",
                        lineHeight: 1.25,
                      }}
                    >
                      <strong>Due Date:</strong>
                      <span>{formatDateString(invoice.dueDate)}</span>
                    </div>
                  </div>
                </div>

                {/* ====================================================== */}
                {/* SERVICE + BANK + TOTALS — SINGLE ALIGNED TABLE         */}
                {/* ====================================================== */}

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    tableLayout: "fixed",
                    fontSize: "12px",
                    color: "#000",
                  }}
                >
                  {/*
    IMPORTANT:
    These same 3 columns are used by EVERYTHING below.

    41% = Description / Bank Details
    12% = Time Frame / Total labels
    47% = Amount / Total values

    Because this is ONE table, every vertical line will always align.
  */}
                  <colgroup>
                    <col style={{ width: "41%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "47%" }} />
                  </colgroup>

                  {/* ==================================================== */}
                  {/* SERVICE HEADER                                       */}
                  {/* ==================================================== */}

                  <thead>
                    <tr
                      style={{
                        height: "49px",
                        background: "#f3f3f3",
                      }}
                    >
                      <th
                        style={{
                          border: "1px solid #111",
                          padding: "7px 10px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          fontWeight: 700,
                          fontSize: "12px",
                        }}
                      >
                        DESCRIPTION
                      </th>

                      <th
                        style={{
                          border: "1px solid #111",
                          padding: "5px 4px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          fontWeight: 700,
                          fontSize: "12px",
                          lineHeight: 1.1,
                        }}
                      >
                        Time Frame
                        <br />
                        in months
                      </th>

                      <th
                        style={{
                          border: "1px solid #111",
                          padding: "7px 10px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          fontWeight: 700,
                          fontSize: "12px",
                        }}
                      >
                        AMOUNT
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {/* ================================================== */}
                    {/* SERVICE CONTENT                                    */}
                    {/* ================================================== */}

                    <tr>
                      {/* DESCRIPTION */}

                      <td
                        style={{
                          border: "1px solid #111",
                          padding: 0,
                          verticalAlign: "middle",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px 0",
                          }}
                        >
                          {items.length > 0 ? (
                            items.map((item, index) => (
                              <div
                                key={item.id || item._id || index}
                                style={{
                                  minHeight: "24px",
                                  padding: "4px 10px",
                                  boxSizing: "border-box",
                                  display: "flex",
                                  alignItems: "center",
                                  fontWeight: 700,
                                  lineHeight: 1.25,

                                  // alternate shading like original
                                  background:
                                    index % 2 === 0 ? "#f3f3f3" : "#ffffff",

                                  // long description wraps naturally
                                  overflowWrap: "break-word",
                                  wordBreak: "normal",
                                }}
                              >
                                <span
                                  style={{
                                    flexShrink: 0,
                                    marginRight: "4px",
                                  }}
                                >
                                  {index + 1}.
                                </span>

                                <span>{item.description}</span>
                              </div>
                            ))
                          ) : (
                            <div
                              style={{
                                padding: "12px 10px",
                              }}
                            >
                              No services added.
                            </div>
                          )}
                        </div>
                      </td>

                      {/* TIME FRAME */}

                      <td
                        style={{
                          border: "1px solid #111",
                          padding: "12px 6px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          fontSize: "13px",
                        }}
                      >
                        {items?.[0]?.timeFrame ?? ""}
                      </td>

                      {/* AMOUNT */}

                      <td
                        style={{
                          border: "1px solid #111",
                          padding: "12px 12px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          fontSize: "13px",
                        }}
                      >
                        {formatIndianCurrency(invoice.subtotal)}
                      </td>
                    </tr>

                    {/* ================================================== */}
                    {/* BANK DETAILS + SUB TOTAL                           */}
                    {/* ================================================== */}

                    <tr>
                      <td
                        style={{
                          border: "1px solid #111",
                          padding: "8px 10px",
                          fontWeight: 700,
                          fontSize: "13px",
                          verticalAlign: "middle",
                        }}
                      >
                        BANK DETAILS
                      </td>

                      <td
                        style={{
                          border: "1px solid #111",
                          padding: "6px 10px",
                          verticalAlign: "middle",
                          fontSize: "12px",
                        }}
                      >
                        Sub Total
                      </td>

                      <td
                        style={{
                          border: "1px solid #111",
                          padding: "6px 12px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          fontSize: "12px",
                        }}
                      >
                        {formatIndianCurrency(invoice.subtotal)}
                      </td>
                    </tr>

                    {/* ================================================== */}
                    {/* BANK DETAILS BODY + TAX BREAKDOWN                  */}
                    {/* ================================================== */}

                    <tr>
                      {/*
        This ONE bank-details cell spans:
          CGST
          SGST
          TOTAL
          Amount in words

        That reproduces the original invoice structure.
      */}

                      <td
                        rowSpan={4}
                        style={{
                          border: "1px solid #111",
                          padding: "7px 10px",
                          verticalAlign: "top",
                          fontWeight: 700,
                          fontSize: "12px",
                          lineHeight: 1.45,
                        }}
                      >
                        <div>
                          <strong>A/c Name - </strong>
                          {company.companyName || "---"}
                        </div>

                        <div>
                          <strong>A/C No - </strong>
                          {company.accountNumber || "---"}
                        </div>

                        <div>
                          <strong>Bank Name - </strong>
                          {company.bankName || "---"}
                        </div>

                        <div>
                          <strong>IFSC Code - </strong>
                          {company.ifscCode || "---"}
                        </div>

                        <div>
                          <strong>Branch - </strong>
                          {company.branch || "---"}
                        </div>
                      </td>

                      {/* CGST */}

                      <td
                        style={{
                          border: "1px solid #111",
                          padding: "5px 10px",
                          verticalAlign: "middle",
                        }}
                      >
                        CGST (9%)
                      </td>

                      <td
                        style={{
                          border: "1px solid #111",
                          padding: "5px 12px",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        {formatIndianCurrency(invoice.cgst)}
                      </td>
                    </tr>

                    {/* ================================================== */}
                    {/* SGST                                               */}
                    {/* ================================================== */}

                    <tr>
                      <td
                        style={{
                          border: "1px solid #111",
                          padding: "5px 10px",
                          verticalAlign: "middle",
                        }}
                      >
                        SGST (9%)
                      </td>

                      <td
                        style={{
                          border: "1px solid #111",
                          padding: "5px 12px",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        {formatIndianCurrency(invoice.sgst)}
                      </td>
                    </tr>

                    {/* ================================================== */}
                    {/* TOTAL                                              */}
                    {/* ================================================== */}

                    <tr>
                      <td
                        style={{
                          border: "1px solid #111",
                          padding: "6px 10px",
                          verticalAlign: "middle",
                          fontWeight: 700,
                        }}
                      >
                        TOTAL
                      </td>

                      <td
                        style={{
                          border: "1px solid #111",
                          padding: "6px 12px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          fontWeight: 700,
                        }}
                      >
                        {formatIndianCurrency(invoice.grandTotal)}
                      </td>
                    </tr>

                    {/* ================================================== */}
                    {/* AMOUNT IN WORDS                                    */}
                    {/* ================================================== */}

                    <tr>
                      <td
                        colSpan={2}
                        style={{
                          border: "1px solid #111",
                          height: "52px",
                          padding: "8px 16px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          fontWeight: 700,
                          fontSize: "12px",
                          lineHeight: 1.3,
                        }}
                      >
                        {invoice.amountInWords}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {/* ====================================================== */}
                {/* TERMS AND CONDITIONS                                  */}
                {/* ====================================================== */}

                <div
                  style={{
                    borderLeft: "1px solid #111",
                    borderRight: "1px solid #111",
                    borderBottom: "1px solid #111",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Heading */}
                  <div
                    style={{
                      minHeight: "34px",
                      borderBottom: "1px solid #111",
                      display: "flex",
                      alignItems: "center",
                      padding: "7px 10px",
                      boxSizing: "border-box",
                      fontSize: "13px",
                      fontWeight: 700,
                      lineHeight: 1.2,
                    }}
                  >
                    Terms and Conditions:-
                  </div>

                  {/* Dynamic Terms */}
                  <div>
                    {terms.length > 0 ? (
                      terms.map((term, index) => (
                        <div
                          key={index}
                          style={{
                            minHeight: "36px",
                            borderBottom:
                              index === terms.length - 1
                                ? "none"
                                : "1px solid #111",
                            display: "flex",
                            alignItems: "center",
                            padding: "8px 10px",
                            boxSizing: "border-box",
                            fontSize: "12px",
                            lineHeight: 1.35,
                            overflowWrap: "break-word",
                            wordBreak: "normal",
                          }}
                        >
                          <span
                            style={{
                              flexShrink: 0,
                              marginRight: "5px",
                              alignSelf: "flex-start",
                            }}
                          >
                            {index + 1}.
                          </span>

                          <span>{term}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div
                          style={{
                            minHeight: "36px",
                            borderBottom: "1px solid #111",
                            display: "flex",
                            alignItems: "center",
                            padding: "8px 10px",
                            boxSizing: "border-box",
                            fontSize: "12px",
                            lineHeight: 1.35,
                          }}
                        >
                          <span style={{ marginRight: "5px" }}>1.</span>
                          <span>
                            Services will be provided as per the agreed scope.
                          </span>
                        </div>

                        <div
                          style={{
                            minHeight: "36px",
                            borderBottom: "1px solid #111",
                            display: "flex",
                            alignItems: "center",
                            padding: "8px 10px",
                            boxSizing: "border-box",
                            fontSize: "12px",
                            lineHeight: 1.35,
                          }}
                        >
                          <span style={{ marginRight: "5px" }}>2.</span>
                          <span>
                            Payment must be made as per agreed terms to continue
                            services.
                          </span>
                        </div>

                        <div
                          style={{
                            minHeight: "36px",
                            borderBottom: "1px solid #111",
                            display: "flex",
                            alignItems: "center",
                            padding: "8px 10px",
                            boxSizing: "border-box",
                            fontSize: "12px",
                            lineHeight: 1.35,
                          }}
                        >
                          <span style={{ marginRight: "5px" }}>3.</span>
                          <span>
                            Any additional work will be charged separately.
                          </span>
                        </div>

                        <div
                          style={{
                            minHeight: "36px",
                            display: "flex",
                            alignItems: "center",
                            padding: "8px 10px",
                            boxSizing: "border-box",
                            fontSize: "12px",
                            lineHeight: 1.35,
                          }}
                        >
                          <span style={{ marginRight: "5px" }}>4.</span>
                          <span>
                            Client is responsible for providing timely inputs
                            and approvals.
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ====================================================== */}
                {/* QUESTION CONTACT                                      */}
                {/* ====================================================== */}

                <div
                  style={{
                    minHeight: "40px",
                    borderLeft: "1px solid #111",
                    borderRight: "1px solid #111",
                    borderBottom: "1px solid #111",
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 10px",
                    boxSizing: "border-box",
                    fontSize: "12px",
                    lineHeight: 1.3,
                  }}
                >
                  <span>
                    If you have any questions about this proforma, please
                    contact{" "}
                    <strong>{company.phone || "+91 63669 30178"}</strong>
                  </span>
                </div>

                {/* ====================================================== */}
                {/* THANK YOU                                             */}
                {/* ====================================================== */}

                <div
                  style={{
                    minHeight: "32px",
                    borderLeft: "1px solid #111",
                    borderRight: "1px solid #111",
                    borderBottom: "1px solid #111",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "5px 10px",
                    boxSizing: "border-box",
                    fontWeight: 700,
                    fontStyle: "italic",
                    fontSize: "13px",
                    lineHeight: 1.2,
                  }}
                >
                  Thank You For Your Business!
                </div>

                {/* ====================================================== */}
                {/* FLEX SPACE TO PUSH FOOTER DOWN                        */}
                {/* ====================================================== */}

                <div className="flex-1" />

                {/* ====================================================== */}
                {/* FOOTER                                                */}
                {/* ====================================================== */}

                <div
                  // style={{
                  //   minHeight: "96px",
                  //   padding: "0 28px 16px 28px",
                  //   boxSizing: "border-box",
                  //   fontFamily: "Arial, Helvetica, sans-serif",
                  //   display: "grid",
                  //   gridTemplateColumns: "62% 38%",
                  //   alignItems: "center",
                  //   // columnGap: "18px",
                  //   columnGap: "90px",
                  // }}
                  style={{
                    minHeight: "96px",
                    padding: "0 28px 16px 28px",
                    boxSizing: "border-box",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    display: "grid",
                    gridTemplateColumns: "60% 40%",
                    alignItems: "center",
                    columnGap: "90px",
                  }}
                >
                  {/* ================= LEFT : ADDRESS ================= */}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      minWidth: 0,
                      marginTop: "1rem",
                    }}
                  >
                    <Home
                      strokeWidth={3.2}
                      style={{
                        width: "38px",
                        height: "38px",
                        color: "#000",
                        flexShrink: 0,
                      }}
                    />

                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        lineHeight: 1.45,
                        color: "#000",
                        maxWidth: "430px",
                      }}
                    >
                      <div>
                        1st Floor, Sathya Heritage, #2574, 8th Cross, 13th Main,
                      </div>

                      <div>
                        E-Block, Sahakarnagar, Bengaluru, Karnataka 560092
                      </div>
                    </div>
                  </div>

                  {/* ================= RIGHT : CONTACTS ================= */}

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: "7px",
                      fontSize: "11px",
                      fontWeight: 700,
                      lineHeight: 1.2,
                      color: "#000",
                      paddingLeft: "12px",
                    }}
                  >
                    {/* PHONE */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "22px 1fr",
                        alignItems: "center",
                        columnGap: "8px",
                      }}
                    >
                      <Phone
                        strokeWidth={3}
                        style={{
                          width: "17px",
                          height: "17px",
                          color: "#000",
                        }}
                      />

                      <span>+91 99000 09487</span>
                    </div>

                    {/* EMAIL */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "22px 1fr",
                        alignItems: "center",
                        columnGap: "8px",
                      }}
                    >
                      <Mail
                        strokeWidth={2.8}
                        style={{
                          width: "17px",
                          height: "17px",
                          color: "#000",
                        }}
                      />

                      <span>
                        {company.email || "info@digitaleliteservices.in"}
                      </span>
                    </div>

                    {/* WEBSITE */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "22px 1fr",
                        alignItems: "center",
                        columnGap: "8px",
                      }}
                    >
                      <Globe
                        strokeWidth={2.5}
                        style={{
                          width: "17px",
                          height: "17px",
                          color: "#000",
                        }}
                      />

                      <span>
                        {company.website || "www.digitaleliteservices.in"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
