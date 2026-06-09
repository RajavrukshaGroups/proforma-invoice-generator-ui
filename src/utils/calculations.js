/**
 * Convert number to Indian Rupees in words
 */
export function numberToWords(num) {
  if (num === 0) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teenDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const doubleDigits = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n) => {
    let str = '';
    if (n >= 100) {
      str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 10 && n < 20) {
      str += teenDigits[n - 10] + ' ';
    } else {
      if (n >= 20) {
        str += doubleDigits[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += singleDigits[n] + ' ';
      }
    }
    return str.trim();
  };

  // Split integer and decimal parts
  const mainPart = Math.floor(num);
  const decimalPart = Math.round((num - mainPart) * 100);

  let words = '';

  if (mainPart > 0) {
    let remaining = mainPart;
    const segments = [
      { divisor: 10000000, label: 'Crore' },
      { divisor: 100000, label: 'Lakh' },
      { divisor: 1000, label: 'Thousand' },
      { divisor: 1, label: '' }
    ];

    for (const segment of segments) {
      if (remaining >= segment.divisor) {
        const amt = Math.floor(remaining / segment.divisor);
        remaining %= segment.divisor;
        if (amt > 0) {
          words += convertLessThanOneThousand(amt) + ' ' + segment.label + ' ';
        }
      }
    }
    words = 'Rupees ' + words.trim();
  } else {
    words = 'Rupees Zero';
  }

  if (decimalPart > 0) {
    words += ' and ' + convertLessThanOneThousand(decimalPart) + ' Paise';
  }

  return words.trim() + ' Only';
}

/**
 * Calculates GST based on mode and list of service items.
 */
export function calculateGST(
  items,
  gstMode // 'exclusive' | 'inclusive'
) {
  const totalRawAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let grandTotal = 0;

  if (gstMode === 'exclusive') {
    // Base Amount + GST
    subtotal = totalRawAmount;
    cgst = subtotal * 0.09;
    sgst = subtotal * 0.09;
    grandTotal = subtotal + cgst + sgst;
  } else {
    // Amount Includes GST
    grandTotal = totalRawAmount;
    subtotal = grandTotal / 1.18;
    cgst = subtotal * 0.09;
    sgst = subtotal * 0.09;
    
    // Ensure accurate subtotal + CGST + SGST matches grand total exactly due to divisions
    const calculatedSum = subtotal + cgst + sgst;
    if (Math.abs(calculatedSum - grandTotal) > 0.001) {
      subtotal = grandTotal - (cgst + sgst);
    }
  }

  // Precision rounding
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const roundedCgst = Math.round(cgst * 100) / 100;
  const roundedSgst = Math.round(sgst * 100) / 100;
  const roundedGrandTotal = Math.round(grandTotal * 100) / 100;

  return {
    subtotal: roundedSubtotal,
    cgst: roundedCgst,
    sgst: roundedSgst,
    grandTotal: roundedGrandTotal,
    amountInWords: numberToWords(roundedGrandTotal)
  };
}
