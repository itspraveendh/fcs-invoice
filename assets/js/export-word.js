/**
 * Word Export Module (.docx)
 * Generates an editable Microsoft Word document containing tables, company details,
 * billing info, GST items breakdown, terms and conditions, bank details, and signature.
 */

const ExportWord = {
  /**
   * Export an invoice to an editable DOCX or Word-compliant document
   * @param {Object} invoice
   */
  async export(invoice) {
    if (!invoice) {
      alert('No invoice to export');
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

    const filename = `${invoice.invoiceNo || 'Invoice'}.docx`;

    // Try docx.js if available
    if (typeof docx !== 'undefined') {
      try {
        const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, BorderStyle } = docx;

        // Grouped headers for CGST, SGST, IGST in Word table
        const headerRow1 = new TableRow({
          tableHeader: true,
          cantSplit: true,
          children: [
            new TableCell({ rowSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "S.No", bold: true, size: 16 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ rowSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true, size: 16 })] })] }),
            new TableCell({ rowSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "HSN", bold: true, size: 16 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ rowSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "Qty", bold: true, size: 16 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ rowSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "TON", bold: true, size: 16 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ rowSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "Rate", bold: true, size: 16 })], alignment: AlignmentType.RIGHT })] }),
            new TableCell({ rowSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "Amount", bold: true, size: 16 })], alignment: AlignmentType.RIGHT })] }),
            new TableCell({ rowSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "Discount", bold: true, size: 16 })], alignment: AlignmentType.RIGHT })] }),
            new TableCell({ rowSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "Taxable", bold: true, size: 16 })], alignment: AlignmentType.RIGHT })] }),
            new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "CGST", bold: true, size: 16 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "SGST", bold: true, size: 16 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "IGST", bold: true, size: 16 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ rowSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true, size: 16 })], alignment: AlignmentType.RIGHT })] })
          ]
        });

        const headerRow2 = new TableRow({
          tableHeader: true,
          cantSplit: true,
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "%", bold: true, size: 15 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Amt", bold: true, size: 15 })], alignment: AlignmentType.RIGHT })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "%", bold: true, size: 15 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Amt", bold: true, size: 15 })], alignment: AlignmentType.RIGHT })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "%", bold: true, size: 15 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Amt", bold: true, size: 15 })], alignment: AlignmentType.RIGHT })] })
          ]
        });

        const tableRows = [headerRow1, headerRow2];

        totals.items.forEach((it, idx) => {
          tableRows.push(
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({ children: [new Paragraph({ text: String(it.sNo || (idx + 1)), alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: it.description || '' })] }),
                new TableCell({ children: [new Paragraph({ text: it.hsn || '998333', alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: String(it.qty || 1), alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: it.ton ? Calculations.formatNumber(it.ton, 2) : '-', alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: Calculations.formatNumber(it.rate, 2), alignment: AlignmentType.RIGHT })] }),
                new TableCell({ children: [new Paragraph({ text: Calculations.formatNumber(it.amount, 2), alignment: AlignmentType.RIGHT })] }),
                new TableCell({ children: [new Paragraph({ text: it.discount ? Calculations.formatNumber(it.discount, 2) : '0.00', alignment: AlignmentType.RIGHT })] }),
                new TableCell({ children: [new Paragraph({ text: Calculations.formatNumber(it.taxableValue, 2), alignment: AlignmentType.RIGHT })] }),
                new TableCell({ children: [new Paragraph({ text: it.cgstRate ? it.cgstRate + '%' : '-', alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: it.cgstAmount ? Calculations.formatNumber(it.cgstAmount, 2) : '0.00', alignment: AlignmentType.RIGHT })] }),
                new TableCell({ children: [new Paragraph({ text: it.sgstRate ? it.sgstRate + '%' : '-', alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: it.sgstAmount ? Calculations.formatNumber(it.sgstAmount, 2) : '0.00', alignment: AlignmentType.RIGHT })] }),
                new TableCell({ children: [new Paragraph({ text: it.igstRate ? it.igstRate + '%' : '-', alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: it.igstAmount ? Calculations.formatNumber(it.igstAmount, 2) : '0.00', alignment: AlignmentType.RIGHT })] }),
                new TableCell({ children: [new Paragraph({ text: Calculations.formatNumber(it.total, 2), alignment: AlignmentType.RIGHT })] })
              ]
            })
          );
        });

        // Totals summary row
        tableRows.push(
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({ columnSpan: 4, children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true })], alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: Calculations.formatNumber(totals.totalTon, 2), bold: true })], alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [new Paragraph({ text: "" })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: Calculations.formatNumber(totals.subtotal, 2), bold: true })], alignment: AlignmentType.RIGHT })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: Calculations.formatNumber(totals.totalDiscount, 2), bold: true })], alignment: AlignmentType.RIGHT })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: Calculations.formatNumber(totals.taxableAmount, 2), bold: true })], alignment: AlignmentType.RIGHT })] }),
              new TableCell({ children: [new Paragraph({ text: "" })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: Calculations.formatNumber(totals.cgstTotal, 2), bold: true })], alignment: AlignmentType.RIGHT })] }),
              new TableCell({ children: [new Paragraph({ text: "" })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: Calculations.formatNumber(totals.sgstTotal, 2), bold: true })], alignment: AlignmentType.RIGHT })] }),
              new TableCell({ children: [new Paragraph({ text: "" })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: Calculations.formatNumber(totals.igstTotal, 2), bold: true })], alignment: AlignmentType.RIGHT })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: Calculations.formatNumber(totals.grandTotal, 2), bold: true })], alignment: AlignmentType.RIGHT })] })
            ]
          })
        );

        const termsList = (invoice.terms && invoice.terms.length > 0) 
          ? invoice.terms 
          : ((typeof window !== 'undefined' && window.DEFAULT_DATA) ? window.DEFAULT_DATA.termsPresets[0].items : []);
        const termsParagraphs = termsList.map(t => new Paragraph({ text: t, spacing: { after: 100 } }));

        const doc = new Document({
          sections: [{
            properties: {
              page: {
                margin: { top: 720, bottom: 720, left: 720, right: 720 }
              }
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: company.name || 'FAB STEEL ENGINEERING SERVICES', bold: true, size: 30, color: "0284C7" })
                ],
                alignment: AlignmentType.CENTER
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `${company.address} | Phone: ${company.phone || '+91 8300621360'}`, size: 18 })
                ],
                alignment: AlignmentType.CENTER
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `GSTIN: ${company.gstin} | PAN: ${company.pan} | UDYAM: ${company.udyamNo}`, size: 18, bold: true })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: invoice.invoiceType || "TAX INVOICE", bold: true, size: 26, color: "0369A1" })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 150 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Invoice No: ${invoice.invoiceNo}   |   Date: ${Calculations.formatDate(invoice.date)}   |   PO: ${invoice.poNumber || 'N/A'}`, bold: true })
                ],
                spacing: { after: 200 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "BILLED TO:", bold: true, size: 20 })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `${client.companyName || client.name}\n${client.address}\nGSTIN: ${client.gstin} | State: ${client.state} (${client.stateCode})` })
                ],
                spacing: { after: 250 }
              }),
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `\nAmount in Words: ${totals.amountInWords}`, bold: true })
                ],
                spacing: { before: 200, after: 150 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Bank Details: ${bank.bankName} | A/C: ${bank.accountNo} | IFSC: ${bank.ifsc} | Branch: ${bank.branch || 'Mecheri'}` })
                ],
                spacing: { after: 200 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Terms & Conditions:", bold: true })
                ],
                spacing: { before: 200, after: 100 }
              }),
              ...termsParagraphs,
              new Paragraph({
                children: [
                  new TextRun({ text: `\nFor ${company.name}\nAuthorised Signatory`, bold: true })
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { before: 300 }
              })
            ]
          }]
        });

        const blob = await Packer.toBlob(doc);
        if (typeof saveAs !== 'undefined') {
          saveAs(blob, filename);
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        }
        return;
      } catch (err) {
        console.warn('docx.js generation error, falling back to Word HTML document:', err);
      }
    }

    // Fallback: Word HTML document (.doc format which opens natively in Microsoft Word)
    this.exportWordHtml(invoice, company, client, bank, totals, filename.replace('.docx', '.doc'));
  },

  /**
   * Word HTML (.doc) generator fallback
   */
  exportWordHtml(invoice, company, client, bank, totals, filename) {
    const ds = (typeof window !== 'undefined' ? window.DataStore : null) || (typeof DataStore !== 'undefined' ? DataStore : null);
    const template = (ds && invoice.templateId) ? ds.getTemplate(invoice.templateId) : null;
    
    // Use the exact document renderer HTML for Word export
    const contentHtml = TemplateEngine.renderInvoice(invoice, template, { isExport: true });

    const htmlDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${invoice.invoiceNo || 'Tax Invoice'}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 { size: 595.3pt 841.9pt; margin: 28.3pt 28.3pt 28.3pt 28.3pt; mso-header-margin: 36pt; mso-footer-margin: 36pt; }
          div.Section1 { page: Section1; }
          body { font-family: 'Bookman Old Style', Calibri, Arial, sans-serif; margin: 0; padding: 0; }
          table { border-collapse: collapse; width: 100%; table-layout: fixed; margin-bottom: 0px; }
          td, th { border: 1px solid #000000; padding: 3px 4px; font-size: 8.5pt; color: #000000; vertical-align: middle; }
          .font-bold, strong { font-weight: bold; }
          .text-center { text-align: center; }
          .text-end { text-align: right; }
          .cell-num { text-align: right; white-space: nowrap; }
          .cell-center { text-align: center; white-space: nowrap; }
          .cell-desc { text-align: left; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${contentHtml}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlDoc], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

(typeof window !== 'undefined' ? window : global).ExportWord = ExportWord;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportWord;
}
