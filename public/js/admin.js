/* ==========================================================
   2. PLATFORM OWNER AUTHENTICATION & DATA AUDIT CONTROLS
   ========================================================== */
/* 2. PLATFORM OWNER AUTHENTICATION (SECURE - NO CREDENTIALS LEAKED) */
    function handleAdminPortalClick() {
      if (appState.adminLoggedIn) {
        switchPortal('admin');
      } else {
        openAdminAuthModal();
      }
    }

    function openAdminAuthModal() {
      if (typeof showEntryView === 'function') { showEntryView('login'); return; }
      const modal = document.getElementById('adminAuthModal');
      if (!modal) return;
      modal.classList.add('open');
      const userField = document.getElementById('adminUserField');
      if (userField && typeof userField.focus === 'function') {
        setTimeout(() => userField.focus(), 50);
      }
      if (typeof playTone === 'function') playTone(480, 'sine', 0.08);
    }

    function closeAdminAuthModal() {
      const modal = document.getElementById('adminAuthModal');
      if (modal) modal.classList.remove('open');
    }

    function quickFillDemoAdmin() { throw new Error('Server connection is required. Reload the page.'); }

    function submitAdminLogin() { throw new Error('Server connection is required. Reload the page.'); }

    function adminLogout() { throw new Error('Server connection is required. Reload the page.'); }

    function renderAdminKPIs() {
      const kpi = document.getElementById('kpiDonorsCount');
      if (kpi) kpi.textContent = appState.totalCitizenCount.toLocaleString();
    }

    /* 2B. PLATFORM OWNER USER DATA MANAGEMENT (DELETE & AUDIT RIGHTS) */
    function renderDonorsAuditTable(filterQuery = '') {
      const tbody = document.getElementById('donorsAuditTableBody');
      const countBadge = document.getElementById('adminAuditCountBadge');
      if (!tbody) return;

      const q = String(filterQuery || '').toLowerCase().trim();
      const esc = escapeHTML;
      const filtered = appState.registeredUsers.filter(u => 
        !q || 
        u.name.toLowerCase().includes(q) || 
        u.blood.toLowerCase().includes(q) || 
        u.sector.toLowerCase().includes(q) ||
        (u.donorId && u.donorId.toLowerCase().includes(q))
      );

      if (countBadge) {
        countBadge.textContent = `${filtered.length} of ${appState.registeredUsers.length} Citizens in Registry`;
      }

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding: 1.5rem; font-size:0.75rem;">No citizen donor records found matching search.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(u => `
        <tr id="donor-row-${esc(u.id)}">
          <td>
            <div style="color:#fff; font-weight:700; font-size:0.8rem;">${esc(u.name)}</div>
            <div style="font-size:0.65rem; color:var(--text-muted); font-family:var(--font-mono);">${esc(u.donorId || '#ZK-ASM-REG')} • Reg: ${esc(u.date || 'Active')}</div>
          </td>
          <td>
            <span class="blood-badge ${String(u.blood).includes('-') ? 'critical' : 'needed'}">${esc(u.blood)}</span>
          </td>
          <td style="color:#cbd5e1; font-size:0.72rem;">${esc(u.sector)}</td>
          <td>
            <span style="color:${u.status === 'Verified' ? '#10b981' : '#f59e0b'}; font-weight:700; font-size:0.68rem; display:inline-flex; align-items:center; gap:4px;">
              <span class="status-dot-pulse" style="background:${u.status === 'Verified' ? '#10b981' : '#f59e0b'}; width:5px; height:5px;"></span>
              ${u.status === 'Verified' ? 'Verified' : 'Pending Check'}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn-approve-user" onclick="toggleUserVerify('${esc(u.id)}')" title="Toggle verification status" aria-label="Toggle user verification">
              ${u.status === 'Verified' ? 'Revoke' : 'Approve'}
            </button>
            <button class="btn-delete-user" onclick="deleteUserData('${esc(u.id)}')" title="Permanently delete this user record" aria-label="Delete citizen data record">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete Record
            </button>
          </td>
        </tr>
      `).join('');
    }

    let adminSearchTimer = null;
    function filterAdminDonors() {
      clearTimeout(adminSearchTimer);
      adminSearchTimer = setTimeout(() => {
        const input = document.getElementById('adminUserSearchInput');
        renderDonorsAuditTable(input ? input.value : '');
      }, 120);
    }

    function toggleUserVerify(userId) { throw new Error('Server connection is required. Reload the page.'); }

    const pendingDeletes = new Set();
    function deleteUserData(userId) { throw new Error('Server connection is required. Reload the page.'); }

/* 7. INVENTORY MATRIX */
    function renderInventoryGrid() {
      const grid = document.getElementById('inventoryGrid');
      if (!grid) return;
      grid.innerHTML = '';
      appState.inventory.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'inv-card' + (item.isRed ? ' low' : '');
        card.innerHTML = `
          <div class="inv-header">
            <span class="inv-type ${item.isRed ? 'red' : ''}">${item.type}</span>
            <span style="font-size: 0.65rem; color: ${item.isRed ? '#fb7185' : '#38bdf8'}; font-weight: 700;">${item.status}</span>
          </div>
          <div class="inv-count">${item.count} <span>Units</span></div>
          <div class="inv-controls">
            <button class="inv-btn minus" onclick="adjustStock(${idx}, -1)" aria-label="Decrease ${item.type} stock" ${item.count <= 0 ? 'disabled' : ''}>-</button>
            <button class="inv-btn" onclick="adjustStock(${idx}, 1)" aria-label="Increase ${item.type} stock">+</button>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    function adjustStock(idx, delta) { throw new Error('Server connection is required. Reload the page.'); }

    function restockAll() { throw new Error('Server connection is required. Reload the page.'); }

    function adminBroadcastSos() { throw new Error('Server connection is required. Reload the page.'); }

    // Dynamic population of hospital dropdown in Platform Owner console
    function populateAdminHospitalSelect() {
      const select = document.getElementById('sosHospitalSelect');
      if (!select || typeof GLOBAL_FACILITIES === 'undefined') return;

      select.innerHTML = '';
      
      // Group by country / region
      const indiaGroup = document.createElement('optgroup');
      indiaGroup.label = '🇮🇳 India National Network';
      const globalGroup = document.createElement('optgroup');
      globalGroup.label = '🌐 International Healthcare Hubs';

      GLOBAL_FACILITIES.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = `${escapeHTML(f.name)} (${f.city})`;
        if (f.country === 'India') {
          indiaGroup.appendChild(opt);
        } else {
          globalGroup.appendChild(opt);
        }
      });

      select.appendChild(indiaGroup);
      select.appendChild(globalGroup);
    }

