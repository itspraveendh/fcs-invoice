/**
 * Canva-Style High-Fidelity PDF Export Engine
 * 
 * Architecture:
 * 1. Dedicated Off-Screen Document Rendering Sandbox (decoupled from editor controls & preview panel)
 * 2. Pre-render Layout & Data Quality Validation
 * 3. Page-by-Page High-Resolution Vector/Canvas Capture (no slicing across table rows)
 * 4. Exact Physical Millimeter Geometry matching A4 Portrait, A4 Landscape, A5, Letter, Legal
 * 5. 100% preservation of Excel colors, borders, Bookman Old Style & Calibri fonts, logos, and signatures
 */

const ExportPdf = {
  /**
   * Pre-export Quality Control & Layout Validation
   * @param {Object} invoice
   * @returns {Object} { valid: boolean, warnings: Array<string> }
   */
  validateInvoice(invoice) {
    const warnings = [];
    if (!invoice) {
      warnings.push('No invoice data provided.');
      return { valid: false, warnings };
    }

    if (!invoice.invoiceNo || invoice.invoiceNo.trim() === '') {
      warnings.push('Invoice number is missing.');
    }
    if (!invoice.items || invoice.items.length === 0) {
      warnings.push('Invoice contains no product or service line items.');
    }
    if (!invoice.client || (!invoice.client.name && !invoice.client.companyName)) {
      warnings.push('Client billing information is incomplete.');
    }

    // Check if table column count is safe for portrait
    const customColCount = (invoice.customColumns || []).length;
    if (customColCount > 3 && (!invoice.orientation || invoice.orientation === 'portrait')) {
      warnings.push('You have enabled several custom columns. If columns appear narrow, consider exporting in A4 Landscape.');
    }

    return {
      valid: warnings.length === 0,
      warnings,
      itemCount: (invoice.items || []).length
    };
  },

  /**
   * Main Export function
   * @param {Object} invoice - Invoice data object
   * @param {Object} exportOptions - { pageSize, orientation, scale }
   */
  async export(invoice, exportOptions = {}) {
    if (!invoice) {
      alert('No invoice data provided to export.');
      return;
    }

    // Run Quality Control
    const validation = this.validateInvoice(invoice);
    if (!validation.valid && validation.warnings.length > 0) {
      console.warn('Invoice layout warnings:', validation.warnings);
    }

    // Check libraries
    if (typeof html2canvas === 'undefined' || (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined')) {
      console.warn('PDF export libraries not detected. Falling back to browser Print.');
      window.print();
      return;
    }

    const filename = `${invoice.invoiceNo || 'Invoice'}.pdf`;

    // Show loading overlay
    let loadingEl = document.getElementById('pdf-export-loading');
    if (!loadingEl) {
      loadingEl = document.createElement('div');
      loadingEl.id = 'pdf-export-loading';
      loadingEl.className = 'export-loading-overlay';
      loadingEl.innerHTML = `
        <div class="card p-4 shadow-lg text-center border-0" style="max-width: 400px; border-radius: 12px;">
          <div class="spinner-border text-primary mx-auto mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
          <h5 class="fw-bold mb-1">Generating Canva-Style PDF</h5>
          <p class="text-muted small mb-0">Rendering multi-page document with exact Excel layout & typography...</p>
        </div>
      `;
      document.body.appendChild(loadingEl);
    }
    loadingEl.style.display = 'flex';

    // Dedicated off-screen sandbox
    let sandbox = null;

    try {
      const pageSize = exportOptions.pageSize || invoice.pageSize || 'a4';
      const orientation = exportOptions.orientation || invoice.orientation || 'portrait';
      const isLandscape = (orientation === 'landscape');

      let sandboxWidth = '210mm';
      if (pageSize === 'a5') sandboxWidth = isLandscape ? '210mm' : '148mm';
      else if (pageSize === 'letter') sandboxWidth = isLandscape ? '279.4mm' : '215.9mm';
      else if (pageSize === 'legal') sandboxWidth = isLandscape ? '355.6mm' : '215.9mm';
      else sandboxWidth = isLandscape ? '297mm' : '210mm';

      // Create isolated sandbox outside the viewport
      sandbox = document.createElement('div');
      sandbox.id = 'document-export-sandbox';
      sandbox.style.cssText = `
        position: fixed !important;
        left: -99999px !important;
        top: 0 !important;
        width: ${sandboxWidth} !important;
        background: #ffffff !important;
        z-index: -99999 !important;
        opacity: 1 !important;
        pointer-events: none !important;
        transform: none !important;
        margin: 0 !important;
        padding: 0 !important;
      `;
      document.body.appendChild(sandbox);

      // Render document cleanly into sandbox
      const ds = (typeof window !== 'undefined' ? window.DataStore : null) || (typeof DataStore !== 'undefined' ? DataStore : null);
      const template = (ds && invoice.templateId) ? ds.getTemplate(invoice.templateId) : null;

      const renderedHtml = TemplateEngine.renderInvoice(invoice, template, {
        pageSize,
        orientation,
        isExport: true
      });
      sandbox.innerHTML = renderedHtml;

      // Ensure all images are fully loaded and decoded
      const imgElements = Array.from(sandbox.querySelectorAll('img'));
      await Promise.all(imgElements.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = () => resolve();
          img.onerror = () => {
            console.warn('Image failed to load in PDF export sandbox:', img.src);
            resolve();
          };
        });
      }));

      // Find all discrete pages generated by TemplateEngine
      const pageElements = sandbox.querySelectorAll('.invoice-page');
      if (!pageElements || pageElements.length === 0) {
        throw new Error('No invoice pages were rendered into the export sandbox.');
      }

      // Initialize jsPDF with standard physical units
      const { jsPDF } = window.jspdf || window;
      const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', pageSize);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Render each page individually to a crystal-clear canvas (Scale 2.5 for ~240 DPI)
      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];

        const canvas = await html2canvas(pageEl, {
          scale: 2.5, // High-DPI sharpness
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: pageEl.offsetWidth,
          height: pageEl.offsetHeight,
          scrollX: 0,
          scrollY: 0
        });

        if (i > 0) {
          pdf.addPage(pageSize, isLandscape ? 'l' : 'p');
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      // Save the final PDF
      pdf.save(filename);

    } catch (err) {
      console.error('High-Fidelity PDF Export Error:', err);
      if (confirm('PDF generation encountered an issue. Would you like to use your browser Print-to-PDF instead?')) {
        window.print();
      }
    } finally {
      // Clean up sandbox
      if (sandbox && sandbox.parentNode) {
        sandbox.parentNode.removeChild(sandbox);
      }
      if (loadingEl) {
        loadingEl.style.display = 'none';
      }
    }
  },

  /**
   * Browser print trigger
   */
  print() {
    window.print();
  }
};

(typeof window !== 'undefined' ? window : global).ExportPdf = ExportPdf;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportPdf;
}
