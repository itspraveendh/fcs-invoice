/**
 * Settings & Configuration Controller (settings.html)
 * Manages Company Profile, Bank Accounts, Product Catalog, Terms Presets, and Data Backup/Restore.
 */

const SettingsManager = {
  init() {
    this.populateCompanyForm();
    this.populateGeneralSettingsForm();
    this.renderBankAccountsList();
    this.renderCatalogList();
    this.renderTermsPresetsList();
    this.bindEvents();
  },

  populateCompanyForm() {
    const comp = DataStore.getCompany();
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('comp-name', comp.name);
    setVal('comp-address', comp.address);
    setVal('comp-phone', comp.phone);
    setVal('comp-email', comp.email);
    setVal('comp-gstin', comp.gstin);
    setVal('comp-pan', comp.pan);
    setVal('comp-state', comp.state);
    setVal('comp-state-code', comp.stateCode);
    setVal('comp-udyam', comp.udyamNo);
    setVal('comp-website', comp.website);
    setVal('comp-pin', comp.pin);
    setVal('comp-city', comp.city);

    // Preview images
    const logoImg = document.getElementById('comp-logo-preview');
    if (logoImg && comp.logo) logoImg.src = comp.logo;

    const badgeImg = document.getElementById('comp-badge-preview');
    if (badgeImg && comp.badge) badgeImg.src = comp.badge;

    const sigImg = document.getElementById('comp-sig-preview');
    if (sigImg && comp.signature) sigImg.src = comp.signature;
  },

  populateGeneralSettingsForm() {
    const s = DataStore.getSettings();
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal('setting-currency', s.currency || 'INR');
    setVal('setting-fy', s.financialYear || '2026-27');
    setVal('setting-prefix', s.invoicePrefix || 'FSE');
    setVal('setting-payment-days', s.defaultPaymentDays || 21);
    setVal('setting-next-serial', s.nextSerial || 1);
    setVal('setting-default-gst', s.defaultGstRate || 18);

    const roundOffChk = document.getElementById('setting-round-off');
    if (roundOffChk) roundOffChk.checked = s.enableRoundOff !== false;
  },

  renderBankAccountsList() {
    const container = document.getElementById('banks-list-tbody');
    if (!container) return;

    const banks = DataStore.getBankAccounts();
    container.innerHTML = banks.map(b => `
      <tr>
        <td class="fw-bold">${b.bankName}</td>
        <td class="font-monospace">${b.accountNo}</td>
        <td class="font-monospace">${b.ifsc}</td>
        <td>${b.branch || '-'}</td>
        <td class="font-monospace">${b.upiId || '-'}</td>
        <td class="text-center">
          ${b.isDefault ? '<span class="badge bg-success">Default</span>' : `
            <button class="btn btn-xs btn-outline-primary" onclick="SettingsManager.setDefaultBank('${b.id}')">Make Default</button>
          `}
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger p-1" onclick="SettingsManager.deleteBank('${b.id}')" ${b.isDefault ? 'disabled' : ''}>
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  renderCatalogList() {
    const container = document.getElementById('catalog-list-tbody');
    if (!container) return;

    const catalog = DataStore.getCatalog();
    container.innerHTML = catalog.map(it => `
      <tr>
        <td class="fw-bold">${it.description}</td>
        <td class="text-center font-monospace">${it.hsn || '998333'}</td>
        <td class="text-center">${it.unit || 'TON'}</td>
        <td class="text-end fw-bold font-monospace">${Calculations.formatCurrency(it.rate)}</td>
        <td class="text-center">${it.igstRate || (it.cgstRate + it.sgstRate) || 18}%</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger p-1" onclick="SettingsManager.deleteCatalogItem('${it.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  renderTermsPresetsList() {
    const container = document.getElementById('terms-presets-list');
    if (!container) return;

    const presets = DataStore.getTermsPresets();
    container.innerHTML = presets.map(p => `
      <div class="card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span class="fw-bold">${p.name} ${p.isDefault ? '<span class="badge bg-success ms-2">Default</span>' : ''}</span>
          <button class="btn btn-sm btn-outline-danger" onclick="SettingsManager.deleteTermsPreset('${p.id}')" ${p.isDefault ? 'disabled' : ''}>
            <i class="bi bi-trash"></i>
          </button>
        </div>
        <div class="card-body p-3">
          <ol class="small mb-0 ps-3">
            ${(p.items || []).map(t => `<li class="mb-1">${t.replace(/^[0-9]+\.\s*/, '')}</li>`).join('')}
          </ol>
        </div>
      </div>
    `).join('');
  },

  bindEvents() {
    // Save Company Form
    const compForm = document.getElementById('company-settings-form');
    if (compForm) {
      compForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveCompanySettings();
      });
    }

    // Save General Settings
    const genForm = document.getElementById('general-settings-form');
    if (genForm) {
      genForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveGeneralSettings();
      });
    }

    // Add Bank Form
    const bankForm = document.getElementById('add-bank-form');
    if (bankForm) {
      bankForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addBankAccount();
      });
    }

    // Add Catalog Item Form
    const catalogForm = document.getElementById('add-catalog-form');
    if (catalogForm) {
      catalogForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addCatalogItem();
      });
    }

    // Image Upload Handlers
    this.setupImageUpload('upload-logo-input', 'comp-logo-preview', 'logo');
    this.setupImageUpload('upload-badge-input', 'comp-badge-preview', 'badge');
    this.setupImageUpload('upload-sig-input', 'comp-sig-preview', 'signature');

    // Backup restore file input
    const restoreInput = document.getElementById('backup-file-input');
    if (restoreInput) {
      restoreInput.addEventListener('change', (e) => this.handleRestoreBackup(e));
    }
  },

  setupImageUpload(inputId, previewId, property) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        const previewEl = document.getElementById(previewId);
        if (previewEl) previewEl.src = base64;

        const comp = DataStore.getCompany();
        comp[property] = base64;
        DataStore.saveCompany(comp);
        UI.showToast(`Updated company ${property} successfully`, 'success');
      };
      reader.readAsDataURL(file);
    });
  },

  saveCompanySettings() {
    const getVal = (id) => document.getElementById(id)?.value.trim() || '';
    const comp = DataStore.getCompany();

    comp.name = getVal('comp-name');
    comp.address = getVal('comp-address');
    comp.phone = getVal('comp-phone');
    comp.email = getVal('comp-email');
    comp.gstin = getVal('comp-gstin').toUpperCase();
    comp.pan = getVal('comp-pan').toUpperCase();
    comp.state = getVal('comp-state');
    comp.stateCode = getVal('comp-state-code');
    comp.udyamNo = getVal('comp-udyam').toUpperCase();
    comp.website = getVal('comp-website');
    comp.city = getVal('comp-city');
    comp.pin = getVal('comp-pin');

    DataStore.saveCompany(comp);
    UI.showToast('Company profile updated successfully', 'success');
    UI.renderSidebar(); // refresh company details in sidebar
  },

  saveGeneralSettings() {
    const getVal = (id) => document.getElementById(id)?.value;
    const s = DataStore.getSettings();

    s.currency = getVal('setting-currency');
    s.financialYear = getVal('setting-fy');
    s.invoicePrefix = getVal('setting-prefix');
    s.defaultPaymentDays = parseInt(getVal('setting-payment-days')) || 21;
    s.nextSerial = parseInt(getVal('setting-next-serial')) || 1;
    s.defaultGstRate = parseFloat(getVal('setting-default-gst')) || 18;
    s.enableRoundOff = document.getElementById('setting-round-off')?.checked !== false;

    DataStore.saveSettings(s);
    UI.showToast('Application settings saved', 'success');
  },

  addBankAccount() {
    const getVal = (id) => document.getElementById(id)?.value.trim() || '';
    const newBank = {
      bankName: getVal('new-bank-name'),
      accountHolder: getVal('new-bank-holder'),
      accountNo: getVal('new-bank-acc'),
      ifsc: getVal('new-bank-ifsc').toUpperCase(),
      branch: getVal('new-bank-branch'),
      upiId: getVal('new-bank-upi'),
      isDefault: false,
      showQr: true
    };

    if (!newBank.bankName || !newBank.accountNo) {
      UI.showToast('Please provide bank name and account number', 'danger');
      return;
    }

    DataStore.saveBankAccount(newBank);
    UI.showToast('Bank account added', 'success');
    document.getElementById('add-bank-form').reset();
    this.renderBankAccountsList();
  },

  setDefaultBank(id) {
    const banks = DataStore.getBankAccounts();
    banks.forEach(b => b.isDefault = (b.id === id));
    localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(banks));
    UI.showToast('Default bank updated', 'success');
    this.renderBankAccountsList();
  },

  deleteBank(id) {
    if (confirm('Delete this bank account?')) {
      DataStore.deleteBankAccount(id);
      UI.showToast('Bank account deleted', 'success');
      this.renderBankAccountsList();
    }
  },

  addCatalogItem() {
    const getVal = (id) => document.getElementById(id)?.value.trim() || '';
    const item = {
      description: getVal('catalog-desc'),
      hsn: getVal('catalog-hsn') || '998333',
      unit: getVal('catalog-unit') || 'TON',
      rate: parseFloat(getVal('catalog-rate')) || 0,
      gstRate: parseFloat(getVal('catalog-gst-rate')) || 18
    };

    if (!item.description || item.rate <= 0) {
      UI.showToast('Please provide item description and rate', 'danger');
      return;
    }

    DataStore.saveCatalogItem(item);
    UI.showToast('Catalog item added', 'success');
    document.getElementById('add-catalog-form').reset();
    this.renderCatalogList();
  },

  deleteCatalogItem(id) {
    DataStore.deleteCatalogItem(id);
    UI.showToast('Catalog item deleted', 'success');
    this.renderCatalogList();
  },

  deleteTermsPreset(id) {
    DataStore.deleteTermsPreset(id);
    UI.showToast('Terms preset deleted', 'success');
    this.renderTermsPresetsList();
  },

  downloadFullBackup() {
    const backupJson = DataStore.exportAll();
    const filename = `fab_steel_invoice_backup_${new Date().toISOString().slice(0, 10)}.json`;
    ExportCsv.downloadFile(backupJson, filename);
  },

  handleRestoreBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const res = DataStore.importAll(event.target.result);
        if (res.success) {
          alert('Backup restored successfully! The page will now reload.');
          location.reload();
        } else {
          alert('Error restoring backup: ' + res.message);
        }
      } catch (err) {
        alert('Failed to parse backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  },

  resetAllDemoData() {
    if (confirm('Are you sure you want to reset ALL data to original demo state? Any unsaved edits will be lost.')) {
      DataStore.resetToDemo();
      alert('Demo data successfully restored.');
      location.reload();
    }
  },

  clearAllData() {
    if (confirm('CAUTION: This will clear ALL stored local invoices, clients, and settings. Are you completely sure?')) {
      DataStore.clearAll();
      alert('Local storage cleared. Reloading with initial setup.');
      location.reload();
    }
  }
};

window.SettingsManager = SettingsManager;

