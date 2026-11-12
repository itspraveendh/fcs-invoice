# FAB STEEL ENGINEERING SERVICES - Invoice Builder & Management System

> **Commercial-Grade, Frontend-Only Web Application**  
> Primary Foundation: `FSE-2026-27-XXX- SAMPLE - XX-XX-XXXX.xlsx`  
> Prepared for future seamless **PHP + MySQL** backend integration.

---

## 🌟 Overview

This is a complete, fully functional, professional **Invoice Builder & Invoice Management System** built specifically for **FAB STEEL ENGINEERING SERVICES** (Salem, Tamil Nadu).

It faithfully reproduces the exact Excel layout, column structure, merged cells, formulas, colors (Cyan `#4BD0FF`, Yellow highlight `#FFFF00`, Grey `#D9D9D9`), typography (Bookman Old Style & Calibri), terms & conditions, bank details, and branding from the uploaded Excel template (`FSE-2026-27-XXX- SAMPLE - XX-XX-XXXX.xlsx`), while providing modern commercial dashboard capabilities, client CRM, multi-template customization, and multi-format exports.

---

## 🚀 Key Features

### 1. Exact 1:1 Excel Template Reproduction
- **Header Section (Rows 1–4):** Dual brand logos, Company name banner in `#4BD0FF` Cyan, Address, Phone, and GSTIN in `#FFFF00` Yellow.
- **Tax Invoice & Recipient Copy (Rows 6–8):** Cyan Tax Invoice banner, Grey Original for Recipient banner.
- **Metadata 4-Row Grid (Rows 9–12):** Invoice No (`FSE-2026-27-006`), Invoice Date, Reverse Charge (Y/N), State & Code (`Tamil Nadu / 33`), PO Number, Reference Number, PO Value, Quote Reference (`PD-FAB-2026-27-RFQ-01`).
- **Billing From & Billing To (Rows 14–20):** Dual cyan column headers with full legal entity details, JOB GSTIN, JOB PAN, and State Codes.
- **Product / Service Item Table (Rows 22–32):**
  - Columns: `S.No`, `Product Description`, `HSN/SAC code`, `Qty`, `TON`, `Rate`, `Amount`, `Discount`, `Taxable Value`, `CGST (Rate/Amt)`, `SGST (Rate/Amt)`, `IGST (Rate/Amt)`, `Total`.
  - Automatic Intra-state (`CGST + SGST`) vs. Inter-state (`IGST`) detection based on GST state codes (e.g. 33 to 33 vs 33 to 24).
  - Formulas: `Amount = TON * Rate` (or `Qty * Rate`), `Taxable Value = Amount - Discount`, GST breakdown.
  - Yellow highlight Totals row (Row 32) in bold Bookman Old Style.
- **Bottom Left Section (Rows 33–49):**
  - Cyan Amount in Words banner & Grey Indian currency words converter.
  - Remittance Bank Details (AXIS BANK, A/C: 923020038419128, IFSC: UTIB0001282, Mecheri Branch).
  - All 8 official Terms & Conditions extracted directly from the Excel template.
  - Cyan Head Office and UDYAM Number (`UDYAM-TN-20-0083238`) footers.
- **Bottom Right Section (Rows 33–47):**
  - Structured Tax breakdown (Amount before Tax, Add CGST, Add SGST, Add IGST, Total Tax Amount, Total Amount after Tax, Reverse charge).
  - Certification text, Company name, Prominent large-size official seal/signature, and Authorised Signatory label.

### 2. Live Two-Panel Invoice Creator (`create-invoice.html`)
- **Left Panel:** Complete editing controls for invoice meta, client selector, line items, additions, discounts, taxes, and bank details.
- **Right Panel:** Print-ready live invoice preview updating synchronously on every single keystroke.
- **Line Items Management:** Add unlimited rows, duplicate rows, delete rows, reorder rows, and quick-add from product catalog.
- **Zoom Controls:** 50%, 75%, 100%, 125%, and fit-to-screen.

### 3. Comprehensive Canva-Style Export Engine
- **Canva-Style Dedicated PDF Engine:** Decoupled document sandbox rendering outside of the editor UI. Renders multi-page documents at 2.5x resolution (~240+ DPI) with strict 16-column fixed widths, zero row splitting, repeated table headers, and big official signature seal.
- **Excel Export (.xlsx):** Direct base64 binary template injection preserving all 105 cell merges, fills (`#4BD0FF`, `#FFFF00`, `#D9D9D9`), Bookman Old Style & Calibri typography, formulas, and dynamic row expansion for > 8 line items.
- **Word Export (.docx & .doc):** Complete 16-column table breakdown with repeated table headers, terms, and signature block.
- **CSV Export:** Clean line items and tax breakdown export.
- **Dedicated Print Stylesheet:** `@media print` with zero margin and forced background color fidelity (`-webkit-print-color-adjust: exact`).

### 4. Interactive Dashboard (`index.html`)
- **KPI Summary Cards:** Total Invoices, Total Value, Paid Collections, Pending Balance, Overdue Invoices, Drafts.
- **Chart.js Analytics:** Monthly revenue trend, payment status ratio (doughnut), and monthly GST collection breakdown (CGST, SGST, IGST).
- **Recent Invoices Table:** Quick view, edit, download, and delete.

