/**
 * Excel Export Module (.xlsx)
 * Generates an editable XLSX spreadsheet matching the original template structure:
 * "FSE-2026-27-XXX- SAMPLE - XX-XX-XXXX.xlsx"
 * 
 * Features:
 * - Direct utilization of the original binary template base64
 * - 100% preservation of merged cells, styles, fills (#4BD0FF, #FFFF00, #D9D9D9), fonts, and drawings
 * - Dynamic row expansion for arbitrary item counts (> 8 rows) with formula & merge shifting
 * - Authentic live Excel formulas (SUM, multiplication, tax calculations)
 */

const ExportExcel = {
  /**
   * Export an invoice to an editable XLSX file
   */
  export(invoice) {
    if (!invoice) {
      alert('No invoice to export');
      return;
    }

    if (typeof XLSX === 'undefined') {
      alert('SheetJS (XLSX) library is still loading or not available. Please wait a moment and try again.');
      return;
    }

    const ds = (typeof window !== 'undefined' ? window.DataStore : null) || (typeof DataStore !== 'undefined' ? DataStore : null);
    const company = invoice.company || (ds ? ds.getCompany() : {});
    const client = invoice.client || {};
    const bank = (ds && ds.getBankAccount(invoice.bankAccountId)) || (ds && ds.getBankAccounts()[0]) || {};
    const totals = Calculations.calculateTotals(invoice.items || [], {
      fromStateCode: company.stateCode || '33',
      toStateCode: client.stateCode || '33',
      enableRoundOff: invoice.enableRoundOff !== false,
      additionalCharges: invoice.additionalCharges || 0,
      amountPaid: invoice.amountPaid || 0
    });

    const filename = `${invoice.invoiceNo || 'Invoice'}.xlsx`;

    // Try modifying the original binary template if available
    const templateB64 = (typeof window !== 'undefined' ? window.EXCEL_TEMPLATE_BASE64 : (typeof global !== 'undefined' ? global.EXCEL_TEMPLATE_BASE64 : null));

    if (templateB64) {
      try {
        const wb = XLSX.read(templateB64, { type: 'base64', cellStyles: true });
        const ws = wb.Sheets['GST Tax Invoice Format'] || wb.Sheets[wb.SheetNames[0]];

        if (ws) {
          // Helper to set cell value while keeping existing style if present
          const updateCell = (ref, val, type = 's', formula = null) => {
            if (!ws[ref]) ws[ref] = {};
            ws[ref].v = val;
            ws[ref].t = type;
            if (formula) {
              ws[ref].f = formula;
            } else {
              delete ws[ref].f;
            }
          };

          // Company details (Header)
          updateCell('G1', company.name || 'FAB STEEL ENGINEERING SERVICES');
          updateCell('G2', `${company.city || 'Salem'} ${company.state || 'Tamil Nadu'} PIN: ${company.pin || '636453'}`);
          updateCell('G3', `Phone: ${company.phone || '+91 8300621360'}`);
          updateCell('G4', `GSTIN:-${company.gstin || '33BLBPJ7865F1Z3'}`);

          // Document title
          updateCell('A6', invoice.invoiceType || 'Tax Invoice');
          updateCell('A8', invoice.copyType || 'Original for Recipient');

          // Metadata Grid (Rows 9-12)
          updateCell('A9', `Invoice No: ${invoice.invoiceNo || ''}`);
          updateCell('A10', `Invoice date: ${Calculations.formatDate(invoice.date, 'DD-MM-YYYY')}`);
          updateCell('A11', `Reverse Charge (Y/N): ${invoice.reverseCharge || 'N'}`);
          updateCell('A12', `State: ${company.state || 'Tamil Nadu'}`);
          updateCell('H12', String(company.stateCode || '33'));

          updateCell('I9', `Purchase Order Number : ${invoice.poNumber || ''}`);
          updateCell('I10', `Reference Number     : ${invoice.refNumber || ''}`);
          updateCell('I11', `Value of PO : ${invoice.poValue ? Calculations.formatCurrency(invoice.poValue) : ''}`);
          updateCell('I12', `Quote Reference no : ${invoice.quoteRef || 'PD-FAB-2026-27-RFQ-01'}`);

          // Billing From (Rows 15-20)
          updateCell('A15', `Name: ${company.name || ''}`);
          updateCell('A16', `Address: ${company.address || ''}`);
          updateCell('A18', `GSTIN: ${company.gstin || ''}`);
          updateCell('A19', `PAN:  ${company.pan || ''}`);
          updateCell('A20', `State: ${company.state || 'Tamil Nadu'}`);
          updateCell('H20', String(company.stateCode || '33'));

          // Billing To (Rows 15-20)
          updateCell('I15', `Name: ${client.companyName || client.name || ''}`);
          updateCell('I16', `Address: ${client.address || ''}`);
          updateCell('I18', `JOB GSTIN: ${client.gstin || ''}`);
          updateCell('I19', `JOB PAN: ${client.pan || ''}`);
          updateCell('I20', `State: ${client.state || ''}`);
          updateCell('S20', String(client.stateCode || ''));

          // DYNAMIC ROW EXPANSION FOR > 8 ITEMS
          const itemCount = totals.items.length;
          const extraRows = Math.max(0, itemCount - 8);
          const cols = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S'];

          if (extraRows > 0) {
            // Shift rows 32-49 down by extraRows in reverse order
            for (let r = 49; r >= 32; r--) {
              cols.forEach(c => {
                const oldRef = `${c}${r}`;
                const newRef = `${c}${r + extraRows}`;
                if (ws[oldRef]) {
                  ws[newRef] = ws[oldRef];
                  delete ws[oldRef];
                }
              });
            }

            // Shift merges (row 32 is 0-indexed 31)
            if (ws['!merges']) {
              ws['!merges'].forEach(m => {
                if (m.s.r >= 31) {
                  m.s.r += extraRows;
                  m.e.r += extraRows;
                }
              });

              // Add merges for each newly inserted row
              for (let i = 0; i < extraRows; i++) {
                const targetR = 31 + i; // 0-indexed
                ws['!merges'].push({ s: { r: targetR, c: 10 }, e: { r: targetR, c: 11 } }); // K:L (CGST Amt)
                ws['!merges'].push({ s: { r: targetR, c: 15 }, e: { r: targetR, c: 16 } }); // P:Q (IGST Amt)
                ws['!merges'].push({ s: { r: targetR, c: 17 }, e: { r: targetR, c: 18 } }); // R:S (Total)
              }
            }

            // Expand sheet range
            ws['!ref'] = `A1:S${49 + extraRows}`;
          }

          // Populate Line Items
          const totalItemRows = Math.max(8, itemCount);
          for (let rowIdx = 24; rowIdx <= (23 + totalItemRows); rowIdx++) {
            const itemIdx = rowIdx - 24;
            const item = totals.items[itemIdx];

            if (item) {
              updateCell(`A${rowIdx}`, item.sNo || (itemIdx + 1), 'n');
              updateCell(`B${rowIdx}`, item.description || '');
              updateCell(`C${rowIdx}`, item.hsn || '998333');
              updateCell(`D${rowIdx}`, item.qty || 1, 'n');
              updateCell(`E${rowIdx}`, item.ton || 0, 'n');
              updateCell(`F${rowIdx}`, item.rate || 0, 'n');

              const amtForm = item.ton > 0 ? `SUM(E${rowIdx}*F${rowIdx})` : `SUM(D${rowIdx}*F${rowIdx})`;
              updateCell(`G${rowIdx}`, item.amount, 'n', amtForm);
              updateCell(`H${rowIdx}`, item.discount || 0, 'n');
              updateCell(`I${rowIdx}`, item.taxableValue, 'n', `G${rowIdx}-H${rowIdx}`);

              updateCell(`J${rowIdx}`, item.cgstRate || 0, 'n');
              updateCell(`K${rowIdx}`, item.cgstAmount || 0, 'n', `G${rowIdx}*J${rowIdx}/100`);

              updateCell(`M${rowIdx}`, item.sgstRate || 0, 'n');
              updateCell(`N${rowIdx}`, item.sgstAmount || 0, 'n', `G${rowIdx}*M${rowIdx}/100`);

              updateCell(`O${rowIdx}`, item.igstRate || 0, 'n');
              updateCell(`P${rowIdx}`, item.igstAmount || 0, 'n', `I${rowIdx}*O${rowIdx}/100`);

              updateCell(`R${rowIdx}`, item.total, 'n', `I${rowIdx}+K${rowIdx}+N${rowIdx}+P${rowIdx}`);
            } else {
              // Clear empty row
              updateCell(`A${rowIdx}`, '');
              updateCell(`B${rowIdx}`, '');
              updateCell(`C${rowIdx}`, '');
              updateCell(`D${rowIdx}`, 0, 'n');
              updateCell(`E${rowIdx}`, 0, 'n');
              updateCell(`F${rowIdx}`, 0, 'n');
              updateCell(`G${rowIdx}`, 0, 'n');
              updateCell(`H${rowIdx}`, 0, 'n');
              updateCell(`I${rowIdx}`, 0, 'n');
              updateCell(`J${rowIdx}`, 0, 'n');
              updateCell(`K${rowIdx}`, 0, 'n');
              updateCell(`M${rowIdx}`, 0, 'n');
              updateCell(`N${rowIdx}`, 0, 'n');
              updateCell(`O${rowIdx}`, 0, 'n');
              updateCell(`P${rowIdx}`, 0, 'n');
              updateCell(`R${rowIdx}`, 0, 'n');
            }
          }

          const totalsRow = 32 + extraRows;
          const endItemRow = 23 + totalItemRows;

          // Totals Row
          updateCell(`E${totalsRow}`, totals.totalTon, 'n', `SUM(E24:E${endItemRow})`);
          updateCell(`G${totalsRow}`, totals.subtotal, 'n', `SUM(G24:G${endItemRow})`);
          updateCell(`H${totalsRow}`, totals.totalDiscount, 'n');
          updateCell(`I${totalsRow}`, totals.taxableAmount, 'n');
          updateCell(`K${totalsRow}`, totals.cgstTotal, 'n', `SUM(K24:L${endItemRow})`);
          updateCell(`N${totalsRow}`, totals.sgstTotal, 'n', `SUM(N24:N${endItemRow})`);
          updateCell(`P${totalsRow}`, totals.igstTotal, 'n', `SUM(P24:Q${endItemRow})`);
          updateCell(`R${totalsRow}`, totals.grandTotal, 'n', `SUM(R24:S${endItemRow})`);

          // Tax Summary & Amount in Words
          const r33 = 33 + extraRows;
          const r34 = 34 + extraRows;
          const r35 = 35 + extraRows;
          const r36 = 36 + extraRows;
          const r37 = 37 + extraRows;
          const r38 = 38 + extraRows;
          const r39 = 39 + extraRows;

          updateCell(`R${r33}`, totals.taxableAmount, 'n', `I${totalsRow}`);
          updateCell(`A${r34}`, totals.amountInWords);
          updateCell(`J${r34}`, 'Add: CGST');
          updateCell(`R${r34}`, totals.cgstTotal, 'n', `K${totalsRow}`);
          updateCell(`J${r35}`, 'Add: SGST');
          updateCell(`R${r35}`, totals.sgstTotal, 'n', `N${totalsRow}`);

          updateCell(`A${r36}`, `Bank Name: ${bank.bankName || 'AXIS BANK'}`);
          updateCell(`J${r36}`, 'Add: IGST');
          updateCell(`O${r36}`, `${totals.effectiveIgstRate || 18}%`, 's');
          updateCell(`R${r36}`, totals.igstTotal, 'n', `P${totalsRow}`);

          updateCell(`A${r37}`, `Bank A/C: ${bank.accountNo || '923020038419128'}`);
          updateCell(`J${r37}`, 'Total Tax Amount');
          updateCell(`R${r37}`, totals.totalTax, 'n', `R${r34}+R${r35}+R${r36}`);

          updateCell(`A${r38}`, `Bank IFSC: ${bank.ifsc || 'UTIB0001282'}`);
          updateCell(`J${r38}`, 'Total Amount after Tax:');
          updateCell(`R${r38}`, totals.grandTotal, 'n', `R${r33}+R${r37}`);

          updateCell(`R${r39}`, invoice.reverseCharge === 'Y' ? totals.totalTax : 0, 'n');

          // Terms & Conditions
          const terms = (invoice.terms && invoice.terms.length > 0) 
            ? invoice.terms 
            : ((typeof window !== 'undefined' && window.DEFAULT_DATA) ? window.DEFAULT_DATA.termsPresets[0].items : []);
          terms.forEach((term, idx) => {
            const r = 40 + extraRows + idx;
            if (r <= (47 + extraRows)) {
              updateCell(`A${r}`, term);
            }
          });

          // Head office & UDYAM
          updateCell(`A${48 + extraRows}`, `Head Office :  ${company.address || ''}`);
          updateCell(`A${49 + extraRows}`, `UDYAM NO : ${company.udyamNo || 'UDYAM-TN-20-0083238'}`);

          // Trigger download with the real template!
          XLSX.writeFile(wb, filename);
          return;
        }
      } catch (err) {
        console.warn('Error modifying base64 template, falling back to manual generation', err);
      }
    }

    // Fallback: Generate workbook from scratch matching original layout
    this.exportFromScratch(invoice, company, client, bank, totals, filename);
  },

  /**
   * Fallback: Generate workbook from scratch if base64 template is unavailable
   */
  exportFromScratch(invoice, company, client, bank, totals, filename) {
    const wb = XLSX.utils.book_new();
    const data = [
      ['FAB STEEL ENGINEERING SERVICES'],
      [`Salem Tamil Nadu PIN: 636453 | Phone: ${company.phone || '+91 8300621360'} | GSTIN: ${company.gstin || '33BLBPJ7865F1Z3'}`],
      ['TAX INVOICE'],
      ['Original for Recipient'],
      ['Invoice No:', invoice.invoiceNo, '', 'PO Number:', invoice.poNumber || ''],
      ['Invoice Date:', Calculations.formatDate(invoice.date), '', 'Ref Number:', invoice.refNumber || ''],
      ['State:', company.state, 'Code:', company.stateCode, 'Reverse Charge:', invoice.reverseCharge || 'N'],
      [''],
      ['DETAIL OF BILLING FROM', '', '', '', 'DETAIL OF BILLING TO'],
      [company.name, '', '', '', client.companyName || client.name],
      [company.address, '', '', '', client.address],
      [`GSTIN: ${company.gstin}`, '', '', '', `GSTIN: ${client.gstin}`],
      [`State: ${company.state} (${company.stateCode})`, '', '', '', `State: ${client.state} (${client.stateCode})`],
      [''],
      ['S.No', 'Product Description', 'HSN/SAC', 'Qty', 'TON', 'Rate', 'Amount', 'Discount', 'Taxable Value', 'CGST Rate', 'CGST Amt', 'SGST Rate', 'SGST Amt', 'IGST Rate', 'IGST Amt', 'Total']
    ];

    totals.items.forEach((it, idx) => {
      data.push([
        it.sNo || (idx + 1),
        it.description || '',
        it.hsn || '998333',
        it.qty || 1,
        it.ton || 0,
        it.rate || 0,
        it.amount || 0,
        it.discount || 0,
        it.taxableValue || 0,
        it.cgstRate || 0,
        it.cgstAmount || 0,
        it.sgstRate || 0,
        it.sgstAmount || 0,
        it.igstRate || 0,
        it.igstAmount || 0,
        it.total || 0
      ]);
    });

    data.push([
      'Total', '', '', '', totals.totalTon, '', totals.subtotal, totals.totalDiscount, totals.taxableAmount, '', totals.cgstTotal, '', totals.sgstTotal, '', totals.igstTotal, totals.grandTotal
    ]);

    data.push(['']);
    data.push(['Amount in Words:', totals.amountInWords]);
    data.push(['Total Amount before Tax:', totals.taxableAmount]);
    data.push(['Add: CGST:', totals.cgstTotal]);
    data.push(['Add: SGST:', totals.sgstTotal]);
    data.push(['Add: IGST:', totals.igstTotal]);
    data.push(['Total Tax Amount:', totals.totalTax]);
    data.push(['Total Amount after Tax:', totals.grandTotal]);
    data.push(['']);
    data.push(['Bank Details:']);
    data.push([`Bank Name: ${bank.bankName || 'AXIS BANK'}`]);
    data.push([`Bank A/C: ${bank.accountNo || '923020038419128'}`]);
    data.push([`Bank IFSC: ${bank.ifsc || 'UTIB0001282'}`]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Tax Invoice');
    XLSX.writeFile(wb, filename);
  }
};

(typeof window !== 'undefined' ? window : global).ExportExcel = ExportExcel;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportExcel;
}
