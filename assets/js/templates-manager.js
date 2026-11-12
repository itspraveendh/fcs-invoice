/**
 * Template Designer & Customizer Controller (templates.html)
 * Customizes invoice layouts, color palettes, fonts, section reordering, and template presets.
 */

const TemplatesManager = {
  currentTemplate: null,

  init() {
    this.populateTemplateList();
    this.selectTemplate('tpl-fab-excel');
    this.bindEvents();
  },

  populateTemplateList() {
    const listContainer = document.getElementById('template-cards-list');
    if (!listContainer) return;

    const templates = DataStore.getTemplates();
    listContainer.innerHTML = templates.map(t => `
      <div class="col-md-4 mb-3">
        <div class="card h-100 template-card ${this.currentTemplate && this.currentTemplate.id === t.id ? 'border-primary shadow-sm' : ''}" data-template-id="${t.id}">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="card-title fw-bold mb-0">${t.name}</h6>
              ${t.isDefault ? '<span class="badge bg-success">Default</span>' : ''}
            </div>
            <p class="card-text small text-muted mb-3">${t.description || 'Custom invoice design template'}</p>
            <div class="d-flex align-items-center gap-1 mb-3">
              <span class="color-swatch" style="background:${t.colors?.headerBg || '#4BD0FF'}; width:18px; height:18px; border-radius:3px; display:inline-block; border:1px solid #ccc;"></span>
              <span class="color-swatch" style="background:${t.colors?.totalRowBg || '#FFFF00'}; width:18px; height:18px; border-radius:3px; display:inline-block; border:1px solid #ccc;"></span>
              <span class="color-swatch" style="background:${t.colors?.greyBg || '#D9D9D9'}; width:18px; height:18px; border-radius:3px; display:inline-block; border:1px solid #ccc;"></span>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-primary w-100" onclick="TemplatesManager.selectTemplate('${t.id}')">
                <i class="bi bi-pencil me-1"></i> Customize
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  selectTemplate(templateId) {
    const t = DataStore.getTemplate(templateId);
    if (!t) return;

    this.currentTemplate = JSON.parse(JSON.stringify(t));
    this.populateDesignerForm();
    this.updatePreview();
    this.populateTemplateList();
  },

  populateDesignerForm() {
    const t = this.currentTemplate;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal('tpl-name', t.name);
    setVal('tpl-desc', t.description || '');
    setVal('tpl-font', t.layout?.fontFamily || "'Bookman Old Style', 'Calibri', serif");
    setVal('tpl-page-size', t.layout?.pageSize || 'A4');
    setVal('tpl-orientation', t.layout?.orientation || 'portrait');
    setVal('tpl-color-header', t.colors?.headerBg || '#4BD0FF');
    setVal('tpl-color-table-header', t.colors?.tableHeaderBg || '#4BD0FF');
    setVal('tpl-color-total-row', t.colors?.totalRowBg || '#FFFF00');
    setVal('tpl-color-grey', t.colors?.greyBg || '#D9D9D9');
    setVal('tpl-color-border', t.colors?.borderColor || '#000000');

    // Sections list
    const sectionsContainer = document.getElementById('sections-reorder-container');
    if (sectionsContainer && t.sections) {
      sectionsContainer.innerHTML = t.sections.map((sec, idx) => `
        <div class="d-flex align-items-center justify-content-between p-2 mb-2 bg-light border rounded" data-section-id="${sec.id}">
          <div class="form-check form-switch mb-0">
            <input class="form-check-input section-toggle" type="checkbox" id="sec-toggle-${sec.id}" ${sec.enabled ? 'checked' : ''} data-section-idx="${idx}" />
            <label class="form-check-label small fw-semibold" for="sec-toggle-${sec.id}">${sec.name}</label>
          </div>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary p-1" onclick="TemplatesManager.moveSection(${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>
              <i class="bi bi-chevron-up"></i>
            </button>
            <button class="btn btn-outline-secondary p-1" onclick="TemplatesManager.moveSection(${idx}, 1)" ${idx === t.sections.length - 1 ? 'disabled' : ''}>
              <i class="bi bi-chevron-down"></i>
            </button>
          </div>
        </div>
      `).join('');

      sectionsContainer.querySelectorAll('.section-toggle').forEach(chk => {
        chk.addEventListener('change', () => {
          const idx = parseInt(chk.getAttribute('data-section-idx'));
          this.currentTemplate.sections[idx].enabled = chk.checked;
          this.updatePreview();
        });
      });
    }
  },

  bindEvents() {
    // Designer inputs
    ['tpl-name', 'tpl-desc', 'tpl-font', 'tpl-page-size', 'tpl-orientation', 
     'tpl-color-header', 'tpl-color-table-header', 'tpl-color-total-row', 'tpl-color-grey', 'tpl-color-border'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.syncFormToTemplate());
        el.addEventListener('change', () => this.syncFormToTemplate());
      }
    });

    const fileInput = document.getElementById('template-import-file');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleImportTemplate(e));
    }
  },

  syncFormToTemplate() {
    if (!this.currentTemplate) return;

    const getVal = (id) => document.getElementById(id)?.value;

    this.currentTemplate.name = getVal('tpl-name') || this.currentTemplate.name;
    this.currentTemplate.description = getVal('tpl-desc') || '';

    if (!this.currentTemplate.layout) this.currentTemplate.layout = {};
    this.currentTemplate.layout.fontFamily = getVal('tpl-font');
    this.currentTemplate.layout.pageSize = getVal('tpl-page-size');
    this.currentTemplate.layout.orientation = getVal('tpl-orientation');

    if (!this.currentTemplate.colors) this.currentTemplate.colors = {};
    this.currentTemplate.colors.headerBg = getVal('tpl-color-header');
    this.currentTemplate.colors.tableHeaderBg = getVal('tpl-color-table-header');
    this.currentTemplate.colors.totalRowBg = getVal('tpl-color-total-row');
    this.currentTemplate.colors.greyBg = getVal('tpl-color-grey');
    this.currentTemplate.colors.borderColor = getVal('tpl-color-border');

    this.updatePreview();
  },

  moveSection(idx, direction) {
    const sections = this.currentTemplate.sections;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= sections.length) return;

    const temp = sections[idx];
    sections[idx] = sections[newIdx];
    sections[newIdx] = temp;

    this.populateDesignerForm();
    this.updatePreview();
  },

  updatePreview() {
    const previewContainer = document.getElementById('template-preview-container');
    if (!previewContainer) return;

    // Use first sample invoice for live template rendering
    const sampleInvoice = DataStore.getInvoices()[0] || window.DEFAULT_DATA.invoices[0];
    previewContainer.innerHTML = TemplateEngine.renderInvoice(sampleInvoice, this.currentTemplate);
  },

  saveCurrentTemplate() {
    if (!this.currentTemplate) return;
    DataStore.saveTemplate(this.currentTemplate);
    UI.showToast(`Template "${this.currentTemplate.name}" saved!`, 'success');
    this.populateTemplateList();
  },

  duplicateCurrentTemplate() {
    if (!this.currentTemplate) return;
    const copy = DataStore.duplicateTemplate(this.currentTemplate.id);
    if (copy) {
      this.selectTemplate(copy.id);
      UI.showToast(`Duplicated as "${copy.name}"`, 'success');
    }
  },

  setAsDefaultTemplate() {
    if (!this.currentTemplate) return;
    const templates = DataStore.getTemplates();
    templates.forEach(t => t.isDefault = (t.id === this.currentTemplate.id));
    this.currentTemplate.isDefault = true;
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));

    const settings = DataStore.getSettings();
    settings.defaultTemplateId = this.currentTemplate.id;
    DataStore.saveSettings(settings);

    UI.showToast(`"${this.currentTemplate.name}" set as system default template!`, 'success');
    this.populateTemplateList();
  },

  resetAllTemplates() {
    if (confirm('Reset all templates to initial factory defaults? Any custom modifications will be reverted.')) {
      DataStore.resetTemplates();
      this.selectTemplate('tpl-fab-excel');
      UI.showToast('Templates reset to factory defaults', 'success');
    }
  },

  exportCurrentTemplateJson() {
    if (!this.currentTemplate) return;
    const str = JSON.stringify(this.currentTemplate, null, 2);
    ExportCsv.downloadFile(str, `${this.currentTemplate.id}.json`);
  },

  handleImportTemplate(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const obj = JSON.parse(event.target.result);
        if (!obj.name || !obj.layout) {
          alert('Invalid template JSON file');
          return;
        }
        obj.id = 'tpl-' + Date.now();
        obj.isDefault = false;
        DataStore.saveTemplate(obj);
        this.selectTemplate(obj.id);
        UI.showToast(`Template "${obj.name}" successfully imported!`, 'success');
      } catch (err) {
        alert('Failed to parse template JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }
};

window.TemplatesManager = TemplatesManager;