if (typeof window !== 'undefined') {
  window.handleAdminPortalClick = handleAdminPortalClick;
  window.openAdminAuthModal = openAdminAuthModal;
  window.closeAdminAuthModal = closeAdminAuthModal;
  window.submitAdminLogin = submitAdminLogin;
  window.quickFillDemoAdmin = quickFillDemoAdmin;
  window.adminLogout = adminLogout;
  window.renderDonorsAuditTable = renderDonorsAuditTable;
  window.filterAdminDonors = filterAdminDonors;
  window.toggleUserVerify = toggleUserVerify;
  window.deleteUserData = deleteUserData;
  window.renderInventoryGrid = renderInventoryGrid;
  window.adjustStock = adjustStock;
  window.restockAll = restockAll;
  window.adminBroadcastSos = adminBroadcastSos;
  window.populateAdminHospitalSelect = populateAdminHospitalSelect;
  window.renderAdminKPIs = renderAdminKPIs;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleAdminPortalClick,
    openAdminAuthModal,
    closeAdminAuthModal,
    submitAdminLogin,
    quickFillDemoAdmin,
    adminLogout,
    renderDonorsAuditTable,
    filterAdminDonors,
    toggleUserVerify,
    deleteUserData,
    renderInventoryGrid,
    adjustStock,
    restockAll,
    adminBroadcastSos,
    populateAdminHospitalSelect,
    renderAdminKPIs
  };
}

