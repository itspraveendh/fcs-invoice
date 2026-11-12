/**
 * Invoice Creator & Workspace Controller
 * Two-panel reactive invoice builder with live preview synchronization,
 * drag/reorder line items, custom columns, tax calculations, and multi-format exports.
 */

const InvoiceBuilder = {
  currentInvoice: null,
  zoomLevel: 100,

  init() {
    this.loadInvoiceFromUrl();
    this.populateClientSelect();
    this.populateBankSelect();
    this.populateTermsSelect();
    this.populateTemplateSelect();
    this.populateCatalogSelect();
    this.bindEvents();
    this.checkDuplicateInvoiceNo();
    this.updatePreview();

    // Check auto export flag
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoExport') === 'pdf') {
      setTimeout(() => {
        this.exportPdf();
      }, 500);
    }
  },

  loadInvoiceFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('id');

    if (invoiceId) {
      const existing = DataStore.getInvoice(invoiceId);
      if (existing) {
        this.currentInvoice = JSON.parse(JSON.stringify(existing));
        this.fillFormFields();
        return;
      }
    }

    // Otherwise create a new invoice based on defaults
    this.createNewDraft();
  },

  createNewDraft() {
    const company = DataStore.getCompany();
    const clients = DataStore.getClients();
    const settings = DataStore.getSettings();
    const defaultClient = clients[0] || {};
    const defaultTerms = DataStore.getTermsPresets()[0] || {};
    const defaultBank = DataStore.getBankAccounts().find(b => b.isDefault) || DataStore.getBankAccounts()[0] || {};

    const todayStr = Calculations.formatDate(new Date(), 'YYYY-MM-DD');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (settings.defaultPaymentDays || 21));
    const dueDateStr = Calculations.formatDate(dueDate, 'YYYY-MM-DD');

    this.currentInvoice = {
      id: null,
      invoiceNo: DataStore.getNextInvoiceNumber(),
      date: todayStr,
      dueDate: dueDateStr,
      poNumber: '',
      poValue: 0,
      refNumber: '',
      quoteRef: 'PD-FAB-2026-27-RFQ-01',
      reverseCharge: 'N',
      invoiceType: 'Tax Invoice',
      copyType: 'Original for Recipient',
      status: 'Draft',
      templateId: settings.defaultTemplateId || 'tpl-fab-excel',
      pageSize: 'a4',
      orientation: 'portrait',
      clientId: defaultClient.id || null,
      client: { ...defaultClient },
      company: { ...company },
      bankAccountId: defaultBank.id || 'bank-01',
      terms: defaultTerms.items ? [...defaultTerms.items] : [],
      customColumns: [],
      enableRoundOff: settings.enableRoundOff !== false,
      additionalCharges: 0,
      amountPaid: 0,
      notes: 'Thank you for your business!',
      items: [
        {
          id: 'item-' + Date.now(),
          sNo: 1,
          description: 'Structural Steel Detailing / 3D Modeling (Tekla)',
          hsn: '998333',
          qty: 1,
          ton: 100.0,
          rate: 150.0,
          amount: 15000.0,
          discount: 0,
          taxableValue: 15000.0,
          taxMode: 'auto',
          cgstRate: 9,
          cgstAmount: 1350.0,
          sgstRate: 9,
          sgstAmount: 1350.0,
          igstRate: 18,
          igstAmount: 2700.0,
          total: 17700.0
        }
      ]
    };

    this.fillFormFields();
  },

  fillFormFields() {
    const inv = this.currentInvoice;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    setVal('inv-number', inv.invoiceNo);
    setVal('inv-date', inv.date);
    setVal('inv-due-date', inv.dueDate);
    setVal('inv-po-number', inv.poNumber);
    setVal('inv-po-value', inv.poValue || '');
    setVal('inv-ref-number', inv.refNumber);
    setVal('inv-quote-ref', inv.quoteRef);
    setVal('inv-reverse-charge', inv.reverseCharge || 'N');
    setVal('inv-type', inv.invoiceType || 'Tax Invoice');
    setVal('inv-copy-type', inv.copyType || 'Original for Recipient');
    setVal('inv-status', inv.status || 'Draft');
    setVal('inv-template-select', inv.templateId || 'tpl-fab-excel');
    setVal('inv-bank-select', inv.bankAccountId || 'bank-01');
    setVal('inv-additional-charges', inv.additionalCharges || 0);
    setVal('inv-amount-paid', inv.amountPaid || 0);
    setVal('inv-notes', inv.notes || '');

    const roundOffEl = document.getElementById('inv-round-off');
    if (roundOffEl) roundOffEl.checked = inv.enableRoundOff !== false;

    // Fill Client
    if (inv.client) {
      this.fillClientFields(inv.client);
    }

    // Set page format select if present
    const formatSelect = document.getElementById('preview-page-format');
    if (formatSelect) {
      const currentFormat = `${inv.pageSize || 'a4'}-${inv.orientation || 'portrait'}`;
      formatSelect.value = currentFormat;
    }

    this.renderLineItems();
    this.renderTermsList();
    this.recalculateAll();
  },

  fillClientFields(client) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('client-name', client.companyName || client.name);
    setVal('client-address', client.address);
    setVal('client-gstin', client.gstin);
    setVal('client-pan', client.pan);
    setVal('client-state', client.state);
    setVal('client-state-code', client.stateCode);

    const clientSelect = document.getElementById('inv-client-select');
    if (clientSelect && client.id) {
      clientSelect.value = client.id;
    }
  },

  populateClientSelect() {
    const select = document.getElementById('inv-client-select');
    if (!select) return;

    const clients = DataStore.getClients();
    select.innerHTML = '<option value="">-- Choose Existing Client --</option>' +
      clients.map(c => `
        <option value="${c.id}" ${this.currentInvoice && this.currentInvoice.clientId === c.id ? 'selected' : ''}>
          ${c.companyName || c.name} (${c.state || 'India'})
        </option>
      `).join('');
  },

  populateBankSelect() {
    const select = document.getElementById('inv-bank-select');
    if (!select) return;

    const banks = DataStore.getBankAccounts();
    select.innerHTML = banks.map(b => `
      <option value="${b.id}" ${this.currentInvoice && this.currentInvoice.bankAccountId === b.id ? 'selected' : ''}>
        ${b.bankName} - A/C ${b.accountNo} (${b.ifsc})
      </option>
    `).join('');
  },

  populateTermsSelect() {
    const select = document.getElementById('inv-terms-preset-select');
    if (!select) return;

    const presets = DataStore.getTermsPresets();
    select.innerHTML = '<option value="">-- Load Terms Preset --</option>' +
      presets.map(p => `
        <option value="${p.id}">
          ${p.name} (${p.items ? p.items.length : 0} items)
        </option>
      `).join('');
  },

  populateTemplateSelect() {
    const select = document.getElementById('inv-template-select');
    if (!select) return;

    const templates = DataStore.getTemplates();
    select.innerHTML = templates.map(t => `
      <option value="${t.id}" ${this.currentInvoice && this.currentInvoice.templateId === t.id ? 'selected' : ''}>
        ${t.name} ${t.isDefault ? '(Default)' : ''}
      </option>
    `).join('');
  },

  populateCatalogSelect() {
    const select = document.getElementById('catalog-quick-add');
    if (!select) return;

    const catalog = DataStore.getCatalog();
    select.innerHTML = '<option value="">+ Add Item from Catalog...</option>' +
      catalog.map(it => `
        <option value="${it.id}">
          ${it.description} (₹${it.rate}/${it.unit})
        </option>
      `).join('');
  },

  bindEvents() {
    // Client selection change
    const clientSelect = document.getElementById('inv-client-select');
    if (clientSelect) {
      clientSelect.addEventListener('change', () => {
        const clientId = clientSelect.value;
        if (clientId) {
          const client = DataStore.getClient(clientId);
          if (client) {
            this.currentInvoice.clientId = client.id;
            this.currentInvoice.client = { ...client };
            this.fillClientFields(client);
            this.recalculateAll();
          }
        }
      });
    }

    // Direct client form fields inputs
    ['client-name', 'client-address', 'client-gstin', 'client-pan', 'client-state', 'client-state-code'].forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.addEventListener('input', () => {
          if (!this.currentInvoice.client) this.currentInvoice.client = {};
          if (fieldId === 'client-name') this.currentInvoice.client.name = el.value;
          if (fieldId === 'client-name') this.currentInvoice.client.companyName = el.value;
          if (fieldId === 'client-address') this.currentInvoice.client.address = el.value;
          if (fieldId === 'client-gstin') this.currentInvoice.client.gstin = el.value;
          if (fieldId === 'client-pan') this.currentInvoice.client.pan = el.value;
          if (fieldId === 'client-state') this.currentInvoice.client.state = el.value;
          if (fieldId === 'client-state-code') this.currentInvoice.client.stateCode = el.value;
          this.recalculateAll();
        });
      }
    });

    // Invoice meta fields
    const metaBindings = [
      ['inv-number', 'invoiceNo'],
      ['inv-date', 'date'],
      ['inv-due-date', 'dueDate'],
      ['inv-po-number', 'poNumber'],
      ['inv-po-value', 'poValue'],
      ['inv-ref-number', 'refNumber'],
      ['inv-quote-ref', 'quoteRef'],
      ['inv-reverse-charge', 'reverseCharge'],
      ['inv-type', 'invoiceType'],
      ['inv-copy-type', 'copyType'],
      ['inv-status', 'status'],
      ['inv-template-select', 'templateId'],
      ['inv-bank-select', 'bankAccountId'],
      ['inv-additional-charges', 'additionalCharges'],
      ['inv-amount-paid', 'amountPaid'],
      ['inv-notes', 'notes']
    ];

    metaBindings.forEach(([elId, prop]) => {
      const el = document.getElementById(elId);
      if (el) {
        el.addEventListener('input', () => {
          this.currentInvoice[prop] = el.value;
          if (prop === 'invoiceNo') {
            this.checkDuplicateInvoiceNo();
          }
          this.recalculateAll();
        });
        el.addEventListener('change', () => {
          this.currentInvoice[prop] = el.value;
          if (prop === 'invoiceNo') {
            this.checkDuplicateInvoiceNo();
          }
          this.recalculateAll();
        });
      }
    });

    // Round off checkbox
    const roundOffEl = document.getElementById('inv-round-off');
    if (roundOffEl) {
      roundOffEl.addEventListener('change', () => {
        this.currentInvoice.enableRoundOff = roundOffEl.checked;
        this.recalculateAll();
      });
    }

    // Terms preset change
    const termsSelect = document.getElementById('inv-terms-preset-select');
    if (termsSelect) {
      termsSelect.addEventListener('change', () => {
        const presetId = termsSelect.value;
        if (presetId) {
          const preset = DataStore.getTermsPreset(presetId);
          if (preset && preset.items) {
            this.currentInvoice.terms = [...preset.items];
            this.renderTermsList();
            this.updatePreview();
          }
        }
      });
    }

    // Catalog quick add
    const catalogSelect = document.getElementById('catalog-quick-add');
    if (catalogSelect) {
      catalogSelect.addEventListener('change', () => {
        const prodId = catalogSelect.value;
        if (prodId) {
          const prod = DataStore.getCatalog().find(p => p.id === prodId);
          if (prod) {
            this.addLineItem({
              description: prod.description,
              hsn: prod.hsn,
              rate: prod.rate,
              ton: prod.unit === 'TON' ? 1.0 : 0,
              qty: 1
            });
          }
          catalogSelect.value = '';
        }
      });
    }

    // Zoom controls
    const zoomSelect = document.getElementById('preview-zoom-select');
    if (zoomSelect) {
      zoomSelect.addEventListener('change', () => {
        this.setZoom(parseInt(zoomSelect.value));
      });
    }

    // Page format controls (Portrait vs Landscape, A4, A5, Letter)
    const formatSelect = document.getElementById('preview-page-format');
    if (formatSelect) {
      formatSelect.addEventListener('change', () => {
        this.changePageFormat(formatSelect.value);
      });
    }
  },

  checkDuplicateInvoiceNo() {
    const feedback = document.getElementById('inv-number-feedback');
    if (!feedback) return;

    const num = (this.currentInvoice.invoiceNo || '').trim();
    if (!num) {
      feedback.style.display = 'none';
      return;
    }

    const isUnique = DataStore.isInvoiceNumberUnique(num, this.currentInvoice.id);
    if (!isUnique) {
      feedback.innerHTML = '<span class="text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill me-1"></i> Warning: Invoice number already exists!</span>';
      feedback.style.display = 'block';
    } else {
      feedback.innerHTML = '<span class="text-success"><i class="bi bi-check-circle-fill me-1"></i> Available</span>';
      feedback.style.display = 'block';
    }
  },

  changePageFormat(formatStr) {
    if (!formatStr) return;
    const parts = formatStr.split('-');
    this.currentInvoice.pageSize = parts[0] || 'a4';
    this.currentInvoice.orientation = parts[1] || 'portrait';
    this.updatePreview();
  },

  renderLineItems() {
    const tbody = document.getElementById('line-items-tbody');
    if (!tbody) return;

    tbody.innerHTML = this.currentInvoice.items.map((item, idx) => {
      const currentGst = (item.gstRate !== undefined && item.gstRate !== null)
        ? parseFloat(item.gstRate)
        : (item.igstRate || ((item.cgstRate || 0) + (item.sgstRate || 0)) || 18);

      return `
      <tr data-item-id="${item.id}" class="line-item-row" draggable="true" style="cursor: move;">
        <td class="text-center font-monospace" title="Drag to reorder">
          <i class="bi bi-grip-vertical text-muted me-1"></i>${idx + 1}
        </td>
        <td>
          <input type="text" class="form-control form-control-sm item-desc" value="${item.description || ''}" placeholder="Product / Service Description" />
        </td>
        <td style="width: 100px;">
          <input type="text" class="form-control form-control-sm item-hsn text-center" value="${item.hsn || '998333'}" />
        </td>
        <td style="width: 80px;">
          <input type="number" step="any" class="form-control form-control-sm item-qty text-center" value="${item.qty || 1}" />
        </td>
        <td style="width: 90px;">
          <input type="number" step="any" class="form-control form-control-sm item-ton text-center" value="${item.ton !== undefined ? item.ton : ''}" placeholder="0" />
        </td>
        <td style="width: 110px;">
          <input type="number" step="any" class="form-control form-control-sm item-rate text-end" value="${item.rate || 0}" />
        </td>
        <td style="width: 80px;">
          <input type="number" step="any" class="form-control form-control-sm item-disc text-end" value="${item.discount || 0}" />
        </td>
        <td style="width: 95px;">
          <select class="form-select form-select-sm item-gst-rate font-monospace">
            <option value="18" ${currentGst === 18 ? 'selected' : ''}>18%</option>
            <option value="12" ${currentGst === 12 ? 'selected' : ''}>12%</option>
            <option value="5" ${currentGst === 5 ? 'selected' : ''}>5%</option>
            <option value="28" ${currentGst === 28 ? 'selected' : ''}>28%</option>
            <option value="0" ${currentGst === 0 ? 'selected' : ''}>0%</option>
            ${![18, 12, 5, 28, 0].includes(currentGst) ? `<option value="${currentGst}" selected>${currentGst}%</option>` : ''}
            <option value="custom">Custom...</option>
          </select>
        </td>
        <td style="width: 110px;">
          <select class="form-select form-select-sm item-tax-mode">
            <option value="auto" ${item.taxMode === 'auto' ? 'selected' : ''}>Auto GST</option>
            <option value="intra" ${item.taxMode === 'intra' ? 'selected' : ''}>Intra (CGST+SGST)</option>
            <option value="inter" ${item.taxMode === 'inter' ? 'selected' : ''}>Inter (IGST)</option>
            <option value="lut" ${item.taxMode === 'lut' ? 'selected' : ''}>LUT Export (0%)</option>
            <option value="exempt" ${item.taxMode === 'exempt' ? 'selected' : ''}>Exempt (0%)</option>
          </select>
        </td>
        <td class="text-end fw-bold font-monospace item-line-total" style="width: 120px; vertical-align: middle;">
          ${Calculations.formatNumber(item.total || 0, 2)}
        </td>
        <td class="text-center" style="width: 110px; vertical-align: middle;">
          <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-outline-primary p-1" title="Save to Catalog" onclick="InvoiceBuilder.saveItemToCatalog('${item.id}')">
              <i class="bi bi-bookmark-plus"></i>
            </button>
            <button type="button" class="btn btn-outline-secondary p-1" title="Duplicate Row" onclick="InvoiceBuilder.duplicateLineItem('${item.id}')">
              <i class="bi bi-copy"></i>
            </button>
            <button type="button" class="btn btn-outline-danger p-1" title="Delete Row" onclick="InvoiceBuilder.deleteLineItem('${item.id}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
      `;
    }).join('');

    // Attach drag and drop reordering
    let draggedId = null;
    tbody.querySelectorAll('tr').forEach(tr => {
      tr.addEventListener('dragstart', (e) => {
        draggedId = tr.getAttribute('data-item-id');
        tr.classList.add('table-active');
        e.dataTransfer.setData('text/plain', draggedId);
      });
      tr.addEventListener('dragend', () => {
        tr.classList.remove('table-active');
      });
      tr.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      tr.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetId = tr.getAttribute('data-item-id');
        if (draggedId && targetId && draggedId !== targetId) {
          const fromIdx = InvoiceBuilder.currentInvoice.items.findIndex(it => it.id === draggedId);
          const toIdx = InvoiceBuilder.currentInvoice.items.findIndex(it => it.id === targetId);
          if (fromIdx !== -1 && toIdx !== -1) {
            const [moved] = InvoiceBuilder.currentInvoice.items.splice(fromIdx, 1);
            InvoiceBuilder.currentInvoice.items.splice(toIdx, 0, moved);
            InvoiceBuilder.currentInvoice.items.forEach((it, idx) => it.sNo = idx + 1);
            InvoiceBuilder.recalculateAll();
            InvoiceBuilder.renderLineItems();
          }
        }
      });
    });

    // Attach listeners to line item inputs
    tbody.querySelectorAll('tr').forEach(tr => {
      const id = tr.getAttribute('data-item-id');
      const item = this.currentInvoice.items.find(it => it.id === id);
      if (!item) return;

      const descInput = tr.querySelector('.item-desc');
      const hsnInput = tr.querySelector('.item-hsn');
      const qtyInput = tr.querySelector('.item-qty');
      const tonInput = tr.querySelector('.item-ton');
      const rateInput = tr.querySelector('.item-rate');
      const discInput = tr.querySelector('.item-disc');
      const gstRateSelect = tr.querySelector('.item-gst-rate');
      const taxModeSelect = tr.querySelector('.item-tax-mode');

      const updateItem = () => {
        item.description = descInput.value;
        item.hsn = hsnInput.value;
        item.qty = parseFloat(qtyInput.value) || 0;
        item.ton = parseFloat(tonInput.value) || 0;
        item.rate = parseFloat(rateInput.value) || 0;
        item.discount = parseFloat(discInput.value) || 0;
        item.taxMode = taxModeSelect.value;

        if (gstRateSelect) {
          const chosen = gstRateSelect.value;
          if (chosen === 'custom') {
            const customVal = prompt('Enter custom GST % (e.g. 7.5, 6, 3):', String(item.gstRate || 18));
            if (customVal !== null && !isNaN(parseFloat(customVal))) {
              item.gstRate = parseFloat(customVal);
              InvoiceBuilder.recalculateAll();
              InvoiceBuilder.renderLineItems();
              return;
            } else {
              item.gstRate = 18;
            }
          } else {
            item.gstRate = parseFloat(chosen);
          }
        }

        this.recalculateAll();
      };

      [descInput, hsnInput, qtyInput, tonInput, rateInput, discInput].forEach(inp => {
        inp.addEventListener('input', updateItem);
      });
      if (gstRateSelect) gstRateSelect.addEventListener('change', updateItem);
      taxModeSelect.addEventListener('change', updateItem);
    });
  },

  setAllGstRate(rate) {
    if (!this.currentInvoice || !this.currentInvoice.items) return;
    const parsedRate = parseFloat(rate);
    this.currentInvoice.items.forEach(it => {
      it.gstRate = parsedRate;
    });
    this.recalculateAll();
    this.renderLineItems();
    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(`Applied ${parsedRate}% GST to all line items`, 'success');
    }
  },

  promptCustomGstRate() {
    const input = prompt('Enter custom GST % to apply to all line items (e.g. 7.5, 6, 3):', '18');
    if (input !== null && !isNaN(parseFloat(input))) {
      this.setAllGstRate(parseFloat(input));
    }
  },

  addLineItem(customProps = {}) {
    const defaultGst = (this.currentInvoice.items && this.currentInvoice.items[0]?.gstRate !== undefined)
      ? this.currentInvoice.items[0].gstRate
      : 18;

    const newItem = {
      id: 'item-' + Date.now(),
      sNo: this.currentInvoice.items.length + 1,
      description: customProps.description || '',
      hsn: customProps.hsn || '998333',
      qty: customProps.qty || 1,
      ton: customProps.ton !== undefined ? customProps.ton : 0,
      rate: customProps.rate || 0,
      discount: customProps.discount || 0,
      taxMode: 'auto',
      gstRate: customProps.gstRate !== undefined ? customProps.gstRate : defaultGst,
      cgstRate: defaultGst / 2,
      sgstRate: defaultGst / 2,
      igstRate: defaultGst,
      ...customProps
    };

    this.currentInvoice.items.push(newItem);
    this.recalculateAll();
    this.renderLineItems();
  },

  duplicateLineItem(itemId) {
    const idx = this.currentInvoice.items.findIndex(it => it.id === itemId);
    if (idx !== -1) {
      const copy = JSON.parse(JSON.stringify(this.currentInvoice.items[idx]));
      copy.id = 'item-' + Date.now();
      this.currentInvoice.items.splice(idx + 1, 0, copy);
      this.recalculateAll();
      this.renderLineItems();
      UI.showToast('Item duplicated', 'info', 1500);
    }
  },

  deleteLineItem(itemId) {
    if (this.currentInvoice.items.length <= 1) {
      UI.showToast('Invoice must have at least one line item', 'danger');
      return;
    }
    this.currentInvoice.items = this.currentInvoice.items.filter(it => it.id !== itemId);
    // Renumber
    this.currentInvoice.items.forEach((it, idx) => it.sNo = idx + 1);
    this.recalculateAll();
    this.renderLineItems();
  },

  saveItemToCatalog(itemId) {
    const item = this.currentInvoice.items.find(it => it.id === itemId);
    if (!item || !item.description) {
      UI.showToast('Please enter a description for this item before saving to catalog', 'warning');
      return;
    }
    const unit = item.ton > 0 ? 'TON' : 'PCS';
    const rate = item.rate || 0;
    const hsn = item.hsn || '998333';
    DataStore.saveCatalogItem({
      name: item.description,
      description: item.description,
      hsn,
      unit,
      rate,
      taxRate: item.igstRate || (item.cgstRate ? (item.cgstRate + (item.sgstRate || 0)) : 18)
    });
    this.populateCatalogSelect();
    UI.showToast(`Saved "${item.description.slice(0, 30)}..." to Product Catalog!`, 'success');
  },

  renderTermsList() {
    const container = document.getElementById('terms-list-container');
    if (!container) return;

    const terms = this.currentInvoice.terms || [];
    container.innerHTML = terms.map((t, idx) => `
      <div class="input-group input-group-sm mb-2" data-term-idx="${idx}">
        <span class="input-group-text bg-light">${idx + 1}</span>
        <input type="text" class="form-control term-text-input" value="${t.replace(/^[0-9]+\.\s*/, '')}" />
        <button class="btn btn-outline-danger" type="button" onclick="InvoiceBuilder.deleteTerm(${idx})">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `).join('');

    container.querySelectorAll('.term-text-input').forEach((inp, idx) => {
      inp.addEventListener('input', () => {
        this.currentInvoice.terms[idx] = `${idx + 1}. ${inp.value}`;
        this.updatePreview();
      });
    });
  },

  addTerm() {
    if (!this.currentInvoice.terms) this.currentInvoice.terms = [];
    const nextNum = this.currentInvoice.terms.length + 1;
    this.currentInvoice.terms.push(`${nextNum}. New custom term condition`);
    this.renderTermsList();
    this.updatePreview();
  },

  deleteTerm(idx) {
    this.currentInvoice.terms.splice(idx, 1);
    this.renderTermsList();
    this.updatePreview();
  },

  saveCurrentAsTermsPreset() {
    if (!this.currentInvoice.terms || this.currentInvoice.terms.length === 0) {
      UI.showToast('No terms to save as preset', 'warning');
      return;
    }
    const name = prompt('Enter a name for this Terms & Conditions preset:', `Custom Terms (${Calculations.formatDate(new Date())})`);
    if (!name || !name.trim()) return;

    DataStore.saveTermsPreset({
      name: name.trim(),
      items: [...this.currentInvoice.terms]
    });
    this.populateTermsSelect();
    UI.showToast(`Terms preset "${name}" saved successfully!`, 'success');
  },

  recalculateAll() {
    const company = this.currentInvoice.company || DataStore.getCompany();
    const client = this.currentInvoice.client || {};

    const totals = Calculations.calculateTotals(this.currentInvoice.items, {
      fromStateCode: company.stateCode || '33',
      toStateCode: client.stateCode || '33',
      enableRoundOff: this.currentInvoice.enableRoundOff !== false,
      additionalCharges: this.currentInvoice.additionalCharges || 0,
      amountPaid: this.currentInvoice.amountPaid || 0
    });

    // Update current invoice totals
    this.currentInvoice.subtotal = totals.subtotal;
    this.currentInvoice.totalDiscount = totals.totalDiscount;
    this.currentInvoice.taxableAmount = totals.taxableAmount;
    this.currentInvoice.cgstTotal = totals.cgstTotal;
    this.currentInvoice.sgstTotal = totals.sgstTotal;
    this.currentInvoice.igstTotal = totals.igstTotal;
    this.currentInvoice.totalTax = totals.totalTax;
    this.currentInvoice.roundOff = totals.roundOff;
    this.currentInvoice.grandTotal = totals.grandTotal;
    this.currentInvoice.balanceDue = totals.balanceDue;
    this.currentInvoice.amountInWords = totals.amountInWords;

    // Update UI summary panel in editor
    const setVal = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setVal('summary-subtotal', Calculations.formatCurrency(totals.subtotal));
    setVal('summary-taxable', Calculations.formatCurrency(totals.taxableAmount));
    setVal('summary-cgst', Calculations.formatCurrency(totals.cgstTotal));
    setVal('summary-sgst', Calculations.formatCurrency(totals.sgstTotal));
    setVal('summary-igst', Calculations.formatCurrency(totals.igstTotal));
    setVal('summary-tax', Calculations.formatCurrency(totals.totalTax));
    setVal('summary-roundoff', Calculations.formatCurrency(totals.roundOff));
    setVal('summary-grand-total', Calculations.formatCurrency(totals.grandTotal));
    setVal('summary-balance-due', Calculations.formatCurrency(totals.balanceDue));
    setVal('summary-words', totals.amountInWords);

    // Update each item row total in editor table
    totals.items.forEach(it => {
      const tr = document.querySelector(`tr[data-item-id="${it.id}"]`);
      if (tr) {
        const lineTotEl = tr.querySelector('.item-line-total');
        if (lineTotEl) lineTotEl.textContent = Calculations.formatNumber(it.total, 2);
      }
    });

    this.updatePreview();
  },

  updatePreview() {
    const previewContainer = document.getElementById('invoice-preview-container');
    if (!previewContainer) return;

    const template = DataStore.getTemplate(this.currentInvoice.templateId);
    previewContainer.innerHTML = TemplateEngine.renderInvoice(this.currentInvoice, template, {
      pageSize: this.currentInvoice.pageSize || 'a4',
      orientation: this.currentInvoice.orientation || 'portrait'
    });
  },

  setZoom(percent) {
    this.zoomLevel = percent;
    const viewport = document.getElementById('preview-viewport');
    if (viewport) {
      viewport.className = `preview-scroll-viewport zoom-${percent}`;
    }
  },

  openManageColumnsModal() {
    const modalEl = document.getElementById('manageColumnsModal');
    if (!modalEl) return;

    if (!this.currentInvoice.columnVisibility) {
      this.currentInvoice.columnVisibility = { ton: true, discount: true, hsn: true };
    }

    const tonCheck = document.getElementById('col-toggle-ton');
    if (tonCheck) tonCheck.checked = this.currentInvoice.columnVisibility.ton !== false;

    const discCheck = document.getElementById('col-toggle-discount');
    if (discCheck) discCheck.checked = this.currentInvoice.columnVisibility.discount !== false;

    const hsnCheck = document.getElementById('col-toggle-hsn');
    if (hsnCheck) hsnCheck.checked = this.currentInvoice.columnVisibility.hsn !== false;

    this.renderCustomColumnsList();

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  },

  toggleStandardCol(colName, isVisible) {
    if (!this.currentInvoice.columnVisibility) {
      this.currentInvoice.columnVisibility = { ton: true, discount: true, hsn: true };
    }
    this.currentInvoice.columnVisibility[colName] = isVisible;
    this.updatePreview();
  },

  renderCustomColumnsList() {
    const container = document.getElementById('custom-columns-container');
    if (!container) return;

    const cols = this.currentInvoice.customColumns || [];
    if (cols.length === 0) {
      container.innerHTML = '<small class="text-muted fst-italic">No custom columns added yet.</small>';
      return;
    }

    container.innerHTML = cols.map(c => `
      <div class="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-light">
        <span class="small fw-bold">${c.title}</span>
        <button type="button" class="btn btn-xs btn-outline-danger" onclick="InvoiceBuilder.removeCustomColumn('${c.id}')">
          <i class="bi bi-trash"></i> Remove
        </button>
      </div>
    `).join('');
  },

  addCustomColumn() {
    const nameInput = document.getElementById('new-custom-column-name');
    if (!nameInput || !nameInput.value.trim()) {
      UI.showToast('Please enter a column name', 'warning');
      return;
    }

    if (!this.currentInvoice.customColumns) {
      this.currentInvoice.customColumns = [];
    }

    const colName = nameInput.value.trim();
    this.currentInvoice.customColumns.push({
      id: 'col-' + Date.now(),
      title: colName
    });

    nameInput.value = '';
    this.renderCustomColumnsList();
    this.updatePreview();
    UI.showToast(`Custom column "${colName}" added`, 'success');
  },

  removeCustomColumn(colId) {
    if (!this.currentInvoice.customColumns) return;
    this.currentInvoice.customColumns = this.currentInvoice.customColumns.filter(c => c.id !== colId);
    this.renderCustomColumnsList();
    this.updatePreview();
    UI.showToast('Custom column removed', 'info');
  },

  saveInvoice() {
    // Validate
    if (!this.currentInvoice.invoiceNo || !this.currentInvoice.invoiceNo.trim()) {
      UI.showToast('Please specify a valid Invoice Number', 'danger');
      return;
    }

    // Check unique invoice number
    if (!DataStore.isInvoiceNumberUnique(this.currentInvoice.invoiceNo, this.currentInvoice.id)) {
      UI.showToast(`Invoice number "${this.currentInvoice.invoiceNo}" is already in use. Please use a unique number.`, 'danger');
      return;
    }

    const saved = DataStore.saveInvoice(this.currentInvoice);
    this.currentInvoice.id = saved.id;
    UI.showToast(`Invoice ${saved.invoiceNo} saved successfully!`, 'success');

    // Update URL with ID without reload
    const url = new URL(window.location);
    url.searchParams.set('id', saved.id);
    window.history.pushState({}, '', url);
  },

  exportPdf() {
    this.saveInvoice();
    ExportPdf.export(this.currentInvoice, {
      pageSize: this.currentInvoice.pageSize || 'a4',
      orientation: this.currentInvoice.orientation || 'portrait'
    });
  },

  exportExcel() {
    this.saveInvoice();
    ExportExcel.export(this.currentInvoice);
  },

  exportWord() {
    this.saveInvoice();
    ExportWord.export(this.currentInvoice);
  },

  exportCsv() {
    ExportCsv.exportInvoice(this.currentInvoice);
  },

  printInvoice() {
    ExportPdf.print();
  }
};

window.InvoiceBuilder = InvoiceBuilder;
