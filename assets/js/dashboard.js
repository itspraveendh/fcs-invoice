/**
 * Dashboard Controller
 * Calculates dynamic metrics, renders Chart.js visualizations,
 * and manages recent invoices.
 */

const Dashboard = {
  charts: {},

  init() {
    this.refresh();
  },

  refresh() {
    const invoices = DataStore.getInvoices();
    this.renderSummaryCards(invoices);
    this.renderCharts(invoices);
    this.renderRecentInvoices(invoices);
  },

  renderSummaryCards(invoices) {
    let totalValue = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueCount = 0;
    let draftCount = 0;
    let totalGst = 0;
    const clientSet = new Set();

    const todayStr = Calculations.formatDate(new Date(), 'YYYY-MM-DD');

    invoices.forEach(inv => {
      const gTot = parseFloat(inv.grandTotal) || 0;
      const pAmt = parseFloat(inv.amountPaid) || 0;
      const bDue = parseFloat(inv.balanceDue) !== undefined ? parseFloat(inv.balanceDue) : Math.max(0, gTot - pAmt);
      const gstAmt = (parseFloat(inv.cgstTotal) || 0) + (parseFloat(inv.sgstTotal) || 0) + (parseFloat(inv.igstTotal) || 0);

      totalValue += gTot;
      paidAmount += pAmt;
      pendingAmount += bDue;
      totalGst += gstAmt;

      if (inv.clientId) clientSet.add(inv.clientId);
      else if (inv.client && (inv.client.name || inv.client.companyName)) clientSet.add(inv.client.companyName || inv.client.name);

      if (inv.status === 'Draft') {
        draftCount++;
      } else if (inv.status === 'Overdue' || (bDue > 0 && inv.dueDate && inv.dueDate < todayStr)) {
        overdueCount++;
      }
    });

    const realizationRate = totalValue > 0 ? ((paidAmount / totalValue) * 100).toFixed(1) : '0.0';

    const setVal = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    const setHtml = (id, html) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };

    setVal('kpi-total-invoices', invoices.length);
    setVal('kpi-total-value', Calculations.formatCurrency(totalValue));
    setVal('kpi-paid-amount', Calculations.formatCurrency(paidAmount));
    setVal('kpi-pending-amount', Calculations.formatCurrency(pendingAmount));
    setVal('kpi-overdue-invoices', overdueCount);
    setVal('kpi-draft-invoices', draftCount);

    // AI Financial Telemetry Metrics
    setVal('ai-realization-rate', `${realizationRate}%`);
    setVal('ai-gst-total', Calculations.formatCurrency(totalGst));
    const activeClientsCount = clientSet.size || (window.DataStore && DataStore.getClients ? DataStore.getClients().length : 4);
    setVal('ai-clients-count', `${activeClientsCount} Corporates`);
    setHtml('kpi-paid-badge', `<i class="bi bi-shield-check"></i> ${realizationRate}% Realized`);
  },

  renderCharts(invoices) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded, skipping chart rendering');
      return;
    }

    // Prepare monthly aggregated data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = new Array(12).fill(0);
    const monthlyPaid = new Array(12).fill(0);
    const monthlyPending = new Array(12).fill(0);
    const monthlyCgst = new Array(12).fill(0);
    const monthlySgst = new Array(12).fill(0);
    const monthlyIgst = new Array(12).fill(0);

    let totalPaidCount = 0;
    let totalUnpaidCount = 0;
    let totalPartialCount = 0;
    let totalDraftCount = 0;

    const clientRevenueMap = {};

    invoices.forEach(inv => {
      const gTot = parseFloat(inv.grandTotal) || 0;
      const pAmt = parseFloat(inv.amountPaid) || 0;
      const bDue = parseFloat(inv.balanceDue) !== undefined ? parseFloat(inv.balanceDue) : Math.max(0, gTot - pAmt);

      if (inv.date) {
        const d = new Date(inv.date);
        const m = d.getMonth();
        if (m >= 0 && m < 12) {
          monthlyRevenue[m] += gTot;
          monthlyPaid[m] += pAmt;
          monthlyPending[m] += bDue;
          monthlyCgst[m] += parseFloat(inv.cgstTotal) || 0;
          monthlySgst[m] += parseFloat(inv.sgstTotal) || 0;
          monthlyIgst[m] += parseFloat(inv.igstTotal) || 0;
        }
      }

      if (inv.status === 'Paid') totalPaidCount++;
      else if (inv.status === 'Partially Paid') totalPartialCount++;
      else if (inv.status === 'Draft') totalDraftCount++;
      else totalUnpaidCount++;

      // Client aggregation
      const cName = (inv.client && (inv.client.companyName || inv.client.name)) || 'Walk-in Client';
      clientRevenueMap[cName] = (clientRevenueMap[cName] || 0) + gTot;
    });

    // Chart 1: Monthly Revenue & Invoicing Trend (Curved Area Chart)
    this.createOrUpdateChart('chart-revenue', {
      type: 'line',
      data: {
        labels: monthNames,
        datasets: [
          {
            label: 'Invoiced Revenue (₹)',
            data: monthlyRevenue,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.12)',
            fill: true,
            tension: 0.38,
            borderWidth: 2.5,
            pointBackgroundColor: '#4f46e5',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Cash Realized (₹)',
            data: monthlyPaid,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            fill: true,
            tension: 0.38,
            borderWidth: 2,
            borderDash: [4, 4],
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { weight: '600', size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ₹${Calculations.formatNumber(ctx.parsed.y, 2)}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: {
              callback: val => '₹' + (val >= 100000 ? (val / 100000).toFixed(1) + 'L' : val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val)
            }
          }
        }
      }
    });

    // Chart 2: Invoice Status Distribution (Vibrant Donut Chart)
    const statusSubtext = document.getElementById('chart-status-subtext');
    if (statusSubtext) {
      statusSubtext.innerHTML = `<span class="badge bg-success-subtle text-success me-1">${totalPaidCount} Paid</span> <span class="badge bg-warning-subtle text-warning me-1">${totalPartialCount} Partial</span> <span class="badge bg-danger-subtle text-danger">${totalUnpaidCount} Unpaid</span>`;
    }

    this.createOrUpdateChart('chart-status', {
      type: 'doughnut',
      data: {
        labels: ['Fully Paid', 'Partially Paid', 'Unpaid / Overdue', 'Draft'],
        datasets: [{
          data: [totalPaidCount, totalPartialCount, totalUnpaidCount, totalDraftCount],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
          hoverOffset: 6,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, padding: 12, font: { size: 11, weight: '500' } }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed} Invoices`
            }
          }
        },
        cutout: '68%'
      }
    });

    // Chart 3: GST Tax Collection Breakdown (Rounded Stacked Bar Chart)
    this.createOrUpdateChart('chart-gst', {
      type: 'bar',
      data: {
        labels: monthNames,
        datasets: [
          {
            label: 'CGST (9%)',
            data: monthlyCgst,
            backgroundColor: '#0284c7',
            borderRadius: 4
          },
          {
            label: 'SGST (9%)',
            data: monthlySgst,
            backgroundColor: '#06b6d4',
            borderRadius: 4
          },
          {
            label: 'IGST (18%)',
            data: monthlyIgst,
            backgroundColor: '#6366f1',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { size: 11, weight: '600' } }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ₹${Calculations.formatNumber(ctx.parsed.y, 2)}`
            }
          }
        },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              callback: val => '₹' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val)
            }
          }
        }
      }
    });

    // Chart 4: Top Clients by Billed Volume (Vibrant Horizontal Bar Chart)
    const sortedClients = Object.entries(clientRevenueMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const clientLabels = sortedClients.length > 0 ? sortedClients.map(c => c[0].length > 22 ? c[0].substring(0, 20) + '...' : c[0]) : ['No Clients Yet'];
    const clientValues = sortedClients.length > 0 ? sortedClients.map(c => c[1]) : [0];
    const clientColors = ['#10b981', '#4f46e5', '#8b5cf6', '#f59e0b', '#0ea5e9'];

    this.createOrUpdateChart('chart-clients', {
      type: 'bar',
      data: {
        labels: clientLabels,
        datasets: [{
          label: 'Total Billed (₹)',
          data: clientValues,
          backgroundColor: clientColors.slice(0, clientLabels.length),
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` Billed Revenue: ₹${Calculations.formatNumber(ctx.parsed.x, 2)}`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: val => '₹' + (val >= 100000 ? (val / 100000).toFixed(1) + 'L' : val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val)
            }
          },
          y: { grid: { display: false } }
        }
      }
    });

    // Chart 5: Cashflow Realization & Recovery Velocity (Grouped Bars)
    this.createOrUpdateChart('chart-cashflow', {
      type: 'bar',
      data: {
        labels: monthNames,
        datasets: [
          {
            label: 'Total Invoiced (₹)',
            data: monthlyRevenue,
            backgroundColor: '#3b82f6',
            borderRadius: 4
          },
          {
            label: 'Cash Realized (₹)',
            data: monthlyPaid,
            backgroundColor: '#10b981',
            borderRadius: 4
          },
          {
            label: 'Outstanding Balance (₹)',
            data: monthlyPending,
            backgroundColor: '#f59e0b',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { size: 11, weight: '600' } }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ₹${Calculations.formatNumber(ctx.parsed.y, 2)}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: {
              callback: val => '₹' + (val >= 100000 ? (val / 100000).toFixed(1) + 'L' : val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val)
            }
          }
        }
      }
    });
  },

  createOrUpdateChart(canvasId, config) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    this.charts[canvasId] = new Chart(ctx, config);
  },

  renderRecentInvoices(invoices) {
    const tbody = document.getElementById('recent-invoices-tbody');
    if (!tbody) return;

    const recent = invoices.slice(0, 7);

    if (recent.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            <i class="bi bi-inbox fs-3 d-block mb-2"></i>
            No invoices found. Click "Create New Invoice" to start!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = recent.map(inv => {
      const statusClass = `badge-status badge-${(inv.status || 'draft').toLowerCase().replace(' ', '-')}`;
      const clientName = (inv.client && (inv.client.companyName || inv.client.name)) || 'Walk-in Client';

      return `
        <tr>
          <td>
            <a href="create-invoice.html?id=${inv.id}" class="fw-bold text-decoration-none text-primary">
              ${inv.invoiceNo}
            </a>
          </td>
          <td>
            <div class="fw-semibold text-truncate" style="max-width: 220px;">${clientName}</div>
            <small class="text-muted">${inv.poNumber ? 'PO: ' + inv.poNumber : (inv.client && inv.client.city ? inv.client.city : '')}</small>
          </td>
          <td>${Calculations.formatDate(inv.date, 'MMM DD, YYYY')}</td>
          <td>${Calculations.formatDate(inv.dueDate, 'MMM DD, YYYY') || '-'}</td>
          <td class="text-end fw-bold">${Calculations.formatCurrency(inv.grandTotal)}</td>
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
                <li><a class="dropdown-item" href="javascript:void(0)" onclick="Dashboard.quickView('${inv.id}')"><i class="bi bi-eye me-2 text-info"></i> Preview</a></li>
                <li><a class="dropdown-item" href="javascript:void(0)" onclick="Dashboard.quickDownload('${inv.id}', 'pdf')"><i class="bi bi-file-earmark-pdf me-2 text-danger"></i> Export PDF</a></li>
                <li><a class="dropdown-item" href="javascript:void(0)" onclick="Dashboard.quickDownload('${inv.id}', 'xlsx')"><i class="bi bi-file-earmark-excel me-2 text-success"></i> Export Excel</a></li>
                <li><a class="dropdown-item" href="javascript:void(0)" onclick="Dashboard.quickDownload('${inv.id}', 'docx')"><i class="bi bi-file-earmark-word me-2 text-primary"></i> Export Word</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="Dashboard.deleteInvoice('${inv.id}')"><i class="bi bi-trash me-2"></i> Delete</a></li>
              </ul>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  quickView(id) {
    const inv = DataStore.getInvoice(id);
    if (!inv) return;
    window.location.href = `create-invoice.html?id=${id}`;
  },

  quickDownload(id, format) {
    const inv = DataStore.getInvoice(id);
    if (!inv) return;

    if (format === 'xlsx') {
      ExportExcel.export(inv);
    } else if (format === 'docx') {
      ExportWord.export(inv);
    } else if (format === 'pdf') {
      if (typeof ExportPdf !== 'undefined') {
        ExportPdf.export(inv);
      } else {
        window.location.href = `create-invoice.html?id=${id}&autoExport=pdf`;
      }
    }
  },

  deleteInvoice(id) {
    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      DataStore.deleteInvoice(id);
      UI.showToast('Invoice deleted successfully', 'success');
      this.refresh();
    }
  }
};

window.Dashboard = Dashboard;

