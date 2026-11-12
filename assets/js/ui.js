/**
 * Shared UI Controller
 * Manages Sidebar, Navbar, Theme Toggling, Toast Notifications, and Breadcrumbs.
 */

const UI = {
  init(activePage = 'dashboard') {
    this.activePage = activePage;
    this.applyTheme(DataStore.getTheme());
    this.renderSidebar();
    this.renderNavbar();
    this.setupEvents();
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' 
        ? '<i class="bi bi-sun-fill text-warning"></i>' 
        : '<i class="bi bi-moon-stars-fill text-primary"></i>';
    }
  },

  toggleTheme() {
    const current = DataStore.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    DataStore.setTheme(next);
    this.applyTheme(next);
  },

  renderSidebar() {
    const sidebarEl = document.getElementById('app-sidebar');
    if (!sidebarEl) return;

    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill', href: 'index.html' },
      { id: 'invoices', label: 'All Invoices', icon: 'bi-receipt-cutoff', href: 'invoices.html' },
      { id: 'create-invoice', label: 'Create Invoice', icon: 'bi-plus-circle-fill', href: 'create-invoice.html', badge: 'New' },
      { id: 'clients', label: 'Client CRM', icon: 'bi-people-fill', href: 'clients.html' },
      { id: 'templates', label: 'Template Designer', icon: 'bi-palette-fill', href: 'templates.html' },
      { id: 'settings', label: 'Settings & Data', icon: 'bi-gear-fill', href: 'settings.html' }
    ];

    const company = DataStore.getCompany();

    sidebarEl.innerHTML = `
      <div class="sidebar-brand-wrapper">
        <a href="index.html" class="sidebar-brand d-flex align-items-center gap-2 text-decoration-none">
          <div class="brand-icon-box">
            <i class="bi bi-building-fill text-white"></i>
          </div>
          <div class="brand-text-box">
            <div class="brand-title">FAB STEEL</div>
            <div class="brand-subtitle">Invoice System</div>
          </div>
        </a>
        <button class="btn btn-sm btn-link d-lg-none text-muted" id="sidebar-close-btn">
          <i class="bi bi-x-lg fs-5"></i>
        </button>
      </div>

      <div class="sidebar-nav-container">
        <div class="nav-category">CORE NAVIGATION</div>
        <ul class="nav flex-column sidebar-nav-list">
          ${navItems.map(item => `
            <li class="nav-item">
              <a href="${item.href}" class="nav-link ${this.activePage === item.id ? 'active' : ''}">
                <i class="bi ${item.icon} nav-icon"></i>
                <span class="nav-label">${item.label}</span>
                ${item.badge ? `<span class="badge bg-primary ms-auto">${item.badge}</span>` : ''}
              </a>
            </li>
          `).join('')}
        </ul>

        <div class="nav-category mt-4">QUICK REFERENCE</div>
        <div class="sidebar-company-card p-3 mx-3 rounded">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-info-subtle text-info border">ACTIVE GST</span>
            <small class="text-muted ms-auto">TN-33</small>
          </div>
          <div class="fw-bold text-truncate small">${company.name}</div>
          <div class="small text-muted font-monospace">${company.gstin}</div>
          <div class="mt-2 pt-2 border-top border-secondary-subtle d-flex justify-content-between align-items-center small">
            <span>Financial Year:</span>
            <span class="badge bg-secondary">2026-27</span>
          </div>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="d-flex align-items-center gap-2 p-3">
          <div class="user-avatar">
            <span>FS</span>
          </div>
          <div class="user-info text-truncate">
            <div class="small fw-bold">Fab Steel Admin</div>
            <div class="x-small text-muted">Admin Account</div>
          </div>
          <a href="settings.html" class="btn btn-sm btn-link text-muted ms-auto" title="Settings">
            <i class="bi bi-gear"></i>
          </a>
        </div>
      </div>
    `;

    const closeBtn = document.getElementById('sidebar-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.body.classList.remove('sidebar-open');
      });
    }
  },

  renderNavbar() {
    const navbarEl = document.getElementById('app-navbar');
    if (!navbarEl) return;

    navbarEl.innerHTML = `
      <div class="d-flex align-items-center w-100">
        <button class="btn btn-link text-dark d-lg-none me-2 p-0" id="sidebar-toggle-btn">
          <i class="bi bi-list fs-3"></i>
        </button>

        <div class="navbar-search-wrapper me-3">
          <div class="input-group input-group-sm">
            <span class="input-group-text bg-transparent border-end-0">
              <i class="bi bi-search text-muted"></i>
            </span>
            <input type="text" id="global-search-input" class="form-control border-start-0 ps-0" placeholder="Search invoices, clients, PO numbers... (Ctrl+K)" />
          </div>
        </div>

        <div class="ms-auto d-flex align-items-center gap-2">
          <!-- Quick create button -->
          <a href="create-invoice.html" class="btn btn-sm btn-primary d-none d-sm-inline-flex align-items-center gap-1">
            <i class="bi bi-plus-lg"></i>
            <span>New Invoice</span>
          </a>

          <!-- Theme toggle -->
          <button class="btn btn-sm btn-light border rounded-circle p-2" id="theme-toggle-btn" title="Toggle Light/Dark Theme">
            <i class="bi bi-moon-stars-fill text-primary"></i>
          </button>

          <!-- Notification dropdown -->
          <div class="dropdown">
            <button class="btn btn-sm btn-light border rounded-circle p-2 position-relative" data-bs-toggle="dropdown">
              <i class="bi bi-bell-fill text-secondary"></i>
              <span class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm p-2" style="width: 280px;">
              <li class="dropdown-header fw-bold">Recent System Alerts</li>
              <li>
                <div class="p-2 border-bottom">
                  <div class="small fw-bold text-danger">Invoice Overdue</div>
                  <div class="small text-muted">FSE-2026-27-004 is 31 days overdue (₹88,500)</div>
                </div>
              </li>
              <li>
                <div class="p-2 border-bottom">
                  <div class="small fw-bold text-success">Full Payment Received</div>
                  <div class="small text-muted">FSE-2026-27-006 paid via NEFT (₹1,40,067)</div>
                </div>
              </li>
              <li class="text-center pt-2">
                <a href="invoices.html" class="small text-primary text-decoration-none">View all invoices</a>
              </li>
            </ul>
          </div>

          <!-- User profile menu -->
          <div class="dropdown">
            <button class="btn btn-sm btn-light border d-flex align-items-center gap-2 rounded-pill px-2" data-bs-toggle="dropdown">
              <span class="badge bg-primary rounded-circle p-1">FS</span>
              <span class="small fw-semibold d-none d-md-inline">Fab Steel</span>
              <i class="bi bi-chevron-down small text-muted"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
              <li><h6 class="dropdown-header">FAB STEEL SERVICES</h6></li>
              <li><a class="dropdown-item" href="settings.html"><i class="bi bi-building me-2"></i> Company Profile</a></li>
              <li><a class="dropdown-item" href="templates.html"><i class="bi bi-palette me-2"></i> Invoice Templates</a></li>
              <li><a class="dropdown-item" href="settings.html#tab-data"><i class="bi bi-database-down me-2"></i> Backup & Restore</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="DataStore.resetToDemo(); location.reload();"><i class="bi bi-arrow-counterclockwise me-2"></i> Reset Demo Data</a></li>
            </ul>
          </div>
        </div>
      </div>
    `;

    // Sidebar mobile toggle
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-open');
      });
    }

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Global search
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
          window.location.href = `invoices.html?search=${encodeURIComponent(searchInput.value.trim())}`;
        }
      });
    }
  },

  setupEvents() {
    // Keyboard shortcut Ctrl+K for search
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      }
    });
  },

  showToast(message, type = 'success', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(container);
    }

    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success text-white' : (type === 'danger' ? 'bg-danger text-white' : 'bg-primary text-white');
    const iconClass = type === 'success' ? 'bi-check-circle-fill' : (type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill');

    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = `toast align-items-center ${bgClass} border-0 shadow`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${iconClass} fs-5"></i>
          <div>${message}</div>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    container.appendChild(toastEl);
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
      const bsToast = new bootstrap.Toast(toastEl, { delay: duration });
      bsToast.show();
      toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    } else {
      setTimeout(() => toastEl.remove(), duration);
    }
  }
};

window.UI = UI;

