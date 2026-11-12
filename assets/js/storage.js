/**
 * Centralized DataStore Service
 * Abstraction layer for all application data storage.
 * Built on LocalStorage with Promise-ready architecture for seamless future PHP/MySQL API integration.
 */

const STORAGE_KEYS = {
  COMPANY: 'fab_invoice_company',
  CLIENTS: 'fab_invoice_clients',
  INVOICES: 'fab_invoice_invoices',
  TEMPLATES: 'fab_invoice_templates',
  TERMS: 'fab_invoice_terms',
  BANKS: 'fab_invoice_banks',
  CATALOG: 'fab_invoice_catalog',
  SETTINGS: 'fab_invoice_settings',
  THEME: 'fab_invoice_theme'
};

const DataStore = {
  /**
   * Initialize data store with default sample data if not present
   */
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.COMPANY)) {
      this.resetToDemo();
    } else {
      // Ensure templates exist and include original Excel template
      const existingTemplates = this.getTemplates();
      if (!existingTemplates || existingTemplates.length === 0) {
        localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(window.DEFAULT_DATA.templates));
      }
    }
  },

  /**
   * Reset all data to factory demo state from DEFAULT_DATA
   */
  resetToDemo() {
    const d = window.DEFAULT_DATA;
    if (!d) return;
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(d.company));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(d.clients));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(d.invoices));
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(d.templates));
    localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(d.termsPresets));
    localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(d.bankAccounts));
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(d.catalog));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(d.settings));
    localStorage.setItem(STORAGE_KEYS.THEME, d.settings.theme || 'light');
  },

  // ================= COMPANY PROFILE =================
  getCompany() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPANY);
      return data ? JSON.parse(data) : { ...window.DEFAULT_DATA.company };
    } catch (e) {
      console.error('Error reading company data', e);
      return { ...window.DEFAULT_DATA.company };
    }
  },

  saveCompany(companyData) {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(companyData));
    return companyData;
  },

  // ================= CLIENT MANAGEMENT =================
  getClients() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading clients', e);
      return [];
    }
  },

  getClient(id) {
    const clients = this.getClients();
    return clients.find(c => c.id === id) || null;
  },

  saveClient(clientData) {
    const clients = this.getClients();
    if (!clientData.id) {
      clientData.id = 'client-' + Date.now();
      clients.push(clientData);
    } else {
      const idx = clients.findIndex(c => c.id === clientData.id);
      if (idx !== -1) {
        clients[idx] = { ...clients[idx], ...clientData };
      } else {
        clients.push(clientData);
      }
    }
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    return clientData;
  },

  deleteClient(id) {
    let clients = this.getClients();
    clients = clients.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    return true;
  },

  // ================= INVOICE MANAGEMENT =================
  getInvoices(filters = {}) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
      let invoices = data ? JSON.parse(data) : [];

      if (filters.status && filters.status !== 'all') {
        invoices = invoices.filter(inv => inv.status && inv.status.toLowerCase() === filters.status.toLowerCase());
      }
      if (filters.clientId) {
        invoices = invoices.filter(inv => inv.clientId === filters.clientId);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        invoices = invoices.filter(inv => 
          (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(q)) ||
          (inv.client && inv.client.name && inv.client.name.toLowerCase().includes(q)) ||
          (inv.poNumber && inv.poNumber.toLowerCase().includes(q))
        );
      }
      if (filters.startDate) {
        invoices = invoices.filter(inv => inv.date >= filters.startDate);
      }
      if (filters.endDate) {
        invoices = invoices.filter(inv => inv.date <= filters.endDate);
      }

      // Sort
      if (filters.sortBy === 'amount') {
        invoices.sort((a, b) => (filters.sortOrder === 'asc' ? a.grandTotal - b.grandTotal : b.grandTotal - a.grandTotal));
      } else {
        // default by date descending
        invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      return invoices;
    } catch (e) {
      console.error('Error reading invoices', e);
      return [];
    }
  },

  getInvoice(id) {
    const invoices = this.getInvoices();
    return invoices.find(inv => inv.id === id) || null;
  },

  isInvoiceNumberUnique(invoiceNo, excludeId = null) {
    if (!invoiceNo) return true;
    const cleanNo = invoiceNo.trim().toLowerCase();
    const invoices = this.getInvoices();
    return !invoices.some(inv => inv.id !== excludeId && inv.invoiceNo && inv.invoiceNo.trim().toLowerCase() === cleanNo);
  },

  getNextInvoiceNumber() {
    const settings = this.getSettings();
    const prefix = settings.invoicePrefix || 'FSE';
    const fy = settings.financialYear || '2026-27';
    let nextNum = settings.nextSerial || 1;

    // Check if nextNum is already used, increment if needed
    const invoices = this.getInvoices();
    while (invoices.some(inv => inv.invoiceNo === Calculations.generateInvoiceNumber(prefix, fy, nextNum))) {
      nextNum++;
    }

    return Calculations.generateInvoiceNumber(prefix, fy, nextNum);
  },

  saveInvoice(invoiceData) {
    const invoices = this.getInvoices();
    if (!invoiceData.id) {
      invoiceData.id = 'inv-' + Date.now();
      invoices.unshift(invoiceData);
      // Increment next serial in settings if matches generated pattern
      const settings = this.getSettings();
      settings.nextSerial = (settings.nextSerial || 1) + 1;
      this.saveSettings(settings);
    } else {
      const idx = invoices.findIndex(inv => inv.id === invoiceData.id);
      if (idx !== -1) {
        invoices[idx] = { ...invoices[idx], ...invoiceData };
      } else {
        invoices.unshift(invoiceData);
      }
    }
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    return invoiceData;
  },

  deleteInvoice(id) {
    let invoices = this.getInvoices();
    invoices = invoices.filter(inv => inv.id !== id);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    return true;
  },

  duplicateInvoice(id) {
    const source = this.getInvoice(id);
    if (!source) return null;

    const copy = JSON.parse(JSON.stringify(source));
    copy.id = 'inv-' + Date.now();
    copy.invoiceNo = this.getNextInvoiceNumber();
    copy.date = Calculations.formatDate(new Date(), 'YYYY-MM-DD');
    copy.status = 'Draft';
    copy.payments = [];
    copy.amountPaid = 0;
    copy.balanceDue = copy.grandTotal;

    return this.saveInvoice(copy);
  },

  // ================= PAYMENT RECORDS =================
  addPayment(invoiceId, paymentRecord) {
    const invoice = this.getInvoice(invoiceId);
    if (!invoice) return null;

    if (!invoice.payments) invoice.payments = [];
    paymentRecord.id = 'pay-' + Date.now();
    invoice.payments.push(paymentRecord);

    // Update paid amount and balance
    const totalPaid = invoice.payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    invoice.amountPaid = Calculations.round(totalPaid, 2);
    invoice.balanceDue = Math.max(0, Calculations.round(invoice.grandTotal - invoice.amountPaid, 2));

    if (invoice.balanceDue <= 0) {
      invoice.status = 'Paid';
    } else if (invoice.amountPaid > 0) {
      invoice.status = 'Partially Paid';
    }

    this.saveInvoice(invoice);
    return invoice;
  },

  // ================= TEMPLATE MANAGEMENT =================
  getTemplates() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      return data ? JSON.parse(data) : [...window.DEFAULT_DATA.templates];
    } catch (e) {
      return [...window.DEFAULT_DATA.templates];
    }
  },

  getTemplate(id) {
    const templates = this.getTemplates();
    return templates.find(t => t.id === id) || templates[0];
  },

  saveTemplate(templateData) {
    const templates = this.getTemplates();
    if (!templateData.id) {
      templateData.id = 'tpl-' + Date.now();
      templates.push(templateData);
    } else {
      const idx = templates.findIndex(t => t.id === templateData.id);
      if (idx !== -1) {
        templates[idx] = { ...templates[idx], ...templateData };
      } else {
        templates.push(templateData);
      }
    }
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    return templateData;
  },

  deleteTemplate(id) {
    if (id === 'tpl-fab-excel') {
      throw new Error('The default Fab Steel Engineering Excel template cannot be deleted.');
    }
    let templates = this.getTemplates();
    templates = templates.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    return true;
  },

  duplicateTemplate(id) {
    const source = this.getTemplate(id);
    if (!source) return null;
    const copy = JSON.parse(JSON.stringify(source));
    copy.id = 'tpl-' + Date.now();
    copy.name = copy.name + ' (Copy)';
    copy.isDefault = false;
    return this.saveTemplate(copy);
  },

  resetTemplates() {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(window.DEFAULT_DATA.templates));
    return this.getTemplates();
  },

  // ================= TERMS PRESETS =================
  getTermsPresets() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TERMS);
      return data ? JSON.parse(data) : [...window.DEFAULT_DATA.termsPresets];
    } catch (e) {
      return [...window.DEFAULT_DATA.termsPresets];
    }
  },

  getTermsPreset(id) {
    const presets = this.getTermsPresets();
    return presets.find(p => p.id === id) || presets[0];
  },

  saveTermsPreset(presetData) {
    const presets = this.getTermsPresets();
    if (!presetData.id) {
      presetData.id = 'terms-' + Date.now();
      presets.push(presetData);
    } else {
      const idx = presets.findIndex(p => p.id === presetData.id);
      if (idx !== -1) {
        presets[idx] = { ...presets[idx], ...presetData };
      } else {
        presets.push(presetData);
      }
    }
    localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(presets));
    return presetData;
  },

  deleteTermsPreset(id) {
    let presets = this.getTermsPresets();
    presets = presets.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(presets));
    return true;
  },

  // ================= BANK ACCOUNTS =================
  getBankAccounts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BANKS);
      return data ? JSON.parse(data) : [...window.DEFAULT_DATA.bankAccounts];
    } catch (e) {
      return [...window.DEFAULT_DATA.bankAccounts];
    }
  },

  getBankAccount(id) {
    const banks = this.getBankAccounts();
    return banks.find(b => b.id === id) || banks[0];
  },

  saveBankAccount(bankData) {
    const banks = this.getBankAccounts();
    if (bankData.isDefault) {
      banks.forEach(b => b.isDefault = false);
    }
    if (!bankData.id) {
      bankData.id = 'bank-' + Date.now();
      banks.push(bankData);
    } else {
      const idx = banks.findIndex(b => b.id === bankData.id);
      if (idx !== -1) {
        banks[idx] = { ...banks[idx], ...bankData };
      } else {
        banks.push(bankData);
      }
    }
    localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(banks));
    return bankData;
  },

  deleteBankAccount(id) {
    let banks = this.getBankAccounts();
    banks = banks.filter(b => b.id !== id);
    if (banks.length > 0 && !banks.some(b => b.isDefault)) {
      banks[0].isDefault = true;
    }
    localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(banks));
    return true;
  },

  // ================= PRODUCT / SERVICE CATALOG =================
  getCatalog() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATALOG);
      return data ? JSON.parse(data) : [...window.DEFAULT_DATA.catalog];
    } catch (e) {
      return [...window.DEFAULT_DATA.catalog];
    }
  },

  saveCatalogItem(item) {
    const catalog = this.getCatalog();
    if (!item.id) {
      item.id = 'prod-' + Date.now();
      catalog.push(item);
    } else {
      const idx = catalog.findIndex(p => p.id === item.id);
      if (idx !== -1) {
        catalog[idx] = { ...catalog[idx], ...item };
      } else {
        catalog.push(item);
      }
    }
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(catalog));
    return item;
  },

  deleteCatalogItem(id) {
    let catalog = this.getCatalog();
    catalog = catalog.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(catalog));
    return true;
  },

  // ================= GENERAL SETTINGS =================
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : { ...window.DEFAULT_DATA.settings };
    } catch (e) {
      return { ...window.DEFAULT_DATA.settings };
    }
  },

  saveSettings(settingsData) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsData));
    return settingsData;
  },

  // ================= THEME =================
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
  },

  // ================= BACKUP & RESTORE =================
  exportAll() {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      company: this.getCompany(),
      clients: this.getClients(),
      invoices: this.getInvoices(),
      templates: this.getTemplates(),
      termsPresets: this.getTermsPresets(),
      bankAccounts: this.getBankAccounts(),
      catalog: this.getCatalog(),
      settings: this.getSettings()
    };
    return JSON.stringify(payload, null, 2);
  },

  importAll(jsonStringOrObj) {
    try {
      const data = typeof jsonStringOrObj === 'string' ? JSON.parse(jsonStringOrObj) : jsonStringOrObj;
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid backup file: not a JSON object');
      }

      if (data.company) localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(data.company));
      if (data.clients) localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(data.clients));
      if (data.invoices) localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(data.invoices));
      if (data.templates) localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(data.templates));
      if (data.termsPresets) localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(data.termsPresets));
      if (data.bankAccounts) localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(data.bankAccounts));
      if (data.catalog) localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(data.catalog));
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));

      return { success: true, message: 'All data successfully imported.' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    return true;
  }
};

// Initialize immediately on script load
DataStore.init();
window.DataStore = DataStore;
if (typeof global !== 'undefined') {
  global.DataStore = DataStore;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataStore;
}
