/* ==========================================================
   3. CITIZEN & DONOR HUB (GATE, RECOMMENDATIONS & SEARCH)
   ========================================================== */

/* 3A. SESSION & CREDENTIAL MODEL
   Credentials live in a module-private map (never in appState, never rendered in the admin table).
   PROTOTYPE ONLY: this is client-side; entry.js retains accounts in sessionStorage for this tab. Real authentication must be server-side
   with a proper password hash (bcrypt/argon2); FNV-1a below is only a non-reversible placeholder. */

const citizenCredentialStore = new Map(); // userId -> { identifierHashes: Set<string>, passHash: string }
const CREDENTIAL_SALT = 'vitallink-proto-v1';
const MIN_PASSWORD_LENGTH = 12;

function fnv1aHash(text) { throw new Error('Server connection is required. Reload the page.'); }

// Phones compare on their last 10 digits so "+91 98765 43210" and "9876543210" match
function normalizeIdentifier(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (!value) return '';
  if (value.includes('@')) return value;
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 7) return digits.slice(-10);
  return value;
}

function isPlausiblePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function isPlausibleEmail(raw) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(raw || '').trim());
}

function storeCitizenCredentials(userId, identifiers, password) { throw new Error('Server connection is required. Reload the page.'); }

function forgetCitizenCredentials(userId) { throw new Error('Server connection is required. Reload the page.'); }

function citizenIdentifierInUse(identifier) { throw new Error('Server connection is required. Reload the page.'); }

function identifierInUse(identifier) { throw new Error('Server connection is required. Reload the page.'); }

// Returns the registry record only when identifier AND password match. Never falls back to another user.
function authenticateCitizen(identifier, password) { throw new Error('Server connection is required. Reload the page.'); }

let userIdSequence = 0;
function generateUserId() {
  userIdSequence += 1;
  return `usr-${Date.now().toString(36)}-${userIdSequence}`;
}

function generateDonorToken(scopeId) {
  const prefix = scopeId && GEOGRAPHIC_SCOPES[scopeId] ? scopeId.slice(0, 3).toUpperCase() : 'NET';
  let token;
  do {
    token = `#ZK-${prefix}-${Math.floor(100 + Math.random() * 900)}`;
  } while (appState.registeredUsers.some(u => u.donorId === token));
  return token;
}

function addCitizenRecord({ name, blood, sector, scopeId, unitsDonated = 0, date = 'Today' }) { throw new Error('Server connection is required. Reload the page.'); }

function startCitizenSession(record, stats = {}) {
  appState.currentCitizenDonor = {
    userId: record.id,
    name: record.name,
    blood: record.blood,
    sector: record.sector,
    scopeId: record.scopeId || stats.scopeId || null,
    id: record.donorId,
    donations: stats.donations ?? record.unitsDonated ?? 0,
    livesSaved: stats.livesSaved ?? (record.unitsDonated || 0) * 3,
    xp: stats.xp ?? 1000,
    appointments: Array.isArray(record.appointments) ? record.appointments.map(a => ({ ...a })) : []
  };
  appState.adminLoggedIn = false;
  appState.citizenLoggedIn = true;
  renderCitizenPortalState();
  if (typeof enterCitizenDashboard === 'function') enterCitizenDashboard();
}

