/**
 * Default Data & Seed Configuration
 * Primary reference: FSE-2026-27-XXX- SAMPLE - XX-XX-XXXX.xlsx
 * Company: FAB STEEL ENGINEERING SERVICES
 */

const DEFAULT_COMPANY = {
  id: 'comp-fab-01',
  name: 'FAB STEEL ENGINEERING SERVICES',
  tagline: 'Structural Steel Detailing & Engineering Solutions',
  address: 'Dr.no. 13/158/F, Mettur Main road, Mecheri, Mettur, Salem , Tamil Nadu - 636453',
  phone: '+91 8300621360',
  email: 'fabsteelengineering@gmail.com',
  gstin: '33BLBPJ7865F1Z3',
  pan: 'BLBPJ7865F',
  state: 'Tamil Nadu',
  stateCode: '33',
  udyamNo: 'UDYAM-TN-20-0060945',
  website: 'www.fabsteel.in',
  pin: '636453',
  city: 'Salem',
  logo: (window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.logo) || 'assets/images/logo.png',
  badge: (window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.badge) || 'assets/images/brand-badge.png',
  signature: (window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.signature) || 'assets/images/signature.jpg',
  signatoryTitle: 'Authorised signatory',
  certText: 'We hereby certify that the particulars given above are true and correct to the best of our knowedge and belief',
  forCompanyText: 'For FAB STEEL ENGINEERING SERVICES'
};

const DEFAULT_BANK_ACCOUNTS = [
  {
    id: 'bank-01',
    bankName: 'AXIS BANK',
    accountHolder: 'FAB STEEL ENGINEERING SERVICES',
    accountNo: '923020038419128',
    ifsc: 'UTIB0001282',
    branch: 'Mecheri Branch',
    upiId: '8300621360@okaxis',
    isDefault: true
  },
  {
    id: 'bank-02',
    bankName: 'STATE BANK OF INDIA',
    accountHolder: 'FAB STEEL ENGINEERING SERVICES',
    accountNo: '38920194821',
    ifsc: 'SBIN0001420',
    branch: 'Mettur Main Branch',
    upiId: 'fabsteel@sbi',
    isDefault: false
  }
];

const DEFAULT_TERMS_PRESETS = [
  {
    id: 'terms-fab-excel',
    name: 'Fab Steel Engineering Official (from Template)',
    isDefault: true,
    items: [
      '1. GST & Tax: GST will be charged @ 18% as applicable. For export services, invoice will be issued under LUT (Letter of Undertaking) without payment of GST, as per GST rules.',
      '2. Scope of Work: Services include structural steel detailing / modeling as per approved drawings and inputs provided by the client. Any additional work or revisions beyond agreed scope will be charged extra.',
      '3. Payment Terms: Payment to be made within 21 days from invoice date. Delay in payment may attract interest @ 18% per annum.',
      '4. Confidentiality: All drawings, models, and project-related information shared between both parties shall remain strictly confidential.',
      '5. Acceptance: By making payment, the client agrees to all the terms and conditions mentioned in this invoice.',
      '6. Delivery: All deliverables (drawings, models, reports) will be shared via electronic mode (Email / Cloud / FTP).',
      '7. Liability: The company is not responsible for errors due to incorrect input data provided by the client.',
      '8. Jurisdiction: All disputes are subject to jurisdiction of Salem, Tamil Nadu, India.'
    ]
  },
  {
    id: 'terms-export-lut',
    name: 'Export Services (LUT - Zero GST)',
    isDefault: false,
    items: [
      '1. Export under LUT without payment of Integrated Tax (IGST) as per Section 16(3) of IGST Act 2017.',
      '2. Payment to be remitted in foreign convertible currency via wire transfer / SWIFT.',
      '3. Scope of structural detailing / modeling deliverables as per agreed statement of work (SOW).',
      '4. Standard review period: 10 business days upon delivery of models and shop drawings.',
      '5. Jurisdiction: Salem, Tamil Nadu, India.'
    ]
  },
  {
    id: 'terms-domestic-advance',
    name: 'Standard Milestone / 50% Advance',
    isDefault: false,
    items: [
      '1. GST charged @ 18% as applicable.',
      '2. 50% advance along with Purchase Order, balance 50% upon drawing approval prior to final issue.',
      '3. Revisions due to architectural or design changes will be invoiced on hourly basis.',
      '4. All intellectual property remains with Fab Steel until complete dues are cleared.',
      '5. Jurisdiction: Salem, Tamil Nadu, India.'
    ]
  }
];

