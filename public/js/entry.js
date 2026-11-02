/* Login-first prototype shell. This is UI routing, not server authorization. */
const ENTRY_STORAGE_KEY = 'vitallink-flow-accounts-v1';
let entryStorageAvailable = true;
let entryRestoring = false;

function entryEl(id) { return document.getElementById(id); }
function setEntryFeedback(message = '', error = false) {
  const el = entryEl('entryFeedback');
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
  el.classList.toggle('is-error', error);
  el.setAttribute('role', error ? 'alert' : 'status');
}
function entryHasSession() { return appState.adminLoggedIn || (appState.citizenLoggedIn && !!appState.currentCitizenDonor); }
function entrySetHash(hash, replace = false) {
  if (window.location.hash === hash) return;
  try { window.history[replace ? 'replaceState' : 'pushState']({ entry: hash.slice(1) }, '', hash); } catch (_) {}
}
function showEntryView(view = 'login', message = '', replace = false) {
  if (entryHasSession()) { switchPortal(appState.adminLoggedIn ? 'admin' : 'donor', false); return; }
  const register = view === 'register';
  entryEl('appShell').hidden = true;
  entryEl('appShell').setAttribute('inert', '');
  entryEl('entryView').hidden = false;
  entryEl('entryLoginForm').hidden = register;
  entryEl('entryRegisterForm').hidden = !register;
  entryEl('entryDemoPanel').hidden = register;
  entryEl('entryTitle').textContent = register ? 'Create your account.' : 'Sign in to VitalLink.';
  entryEl('entrySubtitle').textContent = register ? 'Create your citizen account. Then sign in to get started.' : 'Access your citizen dashboard or administrator console.';
  entryEl('entryStepNumber').textContent = register ? '02' : '01';
  entryEl('entryStepLabel').textContent = register ? 'JOIN THE NETWORK' : 'YOUR ACCOUNT';
  appState.currentPortal = 'login';
  entryEl('entryPassword').value = '';
  entryEl('entryPassword').type = 'password';
  entryEl('entryPasswordToggle').textContent = 'Show';
  entryEl('entryPasswordToggle').setAttribute('aria-label', 'Show password');
  entryEl('entryPasswordToggle').setAttribute('aria-pressed', 'false');
  entryEl('entryNewPassword').value = '';
  entryEl('entryConfirmPassword').value = '';
  document.querySelectorAll('.modal-backdrop.open').forEach(el => el.classList.remove('open'));
  setEntryFeedback(message);
  entrySetHash(register ? '#register' : '#login', replace);
  entryEl('entryView').scrollTop = 0;
  entryEl('entryTitle').focus({ preventScroll: true });
}
function guardEntryRoute(portalId) {
  if (!entryHasSession()) { showEntryView('login', '', true); return false; }
  if (portalId !== 'donor' && !appState.adminLoggedIn) {
    showToast('This account opens the citizen dashboard. Operations and administrative actions require an admin account.', 'critical');
    entrySetHash('#portal=donor', true);
    return false;
  }
  if (portalId === 'donor' && appState.adminLoggedIn) {
    entrySetHash('#portal=admin', true);
    return false;
  }
  entryEl('entryView').hidden = true;
  entryEl('appShell').hidden = false;
  entryEl('appShell').removeAttribute('inert');
  entryEl('btn-portal-admin').hidden = !appState.adminLoggedIn;
  ['btn-portal-ops', 'triggerSosBtn', 'opsSearch', 'opsScopeBar'].forEach(id => { entryEl(id).hidden = !appState.adminLoggedIn; });
  entryEl('btn-portal-donor').hidden = !appState.citizenLoggedIn;
  entryEl('adminSessionPill').style.display = appState.adminLoggedIn ? 'flex' : 'none';
  return true;
}
function enterCitizenDashboard() {
  const region = appState.currentCitizenDonor && appState.currentCitizenDonor.scopeId;
  if (region && GEOGRAPHIC_SCOPES[region]) setGeographicScope(region);
  switchPortal('donor');
}
function submitEntryLogin() { throw new Error('Server connection is required. Reload the page.'); }
function submitEntryRegister() { throw new Error('Server connection is required. Reload the page.'); }
function logoutEntry() { throw new Error('Server connection is required. Reload the page.'); }
function fillEntryDemo(role) { throw new Error('Server connection is required. Reload the page.'); }
function toggleEntryPassword() {
  const field = entryEl('entryPassword');
  const show = field.type === 'password';
  field.type = show ? 'text' : 'password';
  entryEl('entryPasswordToggle').textContent = show ? 'Hide' : 'Show';
  entryEl('entryPasswordToggle').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  entryEl('entryPasswordToggle').setAttribute('aria-pressed', String(show));
}
function persistEntryAccounts() { throw new Error('Server connection is required. Reload the page.'); }
function restoreEntryAccounts() { throw new Error('Server connection is required. Reload the page.'); }
function handleEntryNavigation() {
  if (typeof hospitalSession !== 'undefined' && hospitalSession) { showHospitalDashboard(); return; }
  if (!entryHasSession()) { showEntryView(window.location.hash === '#register' ? 'register' : 'login', '', true); return; }
  const match = window.location.hash.match(/^#portal=(ops|admin|donor)$/);
  const portal = match ? match[1] : (appState.adminLoggedIn ? 'admin' : 'donor');
  if ((portal !== 'donor' && !appState.adminLoggedIn) || (portal === 'donor' && !appState.citizenLoggedIn)) {
    switchPortal(appState.adminLoggedIn ? 'admin' : 'donor', false);
    entrySetHash(appState.adminLoggedIn ? '#portal=admin' : '#portal=donor', true);
  } else { switchPortal(portal, false); entrySetHash(`#portal=${portal}`, true); }
}
function initializeEntryFlow() { throw new Error('Server connection is required. Reload the page.'); }
window.addEventListener('hashchange', handleEntryNavigation);
