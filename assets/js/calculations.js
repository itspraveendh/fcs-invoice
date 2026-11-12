/**
 * Calculation Logic & Currency Formatting Engine
 * Includes GST Calculation, Indian Numbering System Formatting,
 * Amount to Words (Indian Currency System), and Invoice Totals.
 */

const Calculations = {
  /**
   * Format numbers into Indian currency style (e.g. 1,40,053.00)
   */
  formatCurrency(amount, symbol = '₹', decimals = 2) {
    if (amount === null || amount === undefined || isNaN(amount)) {
      amount = 0;
    }
    const isNegative = amount < 0;
    const absVal = Math.abs(amount);
    
    const fixedStr = absVal.toFixed(decimals);
    const [intPart, decPart] = fixedStr.split('.');
    
    // Indian comma separation: last 3 digits, then groups of 2 digits
    let lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    
    const formatted = decimals > 0 ? `${formattedInt}.${decPart}` : formattedInt;
    return `${isNegative ? '-' : ''}${symbol ? symbol + ' ' : ''}${formatted}`;
  },

  /**
   * Format number without currency symbol
   */
  formatNumber(val, decimals = 2) {
    return this.formatCurrency(val, '', decimals);
  },

  /**
   * Round to specified decimal places with high precision
   */
  round(num, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
  },

  /**
   * Convert an amount into Indian currency words
   * e.g. 140053 => "One Lakh Forty Thousand Fifty-Three Rupees Only"
   */
  amountToWords(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'Zero Rupees Only';
    }

    const isNegative = amount < 0;
    const absVal = Math.abs(amount);
    const rupeePart = Math.floor(absVal);
    const paisePart = Math.round((absVal - rupeePart) * 100);

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertTwoDigits(n) {
      if (n < 20) return units[n];
      const t = tens[Math.floor(n / 10)];
      const u = units[n % 10];
      return u ? `${t}-${u}` : t;
    }

    function convertThreeDigits(n) {
      if (n === 0) return '';
      const h = Math.floor(n / 100);
      const rem = n % 100;
      let res = '';
      if (h > 0) {
        res += units[h] + ' Hundred';
        if (rem > 0) res += ' ' + convertTwoDigits(rem);
      } else {
        res += convertTwoDigits(rem);
      }
      return res;
    }

    if (rupeePart === 0 && paisePart === 0) {
      return 'Zero Rupees Only';
    }

    let words = '';
    let n = rupeePart;

    if (n > 0) {
      const crore = Math.floor(n / 10000000);
      n %= 10000000;
      const lakh = Math.floor(n / 100000);
      n %= 100000;
      const thousand = Math.floor(n / 1000);
      n %= 1000;
      const hundreds = n;

      const parts = [];
      if (crore > 0) parts.push(convertThreeDigits(crore) + ' Crore');
      if (lakh > 0) parts.push(convertThreeDigits(lakh) + ' Lakh');
      if (thousand > 0) parts.push(convertThreeDigits(thousand) + ' Thousand');
      if (hundreds > 0) parts.push(convertThreeDigits(hundreds));

      words = parts.join(' ').trim() + ' Rupees';
    }

    if (paisePart > 0) {
      const paiseWord = convertTwoDigits(paisePart) + ' Paise';
      if (words) {
        words += ' and ' + paiseWord;
      } else {
        words = paiseWord;
      }
    }

    return (isNegative ? 'Minus ' : '') + words + ' Only';
  },

  /**
   * Determine whether a transaction is Inter-State or Intra-State based on GST state codes
   */
  isInterState(billingFromStateCode, billingToStateCode) {
    if (!billingFromStateCode || !billingToStateCode) return false;
    const fromCode = String(billingFromStateCode).trim();
    const toCode = String(billingToStateCode).trim();
    return fromCode !== toCode;
  },

  /**
   * Recalculate a single line item
   */
  calculateLineItem(item, fromStateCode = '33', toStateCode = '33', options = {}) {
    const qty = parseFloat(item.qty) || 0;
    const ton = parseFloat(item.ton) || 0;
    const rate = parseFloat(item.rate) || 0;
    const discount = parseFloat(item.discount) || 0;

    // Excel formula: if ton exists, amount is calculated from ton*rate, else qty*rate
    let amount = 0;
    if (ton > 0) {
      amount = this.round(ton * rate, 2);
    } else {
      amount = this.round(qty * rate, 2);
    }

    const taxableValue = Math.max(0, this.round(amount - discount, 2));

    // Determine tax mode: 'auto', 'intra', 'inter', 'exempt', 'lut'
    let mode = item.taxMode || 'auto';
    if (mode === 'auto') {
      mode = this.isInterState(fromStateCode, toStateCode) ? 'inter' : 'intra';
    }

    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;

    // Check if user specified a full GST rate (e.g. 18%, 12%, 5%, 28%, 0%)
    const hasExplicitGstRate = item.gstRate !== undefined && item.gstRate !== null && !isNaN(parseFloat(item.gstRate));
    const fullGstRate = hasExplicitGstRate ? parseFloat(item.gstRate) : 18;

    if (mode === 'exempt' || mode === 'lut') {
      cgstRate = 0;
      sgstRate = 0;
      igstRate = 0;
    } else if (mode === 'intra') {
      // Intra-state: CGST + SGST (split total GST rate or take explicit rates)
      if (hasExplicitGstRate) {
        cgstRate = this.round(fullGstRate / 2, 2);
        sgstRate = this.round(fullGstRate / 2, 2);
      } else {
        const baseRate = (parseFloat(item.cgstRate) || 0) + (parseFloat(item.sgstRate) || 0);
        cgstRate = parseFloat(item.cgstRate) !== undefined && !isNaN(parseFloat(item.cgstRate)) ? parseFloat(item.cgstRate) : (baseRate > 0 ? baseRate / 2 : 9);
        sgstRate = parseFloat(item.sgstRate) !== undefined && !isNaN(parseFloat(item.sgstRate)) ? parseFloat(item.sgstRate) : (baseRate > 0 ? baseRate / 2 : 9);
      }
      igstRate = 0;
    } else {
      // Inter-state: IGST only
      if (hasExplicitGstRate) {
        igstRate = fullGstRate;
      } else {
        igstRate = parseFloat(item.igstRate) !== undefined && !isNaN(parseFloat(item.igstRate)) ? parseFloat(item.igstRate) : 18;
      }
      cgstRate = 0;
      sgstRate = 0;
    }

    const cgstAmount = this.round((taxableValue * cgstRate) / 100, 2);
    const sgstAmount = this.round((taxableValue * sgstRate) / 100, 2);
    const igstAmount = this.round((taxableValue * igstRate) / 100, 2);
    const totalTax = this.round(cgstAmount + sgstAmount + igstAmount, 2);
    const total = this.round(taxableValue + totalTax, 2);

    return {
      ...item,
      qty,
      ton,
      rate,
      amount,
      discount,
      taxableValue,
      taxMode: mode,
      gstRate: mode === 'inter' ? igstRate : (cgstRate + sgstRate),
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalTax,
      total
    };
  },

  /**
   * Recalculate complete invoice totals
   */
  calculateTotals(items = [], options = {}) {
    let subtotal = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let totalTon = 0;
    let totalQty = 0;

    const computedItems = items.map(it => {
      const computed = this.calculateLineItem(it, options.fromStateCode, options.toStateCode, options);
      subtotal += computed.amount;
      totalDiscount += computed.discount;
      taxableAmount += computed.taxableValue;
      cgstTotal += computed.cgstAmount;
      sgstTotal += computed.sgstAmount;
      igstTotal += computed.igstAmount;
      totalTon += computed.ton || 0;
      totalQty += computed.qty || 0;
      return computed;
    });

    subtotal = this.round(subtotal, 2);
    totalDiscount = this.round(totalDiscount, 2);
    taxableAmount = this.round(taxableAmount, 2);
    cgstTotal = this.round(cgstTotal, 2);
    sgstTotal = this.round(sgstTotal, 2);
    igstTotal = this.round(igstTotal, 2);
    const totalTax = this.round(cgstTotal + sgstTotal + igstTotal, 2);

    const additionalCharges = parseFloat(options.additionalCharges) || 0;
    const unroundedGrandTotal = taxableAmount + totalTax + additionalCharges;

    let roundOff = 0;
    let grandTotal = unroundedGrandTotal;

    if (options.enableRoundOff !== false) {
      grandTotal = Math.round(unroundedGrandTotal);
      roundOff = this.round(grandTotal - unroundedGrandTotal, 2);
    } else {
      grandTotal = this.round(unroundedGrandTotal, 2);
      roundOff = 0;
    }

    const amountPaid = parseFloat(options.amountPaid) || 0;
    const balanceDue = Math.max(0, this.round(grandTotal - amountPaid, 2));
    const amountInWords = this.amountToWords(grandTotal);

    // Determine representative tax rates for summary banners
    const activeIgstItem = computedItems.find(it => it.igstRate > 0);
    const effectiveIgstRate = activeIgstItem ? activeIgstItem.igstRate : (computedItems[0]?.gstRate || 18);
    const activeCgstItem = computedItems.find(it => it.cgstRate > 0);
    const effectiveCgstRate = activeCgstItem ? activeCgstItem.cgstRate : (computedItems[0]?.gstRate ? this.round(computedItems[0].gstRate / 2, 2) : 9);
    const effectiveSgstRate = activeCgstItem ? activeCgstItem.sgstRate : (computedItems[0]?.gstRate ? this.round(computedItems[0].gstRate / 2, 2) : 9);

    return {
      items: computedItems,
      subtotal,
      totalDiscount,
      taxableAmount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      totalTax,
      effectiveIgstRate,
      effectiveCgstRate,
      effectiveSgstRate,
      totalTon: this.round(totalTon, 2),
      totalQty: this.round(totalQty, 2),
      additionalCharges,
      roundOff,
      grandTotal,
      amountPaid,
      balanceDue,
      amountInWords
    };
  },

  /**
   * Format dates to DD-MM-YYYY (or YYYY-MM-DD)
   */
  formatDate(dateInput, format = 'DD-MM-YYYY') {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    if (format === 'DD-MM-YYYY') return `${day}-${month}-${year}`;
    if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
    if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
    if (format === 'MMM DD, YYYY') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[d.getMonth()]} ${day}, ${year}`;
    }
    return `${day}-${month}-${year}`;
  },

  /**
   * Generate next invoice number based on format and prefix
   * e.g. "FSE-2026-27-007"
   */
  generateInvoiceNumber(prefix = 'FSE', financialYear = '2026-27', serialNum = 1, padLength = 3) {
    const padded = String(serialNum).padStart(padLength, '0');
    return `${prefix}-${financialYear}-${padded}`;
  }
};

(typeof window !== 'undefined' ? window : global).Calculations = Calculations;
if (typeof global !== 'undefined') {
  global.Calculations = Calculations;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Calculations;
}