const DEFAULT_CLIENTS = [
  {
    id: 'client-001',
    name: 'Apex Structural Infra Pvt Ltd',
    companyName: 'Apex Structural Infra Pvt Ltd',
    contactPerson: 'Rajesh Sharma',
    email: 'accounts@apexinfra.com',
    phone: '+91 9876543210',
    gstin: '24AAACA1234F1Z5',
    pan: 'AAACA1234F',
    state: 'Gujarat',
    stateCode: '24',
    address: 'Plot 42, GIDC Industrial Estate, Vatva, Ahmedabad, Gujarat - 382445',
    notes: 'Key client for western region industrial plant structures'
  },
  {
    id: 'client-002',
    name: 'Chennai Metrorail Heavy Fab Ltd',
    companyName: 'Chennai Metrorail Heavy Fab Ltd',
    contactPerson: 'K. Venkatesh',
    email: 'billing@chennaimetrorail.in',
    phone: '+91 9444123456',
    gstin: '33AABCC5678G1Z1',
    pan: 'AABCC5678G',
    state: 'Tamil Nadu',
    stateCode: '33',
    address: 'Ambattur Industrial Estate, Chennai, Tamil Nadu - 600058',
    notes: 'Local government metro viaduct project vendor'
  },
  {
    id: 'client-003',
    name: 'Bharat Heavy Structures Corp',
    companyName: 'Bharat Heavy Structures Corp',
    contactPerson: 'Sunil Nair',
    email: 'procurement@bhscorp.com',
    phone: '+91 9845098765',
    gstin: '29AADCB9988H1Z8',
    pan: 'AADCB9988H',
    state: 'Karnataka',
    stateCode: '29',
    address: 'Peenya Industrial Area 2nd Stage, Bangalore, Karnataka - 560058',
    notes: 'Airport terminal roof truss detailing partner'
  },
  {
    id: 'client-004',
    name: 'Paramount Pre-Engineered Buildings Ltd',
    companyName: 'Paramount Pre-Engineered Buildings Ltd',
    contactPerson: 'Anand Kulkarni',
    email: 'finance@paramountpeb.com',
    phone: '+91 9765432109',
    gstin: '27AABCP7741J1ZQ',
    pan: 'AABCP7741J',
    state: 'Maharashtra',
    stateCode: '27',
    address: 'Chakan MIDC Phase 2, Pune, Maharashtra - 410501',
    notes: 'PEB warehouse structural modeling contracts'
  }
];

const DEFAULT_PRODUCT_CATALOG = [
  {
    id: 'prod-001',
    description: 'Structural Steel 3D Modeling & Detailing (Tekla Structures)',
    hsn: '998333',
    unit: 'TON',
    rate: 150,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    category: 'Engineering Services'
  },
  {
    id: 'prod-002',
    description: 'Connection Design & Engineering Calculation Reports',
    hsn: '998333',
    unit: 'NOS',
    rate: 4500,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    category: 'Design Services'
  },
  {
    id: 'prod-003',
    description: 'Fabrication Shop Drawings & Assembly Drawings Preparation',
    hsn: '998333',
    unit: 'TON',
    rate: 120,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    category: 'Detailing Services'
  },
  {
    id: 'prod-004',
    description: 'Erection Plans, General Arrangement & Anchor Bolt Layouts',
    hsn: '998333',
    unit: 'SET',
    rate: 12500,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    category: 'Drawings'
  },
  {
    id: 'prod-005',
    description: 'CNC Data, NC1 & DXF Files Preparation for Automation',
    hsn: '998333',
    unit: 'JOB',
    rate: 8000,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    category: 'Automation Deliverables'
  }
];

const DEFAULT_SETTINGS = {
  currency: 'INR',
  currencySymbol: '₹',
  financialYear: '2026-27',
  invoicePrefix: 'FSE',
  invoiceNumberFormat: '{PREFIX}-{FY}-{NUM:3}',
  nextSerial: 7,
  defaultPaymentDays: 21,
  defaultTemplateId: 'tpl-fab-excel',
  defaultTermsPresetId: 'terms-fab-excel',
  defaultGstRate: 18,
  enableRoundOff: true,
  autoDetectGstType: true,
  theme: 'light',
  primaryColor: '#2563eb'
};