function validateRegistration({ name, blood, identifiers, password }) {
  if (!name) return 'Please enter your full name.';
  if (name.length > 80) return 'Name must be 80 characters or fewer.';
  if (!BLOOD_GROUPS.includes(blood)) return 'Please select a valid blood group.';
  if (!password || password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (identifiers.some(identifierInUse)) return 'An account with this mobile number or email already exists. Please sign in.';
  return null;
}

/* 3B. PORTAL GATE */
    function handleDonorPortalClick() {
      switchPortal('donor');
    }

    function renderCitizenPortalState() {
      const gateView = document.getElementById('donorGateView');
      const dashView = document.getElementById('donorDashboardView');
      if (!gateView || !dashView) return;

      if (appState.citizenLoggedIn && appState.currentCitizenDonor) {
        gateView.style.display = 'none';
        dashView.style.display = 'grid';
        updateCitizenDonorUI();
        updateSmartRecommendation();
        syncDonorBloodFilterButtons();
        renderHospitalStockSearch();
      } else {
        gateView.style.display = 'flex';
        dashView.style.display = 'none';
      }
    }

    function switchGateTab(tab) {
      const regBtn = document.getElementById('btnGateTabRegister');
      const logBtn = document.getElementById('btnGateTabLogin');
      const regForm = document.getElementById('gateRegisterForm');
      const logForm = document.getElementById('gateLoginForm');
      if (!regBtn || !logBtn || !regForm || !logForm) return;

      const isRegister = tab === 'register';
      regBtn.classList.toggle('active', isRegister);
      logBtn.classList.toggle('active', !isRegister);
      regForm.style.display = isRegister ? 'flex' : 'none';
      logForm.style.display = isRegister ? 'none' : 'flex';
      playTone(450, 'sine', 0.06);
    }

    function submitGateRegister() { throw new Error('Server connection is required. Reload the page.'); }

    function submitGateLogin() { throw new Error('Server connection is required. Reload the page.'); }

    // Demo presets: reuse an existing registry record by exact name so the session and the admin row agree
    function quickFillCitizen(name, blood, sector, scopeId) { throw new Error('Server connection is required. Reload the page.'); }

    function citizenLogout() {
      if (typeof logoutEntry === 'function') { logoutEntry(); return; }
      appState.citizenLoggedIn = false;
      appState.currentCitizenDonor = null;
      renderCitizenPortalState();
      playTone(380, 'sine', 0.1);
      showToast('🔒 Citizen session logged out. Data encrypted and closed.');
    }

    function selfDeleteCitizenData() { throw new Error('Server connection is required. Reload the page.'); }

    function updateCitizenDonorUI() {
      if (!appState.currentCitizenDonor) return;
      const c = appState.currentCitizenDonor;
      const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
      };

      setText('authCitizenName', c.name);
      setText('authCitizenBlood', c.blood);
      setText('authCitizenToken', c.id);
      setText('donorCardName', c.name);
      setText('donorCardBlood', c.blood);
      setText('donorCardTier', `${c.verified ? 'Verified Citizen' : 'Pending verification'} • ${c.sector || 'Global Network'}`);
      setText('donorCardCouncil', c.scopeId && GEOGRAPHIC_SCOPES[c.scopeId]
        ? `Blood Transfusion Authority • ${GEOGRAPHIC_SCOPES[c.scopeId].name}`
        : 'Global Blood Transfusion Network');
      setText('donorCardBadgeId', `DONOR ID: ${c.id}`);
      setText('donorDonationsCount', c.donations);
      setText('donorLivesSaved', c.livesSaved);
      setText('donorXpScore', c.donations >= 5 ? 'Priority Universal Donor' : c.donations >= 2 ? 'Active Regular Donor' : (c.verified ? 'Verified Registered Citizen' : 'Pending verification'));
    }

    function copyCitizenToken() {
      if (!appState.currentCitizenDonor) return;
      const token = appState.currentCitizenDonor.id;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(token).then(() => {
          showToast(`📋 Copied Token ID: ${token}`);
          playTone(720, 'sine', 0.08);
        }).catch(() => {
          showToast(`Token ID: ${token}`);
        });
      } else {
        showToast(`Token ID: ${token}`);
      }
    }

