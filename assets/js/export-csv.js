/**
 * CSV Export Module
 * Exports invoice line items or list of invoices to clean CSV
 */

const ExportCsv = {
  /**
   * Export a single invoice's line items and breakdown
   */
  exportInvoice(invoice) {
    if (!invoice) return;

    const company = invoice.company || DataStore.getCompany();
    const client = invoice.client || {};
    const totals = Calculations.calculateTotals(invoice.items || [], {
      fromStateCode: company.stateCode,
      toStateCode: client.stateCode,
      enableRoundOff: invoice.enableRoundOff !== false,
      additionalCharges: invoice.additionalCharges || 0
    });

    const headers = [
      'S.No',
      'Description',
      'HSN/SAC',
      'Qty',
      'TON',
      'Rate',
      'Amount',
      'Discount',
      'Taxable Value',
      'CGST Rate %',
      'CGST Amount',
      'SGST Rate %',
      'SGST Amount',
      'IGST Rate %',
      'IGST Amount',
      'Total'
    ];

    const rows = totals.items.map((it, idx) => [
      it.sNo || (idx + 1),
      `"${(it.description || '').replace(/"/g, '""')}"`,
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

    // Total row
    rows.push([
      'TOTAL',
      'Summary',
      '',
      totals.totalQty,
      totals.totalTon,
      '',
      totals.subtotal,
      totals.totalDiscount,
      totals.taxableAmount,
      '',
      totals.cgstTotal,
      '',
      totals.sgstTotal,
      '',
      totals.igstTotal,
      totals.grandTotal
    ]);

    let csvContent = `Invoice No,${invoice.invoiceNo}\n`;
    csvContent += `Invoice Date,${invoice.date}\n`;
    csvContent += `Client,"${(client.companyName || client.name || '').replace(/"/g, '""')}"\n`;
    csvContent += `GSTIN,${client.gstin || ''}\n\n`;
    csvContent += headers.join(',') + '\n';
    csvContent += rows.map(r => r.join(',')).join('\n');

    this.downloadFile(csvContent, `${invoice.invoiceNo || 'Invoice'}_items.csv`);
  },

  /**
   * Export all invoices list to CSV
   */
  exportInvoicesList(invoices) {
    if (!invoices || invoices.length === 0) {
      alert('No invoices to export');
      return;
    }

    const headers = [
      'Invoice No',
      'Date',
      'Due Date',
      'Client Name',
      'Client GSTIN',
      'PO Number',
      'Taxable Amount',
      'CGST',
      'SGST',
      'IGST',
      'Total Tax',
      'Grand Total',
      'Status',
      'Amount Paid',
      'Balance Due'
    ];

    const rows = invoices.map(inv => [
      inv.invoiceNo,
      inv.date,
      inv.dueDate || '',
      `"${((inv.client && (inv.client.companyName || inv.client.name)) || '').replace(/"/g, '""')}"`,
      (inv.client && inv.client.gstin) || '',
      inv.poNumber || '',
      inv.taxableAmount || 0,
      inv.cgstTotal || 0,
      inv.sgstTotal || 0,
      inv.igstTotal || 0,
      inv.totalTax || 0,
      inv.grandTotal || 0,
      inv.status || 'Draft',
      inv.amountPaid || 0,
      inv.balanceDue || 0
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadFile(csvContent, `invoices_export_${new Date().toISOString().slice(0, 10)}.csv`);
  },

  downloadFile(content, filename) {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

(typeof window !== 'undefined' ? window : global).ExportCsv = ExportCsv;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportCsv;
}