### 5. Invoice Management & Payment Tracker (`invoices.html`)
- Status tabs: All, Draft, Sent, Paid, Partially Paid, Overdue, Cancelled.
- Filter by date range, client, and search query.
- **Payment Recording Modal:** Add installment payments with date, amount, payment method (NEFT, UPI, Cheque, Cash), transaction ref, notes; automatically calculates remaining balance and updates invoice status.

### 6. Client CRM Directory (`clients.html`)
- Client database with GSTIN, PAN, address, state codes, and contact person.
- Client financial ledger: Total invoiced, Total paid, Outstanding balance, and complete invoice history.
- CSV import and export for client lists.

### 7. Customizable Template Designer (`templates.html`)
- Switch between templates:
  1. **Fab Steel Official Excel Template (Default)**
  2. **Modern Minimalist (Stripe/FreshBooks style)**
  3. **Corporate Royal Blue**
- Customize colors: Header bg (`#4BD0FF`), Table header (`#4BD0FF`), Totals highlight (`#FFFF00`), Grey panels (`#D9D9D9`), Border color.
- Customize typography and page layout (A4, A5, Letter, Portrait/Landscape).
- Enable/disable and reorder document sections with live preview.
- Import and export templates as JSON.

### 8. Settings & Local Database (`settings.html`)
- Edit company profile, upload logo, badge, and signature.
- Manage remittance bank accounts and UPI IDs.
- Service catalog management (reusable engineering detailing items).
- Terms presets editor.
- **Full JSON Backup & Restore:** Export complete database, import JSON backup, or reset to factory demo state.

---

## 🛠️ Technology Stack

- **HTML5 & CSS3:** Semantic markup, CSS Custom Properties (Theme variables).
- **JavaScript (ES6+):** Pure vanilla JavaScript without frontend framework lock-in.
- **Bootstrap 5.3.3:** Responsive layout, cards, modals, dropdowns, and tabs.
- **Bootstrap Icons 1.11.3:** Vector icons.
- **SheetJS (xlsx.full.min.js):** Real XLSX generation and formula mapping.
- **jsPDF + html2canvas:** High-resolution PDF generation.
- **docx.js + FileSaver.js:** Word (.docx) generation.
- **Chart.js 4.4.2:** Dashboard analytics.
- **Data Persistence:** Browser LocalStorage / IndexedDB abstraction layer.

---

## 📁 Architecture & Folder Structure

```
/fab ---invoice/
  index.html                  # Main Executive Dashboard
  create-invoice.html         # Two-Panel Invoice Creator & Live Preview
  invoices.html               # Invoice Management & Payment Tracker
  clients.html                # Client CRM & Directory
  templates.html              # Template Designer & Customizer
  settings.html               # Company, Banks, Catalog & Backup Settings
  assets/
    css/
      style.css               # Design System (Stripe/Zoho aesthetic, Light/Dark theme)
      invoice-template.css    # 1:1 Pixel-accurate Excel invoice stylesheet
      responsive.css          # Mobile & tablet responsiveness
      print.css               # Clean A4 print stylesheet
    js/
      default-assets.js       # Base64 embedded logos & signatures
      default-data.js         # Initial seed data from template
      calculations.js         # GST calculations, Indian currency words converter
      storage.js              # Centralized DataStore (future PHP/MySQL abstraction)
      template-engine.js      # Template rendering engine
      export-excel.js         # SheetJS XLSX generator
      export-pdf.js           # html2canvas + jsPDF generator
      export-word.js          # Word .docx generator
      export-csv.js           # CSV line item generator
      dashboard.js            # Dashboard KPI & Chart.js logic
      invoice-builder.js      # Two-panel creator reactive controller
      invoices-manager.js     # Invoice table & payment tracking logic
      clients-manager.js      # Client CRM logic
      templates-manager.js    # Template customizer logic
      settings-manager.js     # Configuration & backup/restore logic
      ui.js                   # Sidebar, navbar, theme toggle, toast alerts
    images/
      logo.png                # Header Left Logo (Picture 2 from xlsx)
      brand-badge.png         # Header Badge (Picture 3 from xlsx)
      signature.jpg           # Authorised Signatory Seal (Picture 4 from xlsx)
```

---

## 🔌 Future Backend Compatibility (PHP + MySQL)

The application has been architected with a centralized data service layer (`assets/js/storage.js`).
Every operation (`getInvoices`, `saveInvoice`, `deleteInvoice`, `getClients`, `saveCompany`) calls a standardized method on `DataStore`.

To connect a future **PHP + MySQL** REST backend:
1. Simply replace `localStorage.getItem` / `localStorage.setItem` inside `storage.js` with `fetch('/api/invoices.php')`.
2. None of the UI components, calculation algorithms, template engines, or export modules need to be rewritten!

---

## 💻 How to Run

1. Open this folder in **VS Code**.
2. Right-click `index.html` and select **"Open with Live Server"** (or simply double-click `index.html` in your browser).
3. Everything runs 100% client-side in the browser. No backend server or database installation is required.