const DEFAULT_INVOICES = [
  {
    id: 'inv-001',
    invoiceNo: 'FSE-2026-27-006',
    date: '2026-10-24',
    dueDate: '2026-11-14',
    poNumber: 'PO/2026/FSE/098',
    poValue: 140053,
    refNumber: 'REF-INFRA-889',
    quoteRef: 'PD-FAB-2026-27-RFQ-01',
    reverseCharge: 'N',
    invoiceType: 'Tax Invoice',
    copyType: 'Original for Recipient',
    status: 'Paid',
    templateId: 'tpl-fab-excel',
    clientId: 'client-001',
    client: {
      name: 'Apex Structural Infra Pvt Ltd',
      companyName: 'Apex Structural Infra Pvt Ltd',
      address: 'Plot 42, GIDC Industrial Estate, Vatva, Ahmedabad, Gujarat - 382445',
      gstin: '24AAACA1234F1Z5',
      pan: 'AAACA1234F',
      state: 'Gujarat',
      stateCode: '24'
    },
    company: { ...DEFAULT_COMPANY },
    bankAccountId: 'bank-01',
    terms: DEFAULT_TERMS_PRESETS[0].items,
    customColumns: [],
    items: [
      {
        id: 'item-1',
        sNo: 1,
        description: 'Structural Steel Detailing & Modeling - Industrial Shed Phase 1',
        hsn: '998333',
        qty: 1,
        ton: 666.67,
        rate: 150,
        amount: 100000.50,
        discount: 0,
        taxableValue: 100000.50,
        taxMode: 'inter', // Inter-state IGST 18%
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 18,
        igstAmount: 18000.09,
        total: 118000.59
      },
      {
        id: 'item-2',
        sNo: 2,
        description: 'Connection Detailing, Shop Drawings & CNC Deliverables',
        hsn: '998333',
        qty: 1,
        ton: 124.67,
        rate: 150,
        amount: 18700.50,
        discount: 0,
        taxableValue: 18700.50,
        taxMode: 'inter',
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 18,
        igstAmount: 3366.09,
        total: 22066.59
      }
    ],
    subtotal: 118701.00,
    totalDiscount: 0,
    taxableAmount: 118701.00,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 21366.18,
    totalTax: 21366.18,
    additionalCharges: 0,
    roundOff: -0.18,
    grandTotal: 140067,
    amountInWords: 'One Lakh Forty Thousand Sixty-Seven Rupees Only',
    amountPaid: 140067,
    balanceDue: 0,
    payments: [
      {
        id: 'pay-001',
        date: '2026-10-28',
        amount: 140067,
        method: 'NEFT',
        ref: 'AXISN10984723',
        notes: 'Full payment received via Axis Bank'
      }
    ],
    notes: 'Thank you for partnering with Fab Steel Engineering Services.'
  },
  {
    id: 'inv-002',
    invoiceNo: 'FSE-2026-27-005',
    date: '2026-10-15',
    dueDate: '2026-11-05',
    poNumber: 'CMRL/2026/041',
    poValue: 245000,
    refNumber: 'REF-METRO-032',
    quoteRef: 'PD-FAB-2026-27-RFQ-02',
    reverseCharge: 'N',
    invoiceType: 'Tax Invoice',
    copyType: 'Original for Recipient',
    status: 'Partially Paid',
    templateId: 'tpl-fab-excel',
    clientId: 'client-002',
    client: {
      name: 'Chennai Metrorail Heavy Fab Ltd',
      companyName: 'Chennai Metrorail Heavy Fab Ltd',
      address: 'Ambattur Industrial Estate, Chennai, Tamil Nadu - 600058',
      gstin: '33AABCC5678G1Z1',
      pan: 'AABCC5678G',
      state: 'Tamil Nadu',
      stateCode: '33'
    },
    company: { ...DEFAULT_COMPANY },
    bankAccountId: 'bank-01',
    terms: DEFAULT_TERMS_PRESETS[0].items,
    customColumns: [],
    items: [
      {
        id: 'item-201',
        sNo: 1,
        description: 'Elevated Station Concourse Steel Detailing',
        hsn: '998333',
        qty: 1,
        ton: 1000.00,
        rate: 150,
        amount: 150000.00,
        discount: 0,
        taxableValue: 150000.00,
        taxMode: 'intra', // Intra-state CGST 9% + SGST 9%
        cgstRate: 9,
        cgstAmount: 13500.00,
        sgstRate: 9,
        sgstAmount: 13500.00,
        igstRate: 0,
        igstAmount: 0,
        total: 177000.00
      },
      {
        id: 'item-202',
        sNo: 2,
        description: 'Connection Calculation Reports & Peer Review Sign-off',
        hsn: '998333',
        qty: 1,
        ton: 0,
        rate: 57627.12,
        amount: 57627.12,
        discount: 0,
        taxableValue: 57627.12,
        taxMode: 'intra',
        cgstRate: 9,
        cgstAmount: 5186.44,
        sgstRate: 9,
        sgstAmount: 5186.44,
        igstRate: 0,
        igstAmount: 0,
        total: 68000.00
      }
    ],
    subtotal: 207627.12,
    totalDiscount: 0,
    taxableAmount: 207627.12,
    cgstTotal: 18686.44,
    sgstTotal: 18686.44,
    igstTotal: 0,
    totalTax: 37372.88,
    additionalCharges: 0,
    roundOff: 0.00,
    grandTotal: 245000,
    amountInWords: 'Two Lakh Forty-Five Thousand Rupees Only',
    amountPaid: 150000,
    balanceDue: 95000,
    payments: [
      {
        id: 'pay-002',
        date: '2026-10-20',
        amount: 150000,
        method: 'RTGS',
        ref: 'SBIR9823412',
        notes: 'Advance installment received'
      }
    ],
    notes: 'Balance due within payment terms.'
  },
  {
    id: 'inv-003',
    invoiceNo: 'FSE-2026-27-004',
    date: '2026-09-20',
    dueDate: '2026-10-11',
    poNumber: 'BHS/PO/771',
    poValue: 88500,
    refNumber: 'REF-BHS-219',
    quoteRef: 'PD-FAB-2026-27-RFQ-03',
    reverseCharge: 'N',
    invoiceType: 'Tax Invoice',
    copyType: 'Original for Recipient',
    status: 'Overdue',
    templateId: 'tpl-fab-excel',
    clientId: 'client-003',
    client: {
      name: 'Bharat Heavy Structures Corp',
      companyName: 'Bharat Heavy Structures Corp',
      address: 'Peenya Industrial Area 2nd Stage, Bangalore, Karnataka - 560058',
      gstin: '29AADCB9988H1Z8',
      pan: 'AADCB9988H',
      state: 'Karnataka',
      stateCode: '29'
    },
    company: { ...DEFAULT_COMPANY },
    bankAccountId: 'bank-01',
    terms: DEFAULT_TERMS_PRESETS[0].items,
    customColumns: [],
    items: [
      {
        id: 'item-301',
        sNo: 1,
        description: 'Truss Detailing & Shop Fabrication Erection Drawings',
        hsn: '998333',
        qty: 1,
        ton: 500.00,
        rate: 150,
        amount: 75000.00,
        discount: 0,
        taxableValue: 75000.00,
        taxMode: 'inter',
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 18,
        igstAmount: 13500.00,
        total: 88500.00
      }
    ],
    subtotal: 75000.00,
    totalDiscount: 0,
    taxableAmount: 75000.00,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 13500.00,
    totalTax: 13500.00,
    additionalCharges: 0,
    roundOff: 0.00,
    grandTotal: 88500,
    amountInWords: 'Eighty-Eight Thousand Five Hundred Rupees Only',
    amountPaid: 0,
    balanceDue: 88500,
    payments: [],
    notes: 'Urgent: Overdue invoice reminder sent.'
  },
  {
    id: 'inv-004',
    invoiceNo: 'FSE-2026-27-007',
    date: '2026-11-02',
    dueDate: '2026-11-23',
    poNumber: 'PEB/2026/902',
    poValue: 59000,
    refNumber: 'REF-PEB-55',
    quoteRef: 'PD-FAB-2026-27-RFQ-04',
    reverseCharge: 'N',
    invoiceType: 'Tax Invoice',
    copyType: 'Original for Recipient',
    status: 'Sent',
    templateId: 'tpl-fab-excel',
    clientId: 'client-004',
    client: {
      name: 'Paramount Pre-Engineered Buildings Ltd',
      companyName: 'Paramount Pre-Engineered Buildings Ltd',
      address: 'Chakan MIDC Phase 2, Pune, Maharashtra - 410501',
      gstin: '27AABCP7741J1ZQ',
      pan: 'AABCP7741J',
      state: 'Maharashtra',
      stateCode: '27'
    },
    company: { ...DEFAULT_COMPANY },
    bankAccountId: 'bank-01',
    terms: DEFAULT_TERMS_PRESETS[0].items,
    customColumns: [],
    items: [
      {
        id: 'item-401',
        sNo: 1,
        description: 'Cold Formed Secondary Members & Purlin Detailing',
        hsn: '998333',
        qty: 1,
        ton: 333.33,
        rate: 150,
        amount: 49999.50,
        discount: 0,
        taxableValue: 49999.50,
        taxMode: 'inter',
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 18,
        igstAmount: 8999.91,
        total: 58999.41
      }
    ],
    subtotal: 49999.50,
    totalDiscount: 0,
    taxableAmount: 49999.50,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 8999.91,
    totalTax: 8999.91,
    additionalCharges: 0,
    roundOff: -0.41,
    grandTotal: 58999,
    amountInWords: 'Fifty-Eight Thousand Nine Hundred Ninety-Nine Rupees Only',
    amountPaid: 0,
    balanceDue: 58999,
    payments: [],
    notes: 'Dispatched to accounts via email.'
  }
];

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-fab-excel',
    name: 'Fab Steel Engineering Official (Original Excel Template)',
    description: 'Pixel-accurate recreation of the uploaded Excel invoice format with cyan headers, yellow highlight totals, and complete GST columns.',
    isDefault: true,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 8, bottom: 8, left: 8, right: 8 },
      tableBorderWidth: 1,
      cellPadding: 4,
      fontFamily: "'Bookman Old Style', 'Calibri', serif, sans-serif"
    },
    colors: {
      headerBg: '#4BD0FF', // Cyan from Excel
      headerText: '#000000',
      tableHeaderBg: '#4BD0FF',
      tableHeaderText: '#000000',
      totalRowBg: '#FFFF00', // Yellow from Excel
      totalRowText: '#000000',
      greyBg: '#D9D9D9',
      borderColor: '#000000',
      highlightColor: '#FFFF00'
    },
    sections: [
      { id: 'sec-header', name: 'Company Header & Logos', enabled: true, order: 1 },
      { id: 'sec-title', name: 'Invoice Title & Copy Type', enabled: true, order: 2 },
      { id: 'sec-meta', name: 'Invoice Meta Grid (No, Date, PO, Ref)', enabled: true, order: 3 },
      { id: 'sec-billing', name: 'Billing From & Billing To', enabled: true, order: 4 },
      { id: 'sec-items', name: 'Product / Service Table', enabled: true, order: 5 },
      { id: 'sec-words', name: 'Amount in Words', enabled: true, order: 6 },
      { id: 'sec-bank', name: 'Bank Details', enabled: true, order: 7 },
      { id: 'sec-totals', name: 'Totals Summary & GST Breakdown', enabled: true, order: 8 },
      { id: 'sec-terms', name: 'Terms & Conditions', enabled: true, order: 9 },
      { id: 'sec-sign', name: 'Certification & Signature Block', enabled: true, order: 10 },
      { id: 'sec-footer', name: 'Head Office & UDYAM Footer', enabled: true, order: 11 }
    ],
    columns: {
      showTon: true,
      showDiscount: true,
      showHsn: true,
      showCgst: true,
      showSgst: true,
      showIgst: true
    }
  },
  {
    id: 'tpl-modern-minimal',
    name: 'Modern Executive Minimalist',
    description: 'Clean contemporary design inspired by Stripe Dashboard & FreshBooks with slate accents and soft rounded borders.',
    isDefault: false,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 12, bottom: 12, left: 12, right: 12 },
      tableBorderWidth: 1,
      cellPadding: 6,
      fontFamily: "'Inter', -apple-system, sans-serif"
    },
    colors: {
      headerBg: '#1e293b',
      headerText: '#ffffff',
      tableHeaderBg: '#f1f5f9',
      tableHeaderText: '#0f172a',
      totalRowBg: '#e2e8f0',
      totalRowText: '#0f172a',
      greyBg: '#f8fafc',
      borderColor: '#cbd5e1',
      highlightColor: '#2563eb'
    },
    sections: [
      { id: 'sec-header', name: 'Company Header & Logos', enabled: true, order: 1 },
      { id: 'sec-title', name: 'Invoice Title & Copy Type', enabled: true, order: 2 },
      { id: 'sec-meta', name: 'Invoice Meta Grid (No, Date, PO, Ref)', enabled: true, order: 3 },
      { id: 'sec-billing', name: 'Billing From & Billing To', enabled: true, order: 4 },
      { id: 'sec-items', name: 'Product / Service Table', enabled: true, order: 5 },
      { id: 'sec-totals', name: 'Totals Summary & GST Breakdown', enabled: true, order: 6 },
      { id: 'sec-words', name: 'Amount in Words', enabled: true, order: 7 },
      { id: 'sec-bank', name: 'Bank Details & QR Code', enabled: true, order: 8 },
      { id: 'sec-terms', name: 'Terms & Conditions', enabled: true, order: 9 },
      { id: 'sec-sign', name: 'Certification & Signature Block', enabled: true, order: 10 },
      { id: 'sec-footer', name: 'Head Office & UDYAM Footer', enabled: true, order: 11 }
    ],
    columns: {
      showTon: true,
      showDiscount: true,
      showHsn: true,
      showCgst: true,
      showSgst: true,
      showIgst: true
    }
  },
  {
    id: 'tpl-corporate-blue',
    name: 'Corporate Royal Blue',
    description: 'High-contrast professional corporate styling with deep royal blue headers and structured grid lines.',
    isDefault: false,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 10, bottom: 10, left: 10, right: 10 },
      tableBorderWidth: 1,
      cellPadding: 5,
      fontFamily: "'Segoe UI', Roboto, sans-serif"
    },
    colors: {
      headerBg: '#1e40af',
      headerText: '#ffffff',
      tableHeaderBg: '#dbeafe',
      tableHeaderText: '#1e3a8a',
      totalRowBg: '#bfdbfe',
      totalRowText: '#1e3a8a',
      greyBg: '#f0fdf4',
      borderColor: '#93c5fd',
      highlightColor: '#1d4ed8'
    },
    sections: [
      { id: 'sec-header', name: 'Company Header & Logos', enabled: true, order: 1 },
      { id: 'sec-title', name: 'Invoice Title & Copy Type', enabled: true, order: 2 },
      { id: 'sec-meta', name: 'Invoice Meta Grid (No, Date, PO, Ref)', enabled: true, order: 3 },
      { id: 'sec-billing', name: 'Billing From & Billing To', enabled: true, order: 4 },
      { id: 'sec-items', name: 'Product / Service Table', enabled: true, order: 5 },
      { id: 'sec-words', name: 'Amount in Words', enabled: true, order: 6 },
      { id: 'sec-totals', name: 'Totals Summary & GST Breakdown', enabled: true, order: 7 },
      { id: 'sec-bank', name: 'Bank Details & QR Code', enabled: true, order: 8 },
      { id: 'sec-terms', name: 'Terms & Conditions', enabled: true, order: 9 },
      { id: 'sec-sign', name: 'Certification & Signature Block', enabled: true, order: 10 },
      { id: 'sec-footer', name: 'Head Office & UDYAM Footer', enabled: true, order: 11 }
    ],
    columns: {
      showTon: true,
      showDiscount: true,
      showHsn: true,
      showCgst: true,
      showSgst: true,
      showIgst: true
    }
  }
];

(typeof window !== 'undefined' ? window : global).DEFAULT_DATA = {
  company: DEFAULT_COMPANY,
  bankAccounts: DEFAULT_BANK_ACCOUNTS,
  termsPresets: DEFAULT_TERMS_PRESETS,
  clients: DEFAULT_CLIENTS,
  catalog: DEFAULT_PRODUCT_CATALOG,
  settings: DEFAULT_SETTINGS,
  invoices: DEFAULT_INVOICES,
  templates: DEFAULT_TEMPLATES
};
if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : global).DEFAULT_DATA;
}

