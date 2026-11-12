/**
 * Template Engine
 * Renders invoices into high-fidelity, print-ready HTML documents.
 * 100% faithful recreation of the uploaded Excel invoice format:
 * FSE-2026-27-XXX- SAMPLE - XX-XX-XXXX.xlsx
 * 
 * Features:
 * - Intelligent multi-page pagination with repeated table headers
 * - Strict fixed-width column allocation preventing product table collapse
 * - Full support for Intra-state (CGST+SGST) and Inter-state (IGST) invoices
 * - Support for A4 Portrait, A4 Landscape, A5, Letter, and Legal layouts
 * - Dedicated Canva-style document renderer separated from editor controls
 */

const TemplateEngine = {
  /**
   * Main render function
   * @param {Object} invoice - Full invoice data object
   * @param {Object} template - Template configuration (colors, layout, sections)
   * @param {Object} options - { pageSize, orientation, zoom, isExport }
   * @returns {string} HTML string
   */
  renderInvoice(invoice, template = null, options = {}) {
    if (!invoice) return '<div class="alert alert-warning">No invoice selected</div>';

    const ds = (typeof window !== 'undefined' ? window.DataStore : null) || (typeof DataStore !== 'undefined' ? DataStore : null);

    if (!template) {
      const templateId = invoice.templateId || 'tpl-fab-excel';
      template = ds ? ds.getTemplate(templateId) : null;
      if (!template && typeof window !== 'undefined' && window.DEFAULT_DATA) {
        template = window.DEFAULT_DATA.templates[0];
      }
    }

    const company = invoice.company || (ds ? ds.getCompany() : ((typeof window !== 'undefined' && window.DEFAULT_DATA) ? window.DEFAULT_DATA.company : {}));
    const client = invoice.client || {};
    const bankAccount = (ds && ds.getBankAccount(invoice.bankAccountId)) || (ds && ds.getBankAccounts()[0]) || ((typeof window !== 'undefined' && window.DEFAULT_DATA) ? window.DEFAULT_DATA.bankAccounts[0] : {});
    const totals = Calculations.calculateTotals(invoice.items || [], {
      fromStateCode: company.stateCode || '33',
      toStateCode: client.stateCode || '33',
      enableRoundOff: invoice.enableRoundOff !== false,
      additionalCharges: invoice.additionalCharges || 0,
      amountPaid: invoice.amountPaid || 0
    });

    const isExcelTemplate = !template || template.id === 'tpl-fab-excel';

    if (isExcelTemplate) {
      return this.renderFabExcelTemplate(invoice, company, client, bankAccount, totals, template, options);
    } else {
      return this.renderModernTemplate(invoice, company, client, bankAccount, totals, template, options);
    }
  },

  /**
   * Exact 1:1 recreation of "GST Tax Invoice Format" from:
   * FSE-2026-27-XXX- SAMPLE - XX-XX-XXXX.xlsx
   */
  renderFabExcelTemplate(invoice, company, client, bank, totals, template, options = {}) {
    const colors = (template && template.colors) || {
      headerBg: '#4BD0FF',
      tableHeaderBg: '#4BD0FF',
      totalRowBg: '#FFFF00',
      greyBg: '#D9D9D9',
      borderColor: '#000000'
    };

    const pageSize = options.pageSize || invoice.pageSize || 'a4';
    const orientation = options.orientation || invoice.orientation || 'portrait';
    const pageClass = `${pageSize}-${orientation}`;

    const defaultAssets = (typeof window !== 'undefined' ? window.DEFAULT_ASSETS : null) || {};
    const logoSrc = company.logo || defaultAssets.logo || 'assets/images/logo.png';
    const badgeSrc = company.badge || defaultAssets.badge || 'assets/images/brand-badge.png';
    const sigSrc = company.signature || defaultAssets.signature || 'assets/images/signature.jpg';

    // Terms & Conditions list (8 conditions matching Excel template)
    const terms = (invoice.terms && invoice.terms.length > 0) 
      ? invoice.terms 
      : ((typeof window !== 'undefined' && window.DEFAULT_DATA) ? window.DEFAULT_DATA.termsPresets[0].items : []);
    const getTerm = (idx) => terms[idx] || '';

    // Fixed Column Allocation (Sum = 100.0%)
    // Gives priority width to Description, Amounts, and Totals
    const columns = [
      { id: 'sno', name: 'S. No.', width: '4.0%', align: 'center', cellClass: 'cell-center font-bold' },
      { id: 'desc', name: 'Product Description', width: '22.0%', align: 'left', cellClass: 'cell-desc' },
      { id: 'hsn', name: 'HSN/SAC code', width: '7.5%', align: 'center', cellClass: 'cell-center font-bold' },
      { id: 'qty', name: 'Qty', width: '4.0%', align: 'center', cellClass: 'cell-center' },
      { id: 'ton', name: 'TON', width: '5.5%', align: 'center', cellClass: 'cell-center font-bold' },
      { id: 'rate', name: 'Rate', width: '6.5%', align: 'right', cellClass: 'cell-num font-bold' },
      { id: 'amt', name: 'Amount', width: '7.5%', align: 'right', cellClass: 'cell-num font-bold' },
      { id: 'disc', name: 'Discount', width: '5.0%', align: 'right', cellClass: 'cell-num' },
      { id: 'taxable', name: 'Taxable Value', width: '7.5%', align: 'right', cellClass: 'cell-num font-bold' },
      { id: 'cgstRate', name: 'Rate', width: '3.5%', align: 'center', cellClass: 'cell-center' },
      { id: 'cgstAmt', name: 'Amount', width: '6.0%', align: 'right', cellClass: 'cell-num font-bold' },
      { id: 'sgstRate', name: 'Rate', width: '3.5%', align: 'center', cellClass: 'cell-center' },
      { id: 'sgstAmt', name: 'Amount', width: '6.0%', align: 'right', cellClass: 'cell-num font-bold' },
      { id: 'igstRate', name: 'Rate', width: '3.5%', align: 'center', cellClass: 'cell-center font-bold' },
      { id: 'igstAmt', name: 'Amount', width: '6.5%', align: 'right', cellClass: 'cell-num font-bold' },
      { id: 'total', name: 'Total', width: '8.0%', align: 'right', cellClass: 'cell-num font-bold' }
    ];

    const colGroupHtml = `
      <colgroup>
        ${columns.map(c => `<col style="width: ${c.width};">`).join('')}
      </colgroup>
    `;

    const tableHeaderHtml = `
      <thead>
        <tr class="item-head-row" style="background-color: ${colors.tableHeaderBg};">
          <th class="th-cell text-center font-bold p-0"><div class="th-flex-center">S. No.</div></th>
          <th class="th-cell text-center font-bold p-0"><div class="th-flex-center">Product Description</div></th>
          <th class="th-cell text-center font-bold p-0"><div class="th-flex-center">HSN/SAC code</div></th>
          <th class="th-cell text-center font-bold p-0"><div class="th-flex-center">Qty</div></th>
          <th class="th-cell text-center font-bold p-0"><div class="th-flex-center">TON</div></th>
          <th class="th-cell text-center font-bold p-0"><div class="th-flex-center">Rate</div></th>
          <th class="th-cell text-center font-bold p-0"><div class="th-flex-center">Amount</div></th>
          <th class="th-cell text-center font-bold p-0"><div class="th-flex-center">Discount</div></th>
          <th class="th-cell text-center font-bold p-0"><div class="th-flex-center">Taxable Value</div></th>
          <th colspan="2" class="th-cell-gst-group p-0">
            <div class="th-group-header">CGST</div>
            <div class="th-sub-row">
              <div class="th-sub-col" style="width: 36.84%; border-right: 1px solid #000000;">Rate</div>
              <div class="th-sub-col" style="width: 63.16%;">Amount</div>
            </div>
          </th>
          <th colspan="2" class="th-cell-gst-group p-0">
            <div class="th-group-header">SGST</div>
            <div class="th-sub-row">
              <div class="th-sub-col" style="width: 36.84%; border-right: 1px solid #000000;">Rate</div>
              <div class="th-sub-col" style="width: 63.16%;">Amount</div>
            </div>
          </th>
          <th colspan="2" class="th-cell-gst-group p-0">
            <div class="th-group-header">IGST</div>
            <div class="th-sub-row">
              <div class="th-sub-col" style="width: 35.00%; border-right: 1px solid #000000;">Rate</div>
              <div class="th-sub-col" style="width: 65.00%;">Amount</div>
            </div>
          </th>
          <th class="th-cell text-center font-bold p-0"><div class="th-flex-center">Total</div></th>
        </tr>
      </thead>
    `;

    const renderItemRow = (item, idx) => `
      <tr class="excel-item-row">
        <td class="cell-center font-bold p-0"><div class="cell-flex cell-flex-center">${item.sNo || (idx + 1)}</div></td>
        <td class="cell-desc p-0"><div class="cell-flex cell-flex-left">${item.description || ''}</div></td>
        <td class="cell-center font-bold p-0"><div class="cell-flex cell-flex-center">${item.hsn || '998333'}</div></td>
        <td class="cell-center p-0"><div class="cell-flex cell-flex-center">${item.qty || 1}</div></td>
        <td class="cell-center font-bold p-0"><div class="cell-flex cell-flex-center">${item.ton ? Calculations.formatNumber(item.ton, 2) : '-'}</div></td>
        <td class="cell-num font-bold p-0"><div class="cell-flex cell-flex-right">${Calculations.formatNumber(item.rate, 2)}</div></td>
        <td class="cell-num font-bold p-0"><div class="cell-flex cell-flex-right">${Calculations.formatNumber(item.amount, 2)}</div></td>
        <td class="cell-num p-0"><div class="cell-flex cell-flex-right">${item.discount ? Calculations.formatNumber(item.discount, 2) : '0.00'}</div></td>
        <td class="cell-num font-bold p-0"><div class="cell-flex cell-flex-right">${Calculations.formatNumber(item.taxableValue, 2)}</div></td>
        <td class="cell-center p-0"><div class="cell-flex cell-flex-center">${item.cgstRate ? item.cgstRate + '%' : '-'}</div></td>
        <td class="cell-num font-bold p-0"><div class="cell-flex cell-flex-right">${item.cgstAmount ? Calculations.formatNumber(item.cgstAmount, 2) : '0.00'}</div></td>
        <td class="cell-center p-0"><div class="cell-flex cell-flex-center">${item.sgstRate ? item.sgstRate + '%' : '-'}</div></td>
        <td class="cell-num font-bold p-0"><div class="cell-flex cell-flex-right">${item.sgstAmount ? Calculations.formatNumber(item.sgstAmount, 2) : '0.00'}</div></td>
        <td class="cell-center font-bold p-0"><div class="cell-flex cell-flex-center">${item.igstRate ? item.igstRate + '%' : '-'}</div></td>
        <td class="cell-num font-bold p-0"><div class="cell-flex cell-flex-right">${item.igstAmount ? Calculations.formatNumber(item.igstAmount, 2) : '0.00'}</div></td>
        <td class="cell-num font-bold p-0"><div class="cell-flex cell-flex-right">${Calculations.formatNumber(item.total, 2)}</div></td>
      </tr>
    `;

    const totalsRowHtml = `
      <tr class="excel-total-row" style="background-color: ${colors.totalRowBg};">
        <td colspan="4" class="text-center font-total-title p-0"><div class="cell-flex cell-flex-center font-bold">Total</div></td>
        <td class="cell-center font-bold p-0"><div class="cell-flex cell-flex-center">${Calculations.formatNumber(totals.totalTon, 2)}</div></td>
        <td class="cell-center font-bold p-0"><div class="cell-flex cell-flex-center"></div></td>
        <td class="cell-num font-bold p-0"><div class="cell-flex cell-flex-right">${Calculations.formatNumber(totals.subtotal, 2)}</div></td>
        <td class="cell-num font-bold p-0"><div class="cell-flex cell-flex-right">${Calculations.formatNumber(totals.totalDiscount, 2)}</div></td>
        <td class="cell-num font-bold p-0"><div class="cell-flex cell-flex-right">${Calculations.formatNumber(totals.taxableAmount, 2)}</div></td>
        <td class="cell-center font-bold p-0"><div class="cell-flex cell-flex-center"></div></td>
        <td class="cell-num font-bold p-0"><div class="cell-flex cell-flex-right">${Calculations.formatNumber(totals.cgstTotal, 2)}</div></td>
        <td class="cell-center font-bold p-0"><div class="cell-flex cell-flex-center"></div></td>
        <td class="cell-num font-bold p-0"><div class="cell-flex cell-flex-right">${Calculations.formatNumber(totals.sgstTotal, 2)}</div></td>
        <td class="cell-center font-bold p-0"><div class="cell-flex cell-flex-center"></div></td>
        <td class="cell-num font-bold p-0"><div class="cell-flex cell-flex-right">${Calculations.formatNumber(totals.igstTotal, 2)}</div></td>
        <td class="cell-num font-bold p-0"><div class="cell-flex cell-flex-right">${Calculations.formatNumber(totals.grandTotal, 2)}</div></td>
      </tr>
    `;

    const bottomSectionTableHtml = `
      <table class="excel-table bottom-exact-table">
        <colgroup>
          <col style="width: 53%;">
          <col style="width: 25%;">
          <col style="width: 7%;">
          <col style="width: 15%;">
        </colgroup>
        <!-- Row 33 -->
        <tr>
          <td class="text-center font-bold" style="background-color: ${colors.headerBg};">
            Total Invoice amount in words
          </td>
          <td colspan="2" style="background-color: ${colors.greyBg};">Total Amount before Tax</td>
          <td class="cell-num font-bold" style="background-color: ${colors.greyBg};">${Calculations.formatNumber(totals.taxableAmount, 2)}</td>
        </tr>

        <!-- Row 34 -->
        <tr>
          <td class="text-center font-bold" style="background-color: ${colors.greyBg}; font-size: 7.5pt;">
            ${totals.amountInWords}
          </td>
          <td colspan="2" style="background-color: ${colors.greyBg};">Add: CGST</td>
          <td class="cell-num font-bold" style="background-color: ${colors.greyBg};">${Calculations.formatNumber(totals.cgstTotal, 2)}</td>
        </tr>

        <!-- Row 35 -->
        <tr>
          <td class="font-bold" style="font-size: 9.5pt;">Bank Details</td>
          <td colspan="2" style="background-color: ${colors.greyBg};">Add: SGST</td>
          <td class="cell-num font-bold" style="background-color: ${colors.greyBg};">${Calculations.formatNumber(totals.sgstTotal, 2)}</td>
        </tr>

        <!-- Row 36 -->
        <tr>
          <td class="font-bold">Bank Name: ${bank.bankName || 'AXIS BANK'}</td>
          <td style="background-color: ${colors.greyBg};">Add: IGST</td>
          <td class="text-center font-bold" style="background-color: ${colors.greyBg};">${totals.effectiveIgstRate || 18}%</td>
          <td class="cell-num font-bold" style="background-color: ${colors.greyBg};">${Calculations.formatNumber(totals.igstTotal, 2)}</td>
        </tr>

        <!-- Row 37 -->
        <tr>
          <td class="font-bold">Bank A/C: ${bank.accountNo || '923020038419128'}</td>
          <td colspan="2" class="font-bold" style="background-color: ${colors.greyBg};">Total Tax Amount</td>
          <td class="cell-num font-bold" style="background-color: ${colors.greyBg};">${Calculations.formatNumber(totals.totalTax, 2)}</td>
        </tr>

        <!-- Row 38 -->
        <tr>
          <td class="font-bold">Bank IFSC: ${bank.ifsc || 'UTIB0001282'}</td>
          <td colspan="2" class="font-bold" style="background-color: ${colors.totalRowBg};">Total Amount after Tax:</td>
          <td class="cell-num font-bold" style="background-color: ${colors.totalRowBg}; font-size: 10pt;">${Calculations.formatNumber(totals.grandTotal, 2)}</td>
        </tr>

        <!-- Row 39 -->
        <tr>
          <td class="font-bold">Terms & conditions:-</td>
          <td colspan="2">GST on Reverse Charge</td>
          <td class="cell-num font-bold">${invoice.reverseCharge === 'Y' ? Calculations.formatNumber(totals.totalTax, 2) : '0'}</td>
        </tr>

        <!-- Row 40 -->
        <tr>
          <td class="term-cell-text">${getTerm(0)}</td>
          <td colspan="3" class="cert-cell-text">
            We hereby certify that the particulars given above are true and correct to the best of our knowedge and belief
          </td>
        </tr>

        <!-- Row 41 -->
        <tr>
          <td class="term-cell-text">${getTerm(1)}</td>
          <td colspan="3" class="text-center font-bold" style="font-size: 9.5pt; padding: 4px;">
            For ${company.name || 'FAB STEEL ENGINEERING SERVICES'}
          </td>
        </tr>

        <!-- Row 42 to 46 (Terms 3-7 on left, Signature seal on right) -->
        <tr>
          <td class="term-cell-text">${getTerm(2)}</td>
          <td colspan="3" rowspan="5" class="signature-cell-box">
            <img src="${sigSrc}" alt="Signature" class="excel-signature-img" />
          </td>
        </tr>
        <tr>
          <td class="term-cell-text">${getTerm(3)}</td>
        </tr>
        <tr>
          <td class="term-cell-text">${getTerm(4)}</td>
        </tr>
        <tr>
          <td class="term-cell-text">${getTerm(5)}</td>
        </tr>
        <tr>
          <td class="term-cell-text">${getTerm(6)}</td>
        </tr>

        <!-- Row 47 -->
        <tr>
          <td class="term-cell-text">${getTerm(7)}</td>
          <td colspan="3" class="text-center font-bold" style="font-size: 9.5pt; padding: 4px;">
            Authorised signatory
          </td>
        </tr>

        <!-- Row 48: Head Office Banner -->
        <tr>
          <td colspan="4" class="text-center footer-banner-cell">
            Head Office : ${company.headOffice || '14/192A, KAMBAR STREET, ANNA NAGAR, KORANAMPATTI (PO) EDAPPADI (TK), SALEM (DT) PIN:637102'}
          </td>
        </tr>

        <!-- Row 49: UDYAM Banner -->
        <tr>
          <td colspan="4" class="text-center footer-banner-cell">
            UDYAM NO : ${company.udyamNo || 'UDYAM-TN-20-0083238'}
          </td>
        </tr>
      </table>
    `;

    // Common Page Header (Logo, Company, GSTIN, Title, Metadata, Billing)
    const renderTopHeader = () => `
      <!-- SECTION 1: HEADER & LOGOS (Rows 1-4) -->
      <table class="excel-table header-table">
        <tr>
          <td colspan="6" class="header-logo-cell">
            <div class="logo-flex-container">
              <img src="${logoSrc}" alt="Logo" class="excel-logo-img" />
              <img src="${badgeSrc}" alt="Brand Badge" class="excel-badge-img" />
            </div>
          </td>
          <td colspan="13" class="header-info-cell">
            <div class="company-title-banner" style="background-color: ${colors.headerBg};">
              ${company.name || 'FAB STEEL ENGINEERING SERVICES'}
            </div>
            <div class="company-sub-line">
              ${company.city || 'Salem'} ${company.state || 'Tamil Nadu'} PIN: ${company.pin || '636453'}
            </div>
            <div class="company-sub-line">
              Phone: ${company.phone || '+91 8300621360'} Email: ${company.email || 'fabsteelsalem@gmail.com'}
            </div>
            <div>
              <span class="company-gstin-highlight">
                GSTIN:-${company.gstin || '33BLBPJ7865F1Z3'}
              </span>
            </div>
          </td>
        </tr>
      </table>

      <!-- SECTION 2: TITLE & COPY TYPE (Rows 6-8) -->
      <table class="excel-table title-table">
        <tr>
          <td class="tax-invoice-banner" style="background-color: ${colors.headerBg};">
            ${invoice.invoiceType || 'Tax Invoice'}
          </td>
        </tr>
        <tr>
          <td class="copy-type-banner" style="background-color: ${colors.greyBg};">
            ${invoice.copyType || 'Original for Recipient'}
          </td>
        </tr>
      </table>

      <!-- SECTION 3: INVOICE METADATA 4-ROW GRID (Rows 9-12) -->
      <table class="excel-table meta-table">
        <tr>
          <td colspan="8" class="meta-label-cell">
            <strong>Invoice No:</strong> <span class="highlight-code">${invoice.invoiceNo || 'FSE-2026-27-006'}</span>
          </td>
          <td colspan="11" class="meta-label-cell">
            <strong>Purchase Order Number :</strong> ${invoice.poNumber || ''}
          </td>
        </tr>
        <tr>
          <td colspan="8" class="meta-label-cell">
            <strong>Invoice date:</strong> ${Calculations.formatDate(invoice.date, 'DD-MM-YYYY')}
          </td>
          <td colspan="11" class="meta-label-cell">
            <strong>Reference Number     :</strong> ${invoice.refNumber || ''}
          </td>
        </tr>
        <tr>
          <td colspan="8" class="meta-label-cell">
            <strong>Reverse Charge (Y/N):</strong> ${invoice.reverseCharge || 'N'}
          </td>
          <td colspan="11" class="meta-label-cell">
            <strong>Value of PO :</strong> ${invoice.poValue ? Calculations.formatCurrency(invoice.poValue) : ''}
          </td>
        </tr>
        <tr>
          <td colspan="6" class="meta-label-cell">
            <strong>State:</strong> ${company.state || 'Tamil Nadu'}
          </td>
          <td class="text-center font-bold" style="width: 5%;">Code</td>
          <td class="text-center font-bold" style="width: 5%;">${company.stateCode || '33'}</td>
          <td colspan="11" class="meta-label-cell">
            <strong>Quote Reference no :</strong> ${invoice.quoteRef || 'PD-FAB-2026-27-RFQ-01'}
          </td>
        </tr>
      </table>

      <!-- SECTION 4: BILLING FROM & BILLING TO HEADERS (Row 14) -->
      <table class="excel-table billing-table">
        <tr class="billing-header-row" style="background-color: ${colors.headerBg};">
          <td colspan="8" class="text-center font-bold">Detail of Billing From</td>
          <td colspan="11" class="text-center font-bold">Detail of Billing TO</td>
        </tr>
        <tr>
          <td colspan="8" class="billing-content-cell">
            <div><strong>Name:</strong> ${company.name || 'FAB STEEL ENGINEERING SERVICES'}</div>
            <div class="billing-address"><strong>Address:</strong> ${company.address || ''}</div>
            <div><strong>GSTIN:</strong> ${company.gstin || ''}</div>
            <div><strong>PAN:</strong> ${company.pan || ''}</div>
            <div class="row-flex">
              <span><strong>State:</strong> ${company.state || 'Tamil Nadu'}</span>
              <span class="ms-auto pe-2"><strong>Code:</strong> ${company.stateCode || '33'}</span>
            </div>
          </td>
          <td colspan="11" class="billing-content-cell">
            <div><strong>Name:</strong> ${client.companyName || client.name || ''}</div>
            <div class="billing-address"><strong>Address:</strong> ${client.address || ''}</div>
            <div><strong>JOB GSTIN:</strong> ${client.gstin || ''}</div>
            <div><strong>JOB PAN:</strong> ${client.pan || ''}</div>
            <div class="row-flex">
              <span><strong>State:</strong> ${client.state || ''}</span>
              <span class="ms-auto pe-2"><strong>Code:</strong> ${client.stateCode || ''}</span>
            </div>
          </td>
        </tr>
      </table>
    `;

    // Continuation Page Header for Pages 2+
    const renderContinuationHeader = (pageIdx, totalP) => `
      <div class="continuation-header">
        <div>
          <span class="continuation-title">${company.name || 'FAB STEEL ENGINEERING SERVICES'}</span>
          <span class="text-muted ms-2" style="font-size: 8pt;">(Tax Invoice Continuation)</span>
        </div>
        <div class="continuation-meta">
          <strong>Invoice:</strong> ${invoice.invoiceNo || ''} &nbsp;|&nbsp; 
          <strong>Date:</strong> ${Calculations.formatDate(invoice.date, 'DD-MM-YYYY')}
        </div>
        <div class="continuation-badge">
          Page ${pageIdx + 1} of ${totalP}
        </div>
      </div>
    `;

    // Footer bar for each page
    const renderPageFooter = (pageIdx, totalP) => `
      <div class="page-footer-bar">
        <span><strong>Invoice:</strong> ${invoice.invoiceNo || 'Draft'}</span>
        <span>${company.name || 'FAB STEEL ENGINEERING SERVICES'}</span>
        <span>Page ${pageIdx + 1} of ${totalP}</span>
      </div>
    `;

    // -------------------------------------------------------------
    // INTELLIGENT MULTI-PAGE PAGINATION
    // -------------------------------------------------------------
    const items = totals.items || [];
    const totalItems = items.length;

    // Up to 6 items fit comfortably on a single A4 page with the full bottom table
    if (totalItems <= 6) {
      const page1Html = `
        <div class="invoice-page ${pageClass} excel-style-doc" id="invoice-printable-area" style="font-family: ${template?.layout?.fontFamily || "'Bookman Old Style', 'Calibri', serif"};">
          ${renderTopHeader()}

          <!-- PRODUCT / SERVICE ITEMS TABLE -->
          <table class="excel-table items-table">
            ${colGroupHtml}
            ${tableHeaderHtml}
            <tbody>
              ${items.map((item, idx) => renderItemRow(item, idx)).join('')}
              ${totalsRowHtml}
            </tbody>
          </table>

          <!-- EXACT BOTTOM SECTION -->
          ${bottomSectionTableHtml}

          <!-- PAGE FOOTER -->
          ${renderPageFooter(0, 1)}
        </div>
      `;

      return `
        <div class="multi-page-container">
          ${page1Html}
        </div>
      `;
    }

    // MULTI-PAGE LOGIC FOR 7+ ITEMS:
    // Page 1 takes top header + first batch of items (up to 10)
    // Page 2+ takes continuation header + next items + bottom section on the last page
    const pageItemSlices = [];
    if (totalItems <= 14) {
      // 2 pages: split nicely so both pages look balanced
      const p1Count = Math.min(8, totalItems - 3);
      pageItemSlices.push(items.slice(0, p1Count));
      pageItemSlices.push(items.slice(p1Count));
    } else {
      // 3 or more pages
      let cursor = 0;
      pageItemSlices.push(items.slice(0, 10));
      cursor = 10;
      while (cursor < totalItems) {
        const remaining = totalItems - cursor;
        if (remaining <= 6) {
          pageItemSlices.push(items.slice(cursor));
          cursor = totalItems;
        } else {
          const take = Math.min(14, remaining - 4);
          pageItemSlices.push(items.slice(cursor, cursor + take));
          cursor += take;
        }
      }
    }

    const totalPages = pageItemSlices.length;

    const pagesHtml = pageItemSlices.map((pageItems, pageIdx) => {
      const isFirstPage = (pageIdx === 0);
      const isLastPage = (pageIdx === totalPages - 1);
      const startItemIdx = pageItemSlices.slice(0, pageIdx).reduce((acc, slice) => acc + slice.length, 0);

      const itemsHtml = pageItems.map((item, idx) => renderItemRow(item, startItemIdx + idx)).join('');

      return `
        <div class="invoice-page ${pageClass} excel-style-doc" id="${isFirstPage ? 'invoice-printable-area' : 'invoice-page-' + (pageIdx + 1)}" data-page="${pageIdx + 1}" style="font-family: ${template?.layout?.fontFamily || "'Bookman Old Style', 'Calibri', serif"};">
          ${isFirstPage ? renderTopHeader() : renderContinuationHeader(pageIdx, totalPages)}

          <!-- PRODUCT / SERVICE ITEMS TABLE -->
          <table class="excel-table items-table">
            ${colGroupHtml}
            ${tableHeaderHtml}
            <tbody>
              ${itemsHtml}
              ${isLastPage ? totalsRowHtml : `
                <tr>
                  <td colspan="16" class="text-center font-bold text-muted p-2" style="background-color: #f8fafc; font-size: 8pt;">
                    --- Continued on Page ${pageIdx + 2} ---
                  </td>
                </tr>
              `}
            </tbody>
          </table>

          <!-- ONLY RENDER BOTTOM SECTION ON FINAL PAGE -->
          ${isLastPage ? bottomSectionTableHtml : ''}

          <!-- PAGE FOOTER -->
          ${renderPageFooter(pageIdx, totalPages)}
        </div>
      `;
    }).join('');

    return `
      <div class="multi-page-container">
        ${pagesHtml}
      </div>
    `;
  },

  /**
   * Modern Clean Template (Alternative theme)
   */
  renderModernTemplate(invoice, company, client, bank, totals, template, options = {}) {
    const colors = (template && template.colors) || {
      headerBg: '#1e293b',
      headerText: '#ffffff',
      tableHeaderBg: '#f1f5f9',
      tableHeaderText: '#0f172a',
      borderColor: '#e2e8f0',
      highlightColor: '#2563eb'
    };

    const pageSize = options.pageSize || invoice.pageSize || 'a4';
    const orientation = options.orientation || invoice.orientation || 'portrait';
    const pageClass = `${pageSize}-${orientation}`;

    const defaultAssets = (typeof window !== 'undefined' ? window.DEFAULT_ASSETS : null) || {};
    const logoSrc = company.logo || defaultAssets.logo || 'assets/images/logo.png';
    const sigSrc = company.signature || defaultAssets.signature || 'assets/images/signature.jpg';

    const itemsHtml = totals.items.map((item, idx) => `
      <tr>
        <td class="text-center">${item.sNo || (idx + 1)}</td>
        <td class="fw-bold">${item.description || ''}</td>
        <td class="text-center">${item.hsn || '-'}</td>
        <td class="text-center">${item.qty || 1}</td>
        <td class="text-end">${Calculations.formatCurrency(item.rate)}</td>
        <td class="text-end">${Calculations.formatCurrency(item.taxableValue)}</td>
        <td class="text-end">${item.igstRate ? item.igstRate + '%' : ((item.cgstRate || 0) + (item.sgstRate || 0)) + '%'}</td>
        <td class="text-end fw-bold">${Calculations.formatCurrency(item.total)}</td>
      </tr>
    `).join('');

    return `
      <div class="invoice-page ${pageClass} modern-style-doc" id="invoice-printable-area" style="font-family: ${template?.layout?.fontFamily || "'Inter', sans-serif"};">
        <div class="modern-header d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div>
            <img src="${logoSrc}" alt="Logo" style="max-height: 55px; max-width: 160px; object-fit: contain;" />
            <h4 class="mt-2 mb-0 fw-bold">${company.name || 'FAB STEEL ENGINEERING SERVICES'}</h4>
            <div class="text-muted small">${company.address}</div>
            <div class="small"><strong>GSTIN:</strong> ${company.gstin} | <strong>PAN:</strong> ${company.pan}</div>
          </div>
          <div class="text-end">
            <h2 class="text-primary fw-bold mb-1">${invoice.invoiceType || 'TAX INVOICE'}</h2>
            <div class="badge bg-secondary mb-2">${invoice.copyType || 'Original for Recipient'}</div>
            <div class="fw-bold">${invoice.invoiceNo}</div>
            <div class="text-muted small">Date: ${Calculations.formatDate(invoice.date)}</div>
            ${invoice.poNumber ? `<div class="small">PO: ${invoice.poNumber}</div>` : ''}
          </div>
        </div>

        <div class="row g-3 mb-4">
          <div class="col-6">
            <div class="p-3 bg-light rounded border">
              <div class="text-muted small text-uppercase fw-bold mb-1">Billed To</div>
              <h6 class="fw-bold mb-1">${client.companyName || client.name}</h6>
              <div class="small text-muted mb-1">${client.address}</div>
              <div class="small"><strong>GSTIN:</strong> ${client.gstin || 'N/A'}</div>
              <div class="small"><strong>State:</strong> ${client.state} (${client.stateCode})</div>
            </div>
          </div>
          <div class="col-6">
            <div class="p-3 bg-light rounded border">
              <div class="text-muted small text-uppercase fw-bold mb-1">Invoice Details</div>
              <div class="small"><strong>State of Supply:</strong> ${client.state || company.state}</div>
              <div class="small"><strong>Reverse Charge:</strong> ${invoice.reverseCharge || 'N'}</div>
              <div class="small"><strong>Quote Ref:</strong> ${invoice.quoteRef || 'N/A'}</div>
              <div class="small"><strong>Payment Terms:</strong> ${invoice.paymentTerms || '30 Days'}</div>
            </div>
          </div>
        </div>

        <table class="table table-bordered table-striped mb-4">
          <thead class="table-dark">
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 35%;">Description</th>
              <th style="width: 10%;">HSN</th>
              <th style="width: 8%;">Qty</th>
              <th style="width: 12%;">Rate</th>
              <th style="width: 12%;">Taxable</th>
              <th style="width: 8%;">Tax %</th>
              <th style="width: 12%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr class="table-light fw-bold">
              <td colspan="5" class="text-end">Subtotal:</td>
              <td class="text-end">${Calculations.formatCurrency(totals.taxableAmount)}</td>
              <td class="text-end">${Calculations.formatCurrency(totals.totalTax)}</td>
              <td class="text-end">${Calculations.formatCurrency(totals.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="row mb-4">
          <div class="col-7">
            <div class="p-3 border rounded mb-3">
              <div class="fw-bold small mb-1">Amount in Words:</div>
              <div class="text-primary fw-bold">${totals.amountInWords}</div>
            </div>
            <div class="p-3 border rounded">
              <div class="fw-bold small mb-1">Bank Payment Details:</div>
              <div class="small"><strong>Bank:</strong> ${bank.bankName} | <strong>A/C:</strong> ${bank.accountNo}</div>
              <div class="small"><strong>IFSC:</strong> ${bank.ifsc} | <strong>Branch:</strong> ${bank.branch}</div>
            </div>
          </div>
          <div class="col-5">
            <div class="p-3 bg-light border rounded">
              <div class="d-flex justify-content-between mb-1 small">
                <span>Taxable Amount:</span>
                <span class="fw-bold">${Calculations.formatCurrency(totals.taxableAmount)}</span>
              </div>
              ${totals.cgstTotal > 0 ? `
              <div class="d-flex justify-content-between mb-1 small">
                <span>CGST:</span>
                <span>${Calculations.formatCurrency(totals.cgstTotal)}</span>
              </div>
              <div class="d-flex justify-content-between mb-1 small">
                <span>SGST:</span>
                <span>${Calculations.formatCurrency(totals.sgstTotal)}</span>
              </div>` : ''}
              ${totals.igstTotal > 0 ? `
              <div class="d-flex justify-content-between mb-1 small">
                <span>IGST:</span>
                <span>${Calculations.formatCurrency(totals.igstTotal)}</span>
              </div>` : ''}
              <hr class="my-2" />
              <div class="d-flex justify-content-between fs-5 fw-bold text-primary">
                <span>Total Due:</span>
                <span>${Calculations.formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-end">
          <div class="small text-muted" style="max-width: 60%;">
            <strong>Terms & Conditions:</strong><br />
            1. Subject to Salem Jurisdiction.<br />
            2. Payment due within agreed terms.
          </div>
          <div class="text-center">
            <img src="${sigSrc}" alt="Signature" style="max-height: 50px; max-width: 130px; object-fit: contain;" />
            <div class="fw-bold small mt-1">For ${company.name}</div>
            <div class="text-muted small">Authorised Signatory</div>
          </div>
        </div>
      </div>
    `;
  }
};

(typeof window !== 'undefined' ? window : global).TemplateEngine = TemplateEngine;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TemplateEngine;
}
