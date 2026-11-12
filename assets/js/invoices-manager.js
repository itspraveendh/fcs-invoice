/**
 * Invoice Management Controller (invoices.html)
 * Manages tabs, filtering, sorting, payment tracking, duplicate & delete operations.
 */

const InvoicesManager = {
  currentTab: 'all',
  activeInvoiceForPayment: null,

  init() {
    this.populateClientFilter();
    this.bindEvents();
    this.loadFromUrl();
    this.render();
  },

  loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    if (search) {
      const searchInput = document.getElementById('filter-search');
      if (searchInput) searchInput.value = search;
    }
  },

  populateClientFilter() {
    const select = document.getElementById('filter-client');
    if (!select) return;

    const clients = DataStore.getClients();
    select.innerHTML = '<option value="">All Clients</option>' +
      clients.map(c => `<option value="${c.id}">${c.companyName || c.name}</option>`).join('');
  },

  bindEvents() {
    // Tab switching
    document.querySelectorAll('.invoice-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.invoice-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTab = btn.getAttribute('data-status');
        this.render();
      });
    });

    // Filters
    ['filter-search', 'filter-client', 'filter-start-date', 'filter-end-date', 'filter-sort'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.render());
        el.addEventListener('change', () => this.render());
      }
    });

    // Payment form submit
    const paymentForm = document.getElementById('record-payment-form');
    if (paymentForm) {
      paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitPayment();
      });
    }
  },

  getFilters() {
    const search = document.getElementById('filter-search')?.value || '';
    const clientId = document.getElementById('filter-client')?.value || '';
    const startDate = document.getElementById('filter-start-date')?.value || '';
    const endDate = document.getElementById('filter-end-date')?.value || '';
    const sortVal = document.getElementById('filter-sort')?.value || 'date-desc';

    const [sortBy, sortOrder] = sortVal.split('-');

    return {
      status: this.currentTab,
      search,
      clientId,
      startDate,
      endDate,
      sortBy,
      sortOrder
    };
  },

  render() {
    const filters = this.getFilters();
    const invoices = DataStore.getInvoices(filters);
    const tbody = document.getElementById('invoices-table-tbody');
    if (!tbody) return;

    // Update tab counts
    this.updateTabCounters();

    if (invoices.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
            <h5>No Invoices Found</h5>
            <p class="small">Try adjusting your filters or search term, or create a new invoice.</p>
            <a href="create-invoice.html" class="btn btn-sm btn-primary mt-2">
              <i class="bi bi-plus-lg me-1"></i> Create New Invoice
            </a>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = invoices.map(inv => {
      const statusClass = `badge-status badge-${(inv.status || 'draft').toLowerCase().replace(' ', '-')}`;
      const clientName = (inv.client && (inv.client.companyName || inv.client.name)) || 'Walk-in Client';
      const balance = inv.balanceDue !== undefined ? inv.balanceDue : (inv.grandTotal - (inv.amountPaid || 0));

      return `
        <tr>
          <td>
            <a href="create-invoice.html?id=${inv.id}" class="fw-bold text-decoration-none text-primary">
              ${inv.invoiceNo}
            </a>
          </td>
          <td>
            <div class="fw-semibold text-truncate" style="max-width: 220px;">${clientName}</div>
            <small class="text-muted font-monospace">${(inv.client && inv.client.gstin) || 'No GSTIN'}</small>
          </td>
          <td>${Calculations.formatDate(inv.date, 'MMM DD, YYYY')}</td>
          <td>${Calculations.formatDate(inv.dueDate, 'MMM DD, YYYY') || '-'}</td>
          <td class="text-end fw-bold">${Calculations.formatCurrency(inv.grandTotal)}</td>
          <td class="text-end text-success font-monospace">${Calculations.formatCurrency(inv.amountPaid || 0)}</td>
          <td class="text-end ${balance > 0 ? 'text-danger fw-bold' : 'text-muted'} font-monospace">
            ${Calculations.formatCurrency(balance)}
          </td>
          <td class="text-center">
            <span class="${statusClass}">${inv.status}</span>
          </td>
          <td class="text-end">
            <div class="dropdown">
              <button class="btn btn-sm btn-light border p-1 px-2" data-bs-toggle="dropdown">
                <i class="bi bi-three-dots-vertical"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                <li><a class="dropdown-item" href="create-invoice.html?id=${inv.id}"><i class="bi bi-pencil me-2 text-primary"></i> Edit Invoice</a></li>
                <li><a class="dropdown-item" href="javascript:void(0)" onclick="InvoicesManager.openPaymentModal('${inv.id}')"><i class="bi bi-cash-coin me-2 text-success"></i> Record Payment</a></li>
                <li><a class="dropdown-item" href="javascript:void(0)" onclick="InvoicesManager.exportInvoice('${inv.id}', 'pdf')"><i class="bi bi-file-earmark-pdf me-2 text-danger"></i> Export PDF</a></li>
                <li><a class="dropdown-item" href="javascript:void(0)" onclick="InvoicesManager.exportInvoice('${inv.id}', 'xlsx')"><i class="bi bi-file-earmark-excel me-2 text-success"></i> Export Excel</a></li>
                <li><a class="dropdown-item" href="javascript:void(0)" onclick="InvoicesManager.exportInvoice('${inv.id}', 'docx')"><i class="bi bi-file-earmark-word me-2 text-primary"></i> Export Word</a></li>
                <li><a class="dropdown-item" href="javascript:void(0)" onclick="InvoicesManager.exportInvoice('${inv.id}', 'csv')"><i class="bi bi-file-earmark-spreadsheet me-2 text-info"></i> Export CSV</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="javascript:void(0)" onclick="InvoicesManager.duplicateInvoice('${inv.id}')"><i class="bi bi-copy me-2 text-secondary"></i> Duplicate</a></li>
                <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="InvoicesManager.deleteInvoice('${inv.id}')"><i class="bi bi-trash me-2"></i> Delete</a></li>
              </ul>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  updateTabCounters() {
    const all = DataStore.getInvoices();
    const countStatus = (s) => all.filter(inv => inv.status && inv.status.toLowerCase() === s.toLowerCase()).length;

    const setBadge = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = count;
    };

    setBadge('count-all', all.length);
    setBadge('count-draft', countStatus('Draft'));
    setBadge('count-sent', countStatus('Sent'));
    setBadge('count-paid', countStatus('Paid'));
    setBadge('count-partially-paid', countStatus('Partially Paid'));
    setBadge('count-overdue', countStatus('Overdue'));
  },

  openPaymentModal(invoiceId) {
    const inv = DataStore.getInvoice(invoiceId);
    if (!inv) return;

    this.activeInvoiceForPayment = inv;
    const balance = inv.balanceDue !== undefined ? inv.balanceDue : (inv.grandTotal - (inv.amountPaid || 0));

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal('pay-invoice-no', inv.invoiceNo);
    setVal('pay-grand-total', Calculations.formatCurrency(inv.grandTotal));
    setVal('pay-balance-due', Calculations.formatCurrency(balance));
    setVal('pay-date', Calculations.formatDate(new Date(), 'YYYY-MM-DD'));
    setVal('pay-amount', balance > 0 ? balance : 0);
    setVal('pay-ref', '');
    setVal('pay-notes', '');

    // Render payment history in modal
    const historyContainer = document.getElementById('payment-history-container');
    if (historyContainer) {
      const payments = inv.payments || [];
      if (payments.length === 0) {
        historyContainer.innerHTML = '<div class="text-muted small">No payments recorded yet.</div>';
      } else {
        historyContainer.innerHTML = `
          <div class="table-responsive mt-2">
            <table class="table table-sm table-bordered small">
              <thead class="table-light">
                <tr><th>Date</th><th>Amount</th><th>Method</th><th>Ref</th></tr>
              </thead>
              <tbody>
                ${payments.map(p => `
                  <tr>
                    <td>${Calculations.formatDate(p.date)}</td>
                    <td class="fw-bold text-success">${Calculations.formatCurrency(p.amount)}</td>
                    <td>${p.method || 'NEFT'}</td>
                    <td>${p.ref || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    }

    const modalEl = document.getElementById('payment-modal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  },

  submitPayment() {
    if (!this.activeInvoiceForPayment) return;

    const amount = parseFloat(document.getElementById('pay-amount')?.value) || 0;
    const date = document.getElementById('pay-date')?.value || Calculations.formatDate(new Date(), 'YYYY-MM-DD');
    const method = document.getElementById('pay-method')?.value || 'NEFT';
    const ref = document.getElementById('pay-ref')?.value || '';
    const notes = document.getElementById('pay-notes')?.value || '';

    if (amount <= 0) {
      UI.showToast('Please enter a valid payment amount greater than 0', 'danger');
      return;
    }

    DataStore.addPayment(this.activeInvoiceForPayment.id, {
      date,
      amount,
      method,
      ref,
      notes
    });

    UI.showToast(`Payment of ${Calculations.formatCurrency(amount)} recorded successfully!`, 'success');

    // Close modal
    const modalEl = document.getElementById('payment-modal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }

    this.render();
  },

  duplicateInvoice(id) {
    const copy = DataStore.duplicateInvoice(id);
    if (copy) {
      UI.showToast(`Invoice duplicated as ${copy.invoiceNo}`, 'success');
      this.render();
    }
  },

  deleteInvoice(id) {
    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      DataStore.deleteInvoice(id);
      UI.showToast('Invoice deleted', 'success');
      this.render();
    }
  },

  exportInvoice(id, format) {
    const inv = DataStore.getInvoice(id);
    if (!inv) return;

    if (format === 'xlsx') {
      ExportExcel.export(inv);
    } else if (format === 'docx') {
      ExportWord.export(inv);
    } else if (format === 'csv') {
      ExportCsv.exportInvoice(inv);
    } else if (format === 'pdf') {
      if (typeof ExportPdf !== 'undefined') {
        ExportPdf.export(inv);
      } else {
        window.location.href = `create-invoice.html?id=${id}&autoExport=pdf`;
      }
    }
  },

  exportAllListCsv() {
    const filters = this.getFilters();
    const invoices = DataStore.getInvoices(filters);
    ExportCsv.exportInvoicesList(invoices);
  }
};

window.InvoicesManager = InvoicesManager;

