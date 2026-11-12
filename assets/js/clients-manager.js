/**
 * Client Management Controller (clients.html)
 * Client CRM with history, financial summaries, CSV import/export.
 */

const ClientsManager = {
  currentClientId: null,

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    const searchInput = document.getElementById('client-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.render());
    }

    const form = document.getElementById('client-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveClientForm();
      });
    }

    const csvInput = document.getElementById('client-csv-file-input');
    if (csvInput) {
      csvInput.addEventListener('change', (e) => this.handleCsvImport(e));
    }
  },

  render() {
    const query = document.getElementById('client-search')?.value.toLowerCase().trim() || '';
    let clients = DataStore.getClients();

    if (query) {
      clients = clients.filter(c => 
        (c.companyName && c.companyName.toLowerCase().includes(query)) ||
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.gstin && c.gstin.toLowerCase().includes(query)) ||
        (c.state && c.state.toLowerCase().includes(query))
      );
    }

    const allInvoices = DataStore.getInvoices();
    const tbody = document.getElementById('clients-table-tbody');
    if (!tbody) return;

    if (clients.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5 text-muted">
            <i class="bi bi-people fs-2 d-block mb-2"></i>
            <h5>No Clients Found</h5>
            <p class="small">Add your first business client to start billing seamlessly.</p>
            <button class="btn btn-sm btn-primary mt-1" onclick="ClientsManager.openAddModal()">
              <i class="bi bi-plus-lg me-1"></i> Add Client
            </button>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = clients.map(client => {
      // Calculate financial statistics for this client
      const clientInvoices = allInvoices.filter(inv => inv.clientId === client.id);
      const totalInvoiced = clientInvoices.reduce((acc, inv) => acc + (parseFloat(inv.grandTotal) || 0), 0);
      const totalPaid = clientInvoices.reduce((acc, inv) => acc + (parseFloat(inv.amountPaid) || 0), 0);
      const outstanding = Math.max(0, totalInvoiced - totalPaid);

      return `
        <tr>
          <td>
            <div class="fw-bold text-primary">${client.companyName || client.name}</div>
            <div class="small text-muted">${client.contactPerson ? 'Contact: ' + client.contactPerson : ''}</div>
          </td>
          <td>
            <div class="small"><strong>GSTIN:</strong> <span class="font-monospace">${client.gstin || '-'}</span></div>
            <div class="small text-muted"><strong>PAN:</strong> <span class="font-monospace">${client.pan || '-'}</span></div>
          </td>
          <td>
            <div>${client.state || '-'} <span class="badge bg-light text-dark border">Code: ${client.stateCode || '-'}</span></div>
            <div class="small text-muted text-truncate" style="max-width: 250px;">${client.address || ''}</div>
          </td>
          <td class="text-center">
            <span class="badge bg-primary-subtle text-primary border">${clientInvoices.length} Invoices</span>
          </td>
          <td class="text-end fw-semibold">
            ${Calculations.formatCurrency(totalInvoiced)}
          </td>
          <td class="text-end font-monospace ${outstanding > 0 ? 'text-danger fw-bold' : 'text-success'}">
            ${Calculations.formatCurrency(outstanding)}
          </td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <a href="create-invoice.html?clientId=${client.id}" class="btn btn-outline-primary" title="New Invoice for Client">
                <i class="bi bi-plus-circle"></i>
              </a>
              <button class="btn btn-outline-secondary" onclick="ClientsManager.openViewModal('${client.id}')" title="View Invoices History">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-outline-secondary" onclick="ClientsManager.openEditModal('${client.id}')" title="Edit Client">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-outline-danger" onclick="ClientsManager.deleteClient('${client.id}')" title="Delete Client">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openAddModal() {
    this.currentClientId = null;
    document.getElementById('client-modal-title').textContent = 'Add New Client';
    document.getElementById('client-form').reset();
    document.getElementById('client-id').value = '';

    const modalEl = document.getElementById('client-modal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      new bootstrap.Modal(modalEl).show();
    }
  },

  openEditModal(clientId) {
    const client = DataStore.getClient(clientId);
    if (!client) return;

    this.currentClientId = client.id;
    document.getElementById('client-modal-title').textContent = 'Edit Client Details';

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('client-id', client.id);
    setVal('modal-client-name', client.name || client.companyName);
    setVal('modal-client-company', client.companyName || client.name);
    setVal('modal-client-contact', client.contactPerson);
    setVal('modal-client-email', client.email);
    setVal('modal-client-phone', client.phone);
    setVal('modal-client-gstin', client.gstin);
    setVal('modal-client-pan', client.pan);
    setVal('modal-client-state', client.state);
    setVal('modal-client-state-code', client.stateCode);
    setVal('modal-client-address', client.address);

    const modalEl = document.getElementById('client-modal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      new bootstrap.Modal(modalEl).show();
    }
  },

  openViewModal(clientId) {
    const client = DataStore.getClient(clientId);
    if (!client) return;

    const invoices = DataStore.getInvoices({ clientId: client.id });
    const modalBody = document.getElementById('client-details-body');
    if (!modalBody) return;

    const totalInvoiced = invoices.reduce((acc, inv) => acc + (parseFloat(inv.grandTotal) || 0), 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + (parseFloat(inv.amountPaid) || 0), 0);
    const outstanding = Math.max(0, totalInvoiced - totalPaid);

    modalBody.innerHTML = `
      <div class="p-3 bg-light rounded border mb-3">
        <h5 class="fw-bold mb-1">${client.companyName || client.name}</h5>
        <div class="small text-muted mb-2">${client.address}</div>
        <div class="row g-2 small">
          <div class="col-6"><strong>GSTIN:</strong> ${client.gstin || '-'}</div>
          <div class="col-6"><strong>PAN:</strong> ${client.pan || '-'}</div>
          <div class="col-6"><strong>Email:</strong> ${client.email || '-'}</div>
          <div class="col-6"><strong>Phone:</strong> ${client.phone || '-'}</div>
          <div class="col-6"><strong>State:</strong> ${client.state} (${client.stateCode})</div>
        </div>
      </div>

      <div class="row g-2 mb-3">
        <div class="col-4">
          <div class="p-2 border rounded text-center">
            <small class="text-muted d-block">Total Invoiced</small>
            <span class="fw-bold">${Calculations.formatCurrency(totalInvoiced)}</span>
          </div>
        </div>
        <div class="col-4">
          <div class="p-2 border rounded text-center">
            <small class="text-muted d-block">Total Paid</small>
            <span class="fw-bold text-success">${Calculations.formatCurrency(totalPaid)}</span>
          </div>
        </div>
        <div class="col-4">
          <div class="p-2 border rounded text-center">
            <small class="text-muted d-block">Outstanding</small>
            <span class="fw-bold ${outstanding > 0 ? 'text-danger' : 'text-muted'}">${Calculations.formatCurrency(outstanding)}</span>
          </div>
        </div>
      </div>

      <h6 class="fw-bold">Client Invoices History</h6>
      <div class="table-responsive">
        <table class="table table-sm table-bordered small">
          <thead class="table-light">
            <tr><th>Invoice No</th><th>Date</th><th>Amount</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${invoices.length === 0 ? '<tr><td colspan="5" class="text-center text-muted">No invoices recorded yet.</td></tr>' : ''}
            ${invoices.map(inv => `
              <tr>
                <td class="fw-bold font-monospace">${inv.invoiceNo}</td>
                <td>${Calculations.formatDate(inv.date)}</td>
                <td class="text-end fw-bold">${Calculations.formatCurrency(inv.grandTotal)}</td>
                <td><span class="badge bg-light text-dark border">${inv.status}</span></td>
                <td class="text-center">
                  <a href="create-invoice.html?id=${inv.id}" class="btn btn-xs btn-outline-primary py-0 px-1">Open</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    const modalEl = document.getElementById('client-details-modal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      new bootstrap.Modal(modalEl).show();
    }
  },

  saveClientForm() {
    const getVal = (id) => document.getElementById(id)?.value.trim() || '';

    const clientData = {
      id: document.getElementById('client-id')?.value || null,
      name: getVal('modal-client-company') || getVal('modal-client-name'),
      companyName: getVal('modal-client-company') || getVal('modal-client-name'),
      contactPerson: getVal('modal-client-contact'),
      email: getVal('modal-client-email'),
      phone: getVal('modal-client-phone'),
      gstin: getVal('modal-client-gstin').toUpperCase(),
      pan: getVal('modal-client-pan').toUpperCase(),
      state: getVal('modal-client-state'),
      stateCode: getVal('modal-client-state-code'),
      address: getVal('modal-client-address')
    };

    if (!clientData.name) {
      UI.showToast('Please enter a Client or Company Name', 'danger');
      return;
    }

    DataStore.saveClient(clientData);
    UI.showToast('Client saved successfully', 'success');

    // Close modal
    const modalEl = document.getElementById('client-modal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }

    this.render();
  },

  deleteClient(id) {
    if (confirm('Are you sure you want to delete this client? Existing invoices will retain their historical record.')) {
      DataStore.deleteClient(id);
      UI.showToast('Client removed', 'success');
      this.render();
    }
  },

  exportClientsCsv() {
    const clients = DataStore.getClients();
    if (clients.length === 0) {
      alert('No clients to export');
      return;
    }

    const headers = ['Name', 'Company Name', 'Contact Person', 'Email', 'Phone', 'GSTIN', 'PAN', 'State', 'State Code', 'Address'];
    const rows = clients.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.companyName || '').replace(/"/g, '""')}"`,
      `"${(c.contactPerson || '').replace(/"/g, '""')}"`,
      c.email || '',
      c.phone || '',
      c.gstin || '',
      c.pan || '',
      c.state || '',
      c.stateCode || '',
      `"${(c.address || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    ExportCsv.downloadFile(csvContent, `clients_${new Date().toISOString().slice(0, 10)}.csv`);
  },

  handleCsvImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length <= 1) {
          alert('CSV file is empty or contains only header.');
          return;
        }

        let importedCount = 0;
        // Parse CSV lines
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
          if (parts[0] || parts[1]) {
            DataStore.saveClient({
              name: parts[0] || parts[1],
              companyName: parts[1] || parts[0],
              contactPerson: parts[2] || '',
              email: parts[3] || '',
              phone: parts[4] || '',
              gstin: parts[5] || '',
              pan: parts[6] || '',
              state: parts[7] || '',
              stateCode: parts[8] || '',
              address: parts[9] || ''
            });
            importedCount++;
          }
        }

        UI.showToast(`Successfully imported ${importedCount} clients from CSV!`, 'success');
        this.render();
      } catch (err) {
        alert('Failed to parse CSV file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }
};

window.ClientsManager = ClientsManager;