/* 3C. SMART RECOMMENDATION ENGINE (ABO/Rh COMPATIBLE) */
    const URGENCY_RANK = { critical: 0, urgent: 1, needed: 2, optimal: 3 };
    const acceptedMatchFacilityIds = new Set();
    const ACCEPT_BUTTON_HTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Accept Recommendation — Dispatch Courier`;

    // Single resolver used by both display and accept, so the button always acts on the facility shown
    function resolveSmartRecommendationTarget() {
      const c = appState.currentCitizenDonor;
      if (!c || !BLOOD_GROUPS.includes(c.blood)) return null;
      const candidates = getFacilitiesForScope(appState.currentScopeId, 'ALL', 'ALL')
        .filter(f => f.urgency !== 'optimal' && canDonateTo(c.blood, f.emergencyNeed))
        .sort((a, b) => {
          const byUrgency = (URGENCY_RANK[a.urgency] ?? 9) - (URGENCY_RANK[b.urgency] ?? 9);
          if (byUrgency !== 0) return byUrgency;
          // Exact-group need first: it preserves universal O- stock for patients who have no alternative
          return (a.emergencyNeed === c.blood ? 0 : 1) - (b.emergencyNeed === c.blood ? 0 : 1);
        });
      return candidates[0] || null;
    }

    function setAcceptButtonState(state) {
      const btn = document.getElementById('btnAcceptSmartMatch');
      if (!btn) return;
      btn.style.background = '';
      if (state === 'accepted') {
        btn.textContent = '✓ Match Confirmed — Priority Courier En-Route';
        btn.style.background = '#10b981';
        btn.disabled = true;
      } else if (state === 'none') {
        btn.textContent = 'No compatible request in this region';
        btn.disabled = true;
      } else {
        btn.innerHTML = ACCEPT_BUTTON_HTML;
        btn.disabled = false;
      }
    }

    function updateSmartRecommendation() {
      const container = document.getElementById('smartRecommendationContent');
      if (!container) return;

      const c = appState.currentCitizenDonor;
      const target = resolveSmartRecommendationTarget();
      appState.smartRecommendationTargetId = target ? target.id : null;

      if (!appState.citizenLoggedIn || !c || !target) {
        const scope = GEOGRAPHIC_SCOPES[appState.currentScopeId];
        container.innerHTML = `
          <div style="font-size: 0.78rem; color: #cbd5e1; line-height: 1.4;">
            No open shortages in <strong>${escapeHTML(scope ? scope.name : 'this region')}</strong> that a
            <strong>${escapeHTML(c ? c.blood : '--')}</strong> donor can safely supply right now.
            Switch region in Live Operations to see other requests.
          </div>
        `;
        setAcceptButtonState('none');
        return;
      }

      const isCritical = target.urgency === 'critical';
      const badgeClass = c.blood.includes('-') ? 'critical' : 'needed';

      container.innerHTML = `
        <div style="display: flex; gap: 0.85rem; align-items: center;">
          <div class="blood-badge-avatar ${badgeClass}">${escapeHTML(c.blood)}</div>
          <div>
            <div style="font-size: 0.88rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 6px;">
              <span class="status-dot-pulse" style="background: ${isCritical ? 'var(--color-danger)' : 'var(--color-primary)'};"></span>
              ${isCritical ? 'Urgent Transfusion Shortage' : 'Transfusion Reserve Priority'}: ${escapeHTML(target.name)}
            </div>
            <div style="font-size: 0.72rem; color: #cbd5e1; margin-top: 3px; line-height: 1.4;">
              📍 ${escapeHTML(target.city)}, ${escapeHTML(target.country)} • ${escapeHTML(target.emergencyStatus)}. Requests
              <strong style="color:${isCritical ? '#fb7185' : '#38bdf8'};">${target.unitsNeeded} units of ${escapeHTML(target.emergencyNeed)}</strong>.
              Your ${escapeHTML(c.blood)} donation is compatible with this request (${escapeHTML(target.dist || 'Direct Transit Corridor')}).
            </div>
          </div>
        </div>
      `;
      setAcceptButtonState(acceptedMatchFacilityIds.has(target.id) ? 'accepted' : 'ready');
    }

    function acceptSmartRecommendation() {
      const c = appState.currentCitizenDonor;
      const target = getFacilityById(appState.smartRecommendationTargetId);
      if (!appState.citizenLoggedIn || !c || !target) {
        updateSmartRecommendation();
        return;
      }
      if (acceptedMatchFacilityIds.has(target.id)) return;
      acceptedMatchFacilityIds.add(target.id);

      setAcceptButtonState('accepted');
      selectFacilityToSchedule(target.id);
      showToast(`Donation centre selected: ${target.name}. Choose a date to book your appointment.`);

    }

/* 3D. LIVE BLOOD DISCOVERY & HOSPITAL STOCK SEARCH (own filter state, never touches the Ops map filter) */
    function syncDonorBloodFilterButtons() {
      const filter = appState.donorStockBloodFilter;
      document.querySelectorAll('.blood-filter-btn').forEach(btn => {
        const btnBlood = btn.dataset?.blood || String(btn.textContent || '').trim().split(' ')[0];
        const isActive = isAllFilter(filter) ? isAllFilter(btnBlood) || btnBlood.toLowerCase() === 'all' : btnBlood === filter;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    function setBloodFilter(filter) {
      appState.donorStockBloodFilter = isAllFilter(filter) || !BLOOD_GROUPS.includes(filter) ? 'ALL' : filter;
      syncDonorBloodFilterButtons();
      renderHospitalStockSearch();
      playTone(520, 'sine', 0.05);
    }

    function filterHospitalStock() {
      renderHospitalStockSearch();
    }

    function renderHospitalStockSearch() {
      const grid = document.getElementById('hospitalStockResultsGrid');
      if (!grid) return;

      const q = (document.getElementById('bloodSearchInput')?.value || '').toLowerCase().trim();
      const filter = appState.donorStockBloodFilter;
      const lc = v => String(v || '').toLowerCase();

      const facilities = GLOBAL_FACILITIES.filter(h => {
        const matchesScope = facilityMatchesScope(h, appState.currentScopeId);
        const matchesQuery = !q || lc(h.name).includes(q) || lc(h.city).includes(q) || lc(h.country).includes(q) || lc(h.type).includes(q);
        return matchesScope && matchesQuery;
      });

      if (facilities.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 1.5rem; font-size: 0.75rem;">No medical centres found matching search criteria in current scope.</div>`;
        return;
      }

      const requestGroup = isAllFilter(filter) ? (appState.currentCitizenDonor?.blood || 'O-') : filter;

      grid.innerHTML = facilities.map(h => {
        let stockDisplay;
        if (isAllFilter(filter)) {
          const totalUnits = h.stock ? Object.values(h.stock).reduce((a, b) => a + b, 0) : 0;
          stockDisplay = `<span style="color: #fff; font-weight: 800;">${totalUnits} Units Total</span> • Central Facility Stock`;
        } else {
          const units = (h.stock && h.stock[filter]) || 0;
          const isLow = units < 8;
          stockDisplay = `<span style="color: ${isLow ? '#fb7185' : '#34d399'}; font-weight: 800; font-size: 0.88rem;">${units} Units of ${filter}</span> ${isLow ? '(CRITICAL DEFICIT)' : '(AVAILABLE)'}`;
        }

        return `
          <div class="hospital-stock-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                <div style="font-weight: 800; color: #fff; font-size: 0.82rem;">${escapeHTML(h.name)}</div>
                <span style="font-size: 0.65rem; color: #38bdf8; font-weight: 700; background: rgba(14,165,233,0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(14,165,233,0.25);">${escapeHTML(h.dist || 'Verified Node')}</span>
              </div>
              <div style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 6px;">📍 ${escapeHTML(h.city)}, ${escapeHTML(h.country)} • ${escapeHTML(h.emergencyStatus)}</div>
              <div style="font-size: 0.72rem; margin: 4px 0;">${stockDisplay}</div>
            </div>

            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-danger" style="font-size: 0.68rem; padding: 5px 10px;" type="button" aria-label="Request blood units from ${escapeHTML(h.name)}" onclick="requestHospitalBlood('${h.id}', '${requestGroup}')">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                Request Units
              </button>
              <button class="btn btn-primary" style="font-size: 0.68rem; padding: 5px 10px;" type="button" aria-label="Schedule blood donation at ${escapeHTML(h.name)}" onclick="selectFacilityToSchedule('${h.id}')">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Schedule Donation
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    function selectFacilityToSchedule(facilityRef) {
      const f = resolveFacility(facilityRef);
      const select = document.getElementById('schedFacility');
      if (!f || !select) return;
      if (!Array.from(select.options || []).some(o => o.value === f.id)) {
        populateScheduleOptions();
      }
      select.value = f.id;
      if (typeof select.scrollIntoView === 'function') select.scrollIntoView({ behavior: 'smooth', block: 'center' });
      playTone(550, 'sine', 0.08);
      showToast(`Selected "${escapeHTML(f.name)}" for donation appointment.`);
    }

    function requestHospitalBlood(facilityRef, bloodGroup) { throw new Error('Server connection is required. Reload the page.'); }

/* 3E. APPOINTMENT BOOKING */
    function toLocalISODate(d) {
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    // Options are generated from real data and the real calendar; hard-coded dates went stale
    function populateScheduleOptions(daysAhead = 7) {
      const facilitySelect = document.getElementById('schedFacility');
      if (facilitySelect && typeof document.createElement === 'function') {
        const previous = facilitySelect.value;
        facilitySelect.innerHTML = '';
        const groups = [
          { label: '🇮🇳 India National Network', items: GLOBAL_FACILITIES.filter(f => f.country === 'India') },
          { label: '🌐 International Healthcare Hubs', items: GLOBAL_FACILITIES.filter(f => f.country !== 'India') }
        ];
        groups.forEach(g => {
          const og = document.createElement('optgroup');
          og.label = g.label;
          g.items.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = `${escapeHTML(f.name)} (${f.city})`;
            og.appendChild(opt);
          });
          facilitySelect.appendChild(og);
        });
        if (previous && getFacilityById(previous)) facilitySelect.value = previous;
      }

      const dateSelect = document.getElementById('schedDate');
      if (dateSelect && typeof document.createElement === 'function') {
        const previous = dateSelect.value;
        dateSelect.innerHTML = '';
        const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        for (let i = 1; i <= daysAhead; i++) {
          const d = new Date();
          d.setHours(12, 0, 0, 0);
          d.setDate(d.getDate() + i);
          const opt = document.createElement('option');
          opt.value = toLocalISODate(d);
          opt.textContent = (i === 1 ? 'Tomorrow · ' : '') + fmt.format(d);
          dateSelect.appendChild(opt);
        }
        if (previous) dateSelect.value = previous;
      }
    }

    function bookAppointment() { throw new Error('Server connection is required. Reload the page.'); }

/* 3F. MODAL AUTHENTICATION (alternate entry point; shares the gate's validation and session logic) */
    function openUserAuthModal() {
      if (typeof showEntryView === 'function') { showEntryView('login'); return; }
      const modal = document.getElementById('userAuthModal');
      if (modal) modal.classList.add('open');
      playTone(480, 'sine', 0.08);
    }

    function closeUserAuthModal() {
      const modal = document.getElementById('userAuthModal');
      if (modal) modal.classList.remove('open');
    }

    function switchAuthTab(tab) {
      const isRegister = tab === 'register';
      document.getElementById('tabRegister')?.classList.toggle('active', isRegister);
      document.getElementById('tabLogin')?.classList.toggle('active', !isRegister);
      const regForm = document.getElementById('formRegister');
      const logForm = document.getElementById('formLogin');
      if (regForm) regForm.style.display = isRegister ? 'flex' : 'none';
      if (logForm) logForm.style.display = isRegister ? 'none' : 'flex';
      playTone(450, 'sine', 0.06);
    }

    function submitUserRegister() { throw new Error('Server connection is required. Reload the page.'); }

    function submitUserLogin() { throw new Error('Server connection is required. Reload the page.'); }

    const DEMO_CITIZEN_USERNAME = '';
    const DEMO_CITIZEN_EMAIL = '';
    const DEMO_CITIZEN_PASSWORD = '';
    

    function quickFillDemoUser() { throw new Error('Server connection is required. Reload the page.'); }

const selectHospitalForDonation = selectFacilityToSchedule;

if (typeof window !== 'undefined') {
  window.handleDonorPortalClick = handleDonorPortalClick;
  window.renderCitizenPortalState = renderCitizenPortalState;
  window.switchGateTab = switchGateTab;
  window.submitGateRegister = submitGateRegister;
  window.submitGateLogin = submitGateLogin;
  window.quickFillCitizen = quickFillCitizen;
  window.citizenLogout = citizenLogout;
  window.selfDeleteCitizenData = selfDeleteCitizenData;
  window.forgetCitizenCredentials = forgetCitizenCredentials;
  window.copyCitizenToken = copyCitizenToken;
  window.updateCitizenDonorUI = updateCitizenDonorUI;
  window.updateSmartRecommendation = updateSmartRecommendation;
  window.resolveSmartRecommendationTarget = resolveSmartRecommendationTarget;
  window.acceptSmartRecommendation = acceptSmartRecommendation;
  window.setBloodFilter = setBloodFilter;
  window.renderHospitalStockSearch = renderHospitalStockSearch;
  window.filterHospitalStock = filterHospitalStock;
  window.selectFacilityToSchedule = selectFacilityToSchedule;
  window.selectHospitalForDonation = selectHospitalForDonation;
  window.requestHospitalBlood = requestHospitalBlood;
  window.populateScheduleOptions = populateScheduleOptions;
  window.bookAppointment = bookAppointment;
  window.openUserAuthModal = openUserAuthModal;
  window.closeUserAuthModal = closeUserAuthModal;
  window.switchAuthTab = switchAuthTab;
  window.submitUserRegister = submitUserRegister;
  window.submitUserLogin = submitUserLogin;
  window.quickFillDemoUser = quickFillDemoUser;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleDonorPortalClick,
    renderCitizenPortalState,
    switchGateTab,
    submitGateRegister,
    submitGateLogin,
    quickFillCitizen,
    citizenLogout,
    selfDeleteCitizenData,
    forgetCitizenCredentials,
    copyCitizenToken,
    updateCitizenDonorUI,
    updateSmartRecommendation,
    resolveSmartRecommendationTarget,
    acceptSmartRecommendation,
    setBloodFilter,
    renderHospitalStockSearch,
    filterHospitalStock,
    selectFacilityToSchedule,
    selectHospitalForDonation,
    requestHospitalBlood,
    populateScheduleOptions,
    bookAppointment,
    openUserAuthModal,
    closeUserAuthModal,
    switchAuthTab,
    submitUserRegister,
    submitUserLogin,
    quickFillDemoUser
  };
}
