/* ==========================================================
   VITALLINK GLOBAL HEALTHCARE DATA & GEOGRAPHIC ARCHITECTURE
   - Global Geographic Scopes (World, India National, Metro Hubs, Global Hubs)
   - Scalable Unified Facility Model (Hospitals, Blood Banks, Donation Centers)
   - Privacy-Preserving Donor Network (Zero Personally Identifiable Info)
   - Authoritative Data Trust & Freshness Registry
   ========================================================== */

/* ----------------------------------------------------------
   1. GLOBAL GEOGRAPHIC SCOPES & SPATIAL DEFINITIONS
   ---------------------------------------------------------- */

const GEOGRAPHIC_SCOPES = {
  world: {
    id: 'world',
    name: 'Global Blood Network',
    breadcrumb: 'Global Network',
    country: 'Global',
    region: 'Worldwide',
    center: [15.0000, 24.0000],
    zoom: 1.8,
    badge: '🌍 Worldwide Scope'
  },
  india: {
    id: 'india',
    name: 'India National Network',
    breadcrumb: 'Global > India > National Grid',
    country: 'India',
    region: 'National',
    center: [78.9629, 21.5937],
    zoom: 4.6,
    badge: '🇮🇳 India National'
  },
  delhi: {
    id: 'delhi',
    name: 'Delhi NCR Capital Hub',
    breadcrumb: 'Global > India > Delhi NCR',
    country: 'India',
    region: 'Delhi',
    center: [77.2090, 28.6139],
    zoom: 12.2,
    badge: '📍 Delhi NCR'
  },
  mumbai: {
    id: 'mumbai',
    name: 'Mumbai Metropolitan Grid',
    breadcrumb: 'Global > India > Maharashtra > Mumbai',
    country: 'India',
    region: 'Maharashtra',
    center: [72.8777, 19.0760],
    zoom: 12.2,
    badge: '📍 Mumbai'
  },
  bengaluru: {
    id: 'bengaluru',
    name: 'Bengaluru Health Corridor',
    breadcrumb: 'Global > India > Karnataka > Bengaluru',
    country: 'India',
    region: 'Karnataka',
    center: [77.5946, 12.9716],
    zoom: 12.2,
    badge: '📍 Bengaluru'
  },
  kolkata: {
    id: 'kolkata',
    name: 'Kolkata Eastern Hub',
    breadcrumb: 'Global > India > West Bengal > Kolkata',
    country: 'India',
    region: 'West Bengal',
    center: [88.3639, 22.5726],
    zoom: 12.2,
    badge: '📍 Kolkata'
  },
  chennai: {
    id: 'chennai',
    name: 'Chennai Health Corridor',
    breadcrumb: 'Global > India > Tamil Nadu > Chennai',
    country: 'India',
    region: 'Tamil Nadu',
    center: [80.2707, 13.0827],
    zoom: 12.2,
    badge: '📍 Chennai'
  },
  hyderabad: {
    id: 'hyderabad',
    name: 'Hyderabad Deccan Network',
    breadcrumb: 'Global > India > Telangana > Hyderabad',
    country: 'India',
    region: 'Telangana',
    center: [78.4867, 17.3850],
    zoom: 12.2,
    badge: '📍 Hyderabad'
  },
  guwahati: {
    id: 'guwahati',
    name: 'Guwahati Northeast Corridor',
    breadcrumb: 'Global > India > Assam > Guwahati',
    country: 'India',
    region: 'Assam',
    center: [91.7650, 26.1600],
    zoom: 12.6,
    badge: '📍 Guwahati'
  },
  london: {
    id: 'london',
    name: 'London Metropolitan Hub',
    breadcrumb: 'Global > United Kingdom > London',
    country: 'United Kingdom',
    region: 'Greater London',
    center: [-0.1278, 51.5074],
    zoom: 12.2,
    badge: '🇬🇧 London'
  },
  newyork: {
    id: 'newyork',
    name: 'New York Tristate Network',
    breadcrumb: 'Global > United States > New York',
    country: 'United States',
    region: 'New York',
    center: [-73.9851, 40.7488],
    zoom: 12.2,
    badge: '🇺🇸 New York'
  },
  toronto: {
    id: 'toronto',
    name: 'Toronto Healthcare Corridor',
    breadcrumb: 'Global > Canada > Ontario > Toronto',
    country: 'Canada',
    region: 'Ontario',
    center: [-79.3832, 43.6532],
    zoom: 12.2,
    badge: '🇨🇦 Toronto'
  },
  dubai: {
    id: 'dubai',
    name: 'Dubai Healthcare City Grid',
    breadcrumb: 'Global > UAE > Dubai',
    country: 'UAE',
    region: 'Dubai',
    center: [55.2708, 25.2048],
    zoom: 12.2,
    badge: '🇦🇪 Dubai'
  },
  singapore: {
    id: 'singapore',
    name: 'Singapore National Grid',
    breadcrumb: 'Global > Singapore',
    country: 'Singapore',
    region: 'Singapore',
    center: [103.8198, 1.3521],
    zoom: 12.2,
    badge: '🇸🇬 Singapore'
  },
  tokyo: {
    id: 'tokyo',
    name: 'Tokyo Metropolitan Health Grid',
    breadcrumb: 'Global > Japan > Tokyo',
    country: 'Japan',
    region: 'Kanto',
    center: [139.6917, 35.6895],
    zoom: 12.2,
    badge: '🇯🇵 Tokyo'
  },
  sydney: {
    id: 'sydney',
    name: 'Sydney Healthcare Grid',
    breadcrumb: 'Global > Australia > New South Wales > Sydney',
    country: 'Australia',
    region: 'New South Wales',
    center: [151.2093, -33.8688],
    zoom: 12.2,
    badge: '🇦🇺 Sydney'
  },
  paris: {
    id: 'paris',
    name: 'Paris Île-de-France Medical Sector',
    breadcrumb: 'Global > France > Île-de-France > Paris',
    country: 'France',
    region: 'Île-de-France',
    center: [2.3522, 48.8566],
    zoom: 12.2,
    badge: '🇫🇷 Paris'
  }
};

/* ----------------------------------------------------------
   2. UNIFIED GLOBAL FACILITIES DATASET (VERIFIED & AUDITED)
   ---------------------------------------------------------- */

const GLOBAL_FACILITIES = [];

/* ----------------------------------------------------------
   3. PRIVACY-PRESERVING GLOBAL DONOR NODES
   (District / Sector level only — Zero Personal Identifiable Info)
   ---------------------------------------------------------- */

const GLOBAL_DONORS = [];

/* ----------------------------------------------------------
   4. CENTRALIZED APPLICATION RUNTIME STATE
   ---------------------------------------------------------- */

const appState = {
  currentPortal: 'ops',
  currentScopeId: 'india', // Initial demonstration opens on India National Network
  activeFacilityTypeFilter: 'ALL',
  activeBloodFilter: 'ALL',
  mapMode: 'streets',

  // Authentication & Governance
  adminLoggedIn: false,
  ownerProfile: {
    name: 'Platform Owner',
    role: 'Global Platform Architect & Super-Admin',
    id: 'SYS-GLOBAL-01'
  },
  citizenLoggedIn: false,
  currentCitizenDonor: null,

  // Session dispatch ledger: survives queue re-renders so a dispatched ticket stays dispatched
  dispatchedFacilityIds: new Set(),

  // Citizen Hub stock search keeps its own filter so it never desyncs the Ops map filter
  donorStockBloodFilter: 'ALL',

  // Global inventory aggregations
  inventory: [],

  // Platform citizen registry
  totalCitizenCount: 0,
  registeredUsers: []
};

/* ----------------------------------------------------------
   5. COMPATIBILITY ALIASES & QUERY HELPERS
   ---------------------------------------------------------- */

const BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

// Red-cell donation compatibility: donor group -> recipient groups it can safely supply
const DONOR_COMPATIBILITY = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

function canDonateTo(donorGroup, recipientGroup) {
  const allowed = DONOR_COMPATIBILITY[donorGroup];
  return Array.isArray(allowed) && allowed.includes(recipientGroup);
}

// 'ALL' / 'all' / '' / null all mean "no filter"; the Ops and Donor UIs historically used different casings
function isAllFilter(value) {
  return !value || String(value).toLowerCase() === 'all';
}

function escapeHTML(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function facilityMatchesScope(f, scopeId) {
  if (!f) return false;
  if (!scopeId || scopeId === 'world' || scopeId === 'all') return true;
  if (scopeId === 'india') return f.country === 'India';
  return f.scopeId === scopeId;
}

// Dynamically retrieve facilities matching scope, facility type, and blood filter
function getFacilitiesForScope(scopeId = appState.currentScopeId, typeFilter = appState.activeFacilityTypeFilter, bloodFilter = appState.activeBloodFilter) {
  const norm = str => String(str || '').toLowerCase().replace(/[\s_-]+/g, '');
  return GLOBAL_FACILITIES.filter(f => {
    const matchesScope = facilityMatchesScope(f, scopeId);
    const matchesType = isAllFilter(typeFilter) ? true : norm(f.type).includes(norm(typeFilter));
    const matchesBlood = isAllFilter(bloodFilter) ? true : (f.emergencyNeed === bloodFilter || (f.stock && f.stock[bloodFilter] > 0));
    return matchesScope && matchesType && matchesBlood;
  });
}

function getDonorsForScope(scopeId = appState.currentScopeId) {
  return GLOBAL_DONORS.filter(d => {
    if (!scopeId || scopeId === 'world' || scopeId === 'all') return true;
    if (scopeId === 'india') {
      const scope = GEOGRAPHIC_SCOPES[d.scopeId];
      return !!scope && scope.country === 'India';
    }
    return d.scopeId === scopeId;
  });
}

// Great-circle distance in km; used to pick the genuinely nearest donor station for a route
function haversineKm(lng1, lat1, lng2, lat2) {
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestDonorNode(f) {
  if (!f) return null;
  let best = null;
  let bestKm = Infinity;
  GLOBAL_DONORS.forEach(d => {
    const km = haversineKm(f.lng, f.lat, d.lng, d.lat);
    if (km < bestKm) {
      bestKm = km;
      best = d;
    }
  });
  // A donor node on another continent is not a meaningful courier origin
  return bestKm <= 150 ? best : null;
}

// Global search query evaluator across facilities, cities, countries, and blood groups
function searchGlobalDirectory(queryText) {
  const q = String(queryText || '').toLowerCase().trim();
  if (!q) return [];

  // 1. Matches on Geographic Scopes (Cities, Countries, Metros)
  const matchingScopes = Object.values(GEOGRAPHIC_SCOPES).filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.country.toLowerCase().includes(q) ||
    s.region.toLowerCase().includes(q) ||
    s.id.toLowerCase().includes(q)
  ).map(s => ({
    resultType: 'scope',
    title: s.name,
    subtitle: `${s.region}, ${s.country}`,
    scope: s,
    lat: s.center[1],
    lng: s.center[0],
    zoom: s.zoom
  }));

  // 2. Matches on Facilities (Hospitals, Blood Banks)
  const lc = v => String(v || '').toLowerCase();
  const matchingFacilities = GLOBAL_FACILITIES.filter(f =>
    lc(f.name).includes(q) ||
    lc(f.city).includes(q) ||
    lc(f.state).includes(q) ||
    lc(f.country).includes(q) ||
    lc(f.emergencyNeed) === q
  ).map(f => ({
    resultType: 'facility',
    title: f.name,
    subtitle: `${f.type} • ${f.city}, ${f.country} • Need: ${f.emergencyNeed}`,
    facility: f,
    lat: f.lat,
    lng: f.lng,
    zoom: 14.5
  }));

  return [...matchingScopes, ...matchingFacilities].slice(0, 8);
}

// Backward compatibility bindings for legacy references
const realHospitals = GLOBAL_FACILITIES;
const realDonors = GLOBAL_DONORS;
appState.hospitalStockData = GLOBAL_FACILITIES;

function getFacilityById(id) {
  if (!id) return null;
  const direct = GLOBAL_FACILITIES.find(f => f.id === id);
  if (direct) return direct;
  // Aliases for backwards compatibility
  const aliases = {
    'delhi-1': 'aiims-delhi',
    'delhi-2': 'safdarjung-delhi',
    'mumbai-1': 'kem-mumbai',
    'mumbai-2': 'tata-mumbai',
    'blr-1': 'nimhans-blr',
    'ghy-1': 'gmch',
    'gmch-hosp-guwahati': 'gmch',
    'ghy-2': 'gmch-bloodbank',
    'kol-1': 'sskm-kolkata',
    'kol-2': 'central-bloodbank-kolkata'
  };
  if (aliases[id]) {
    return GLOBAL_FACILITIES.find(f => f.id === aliases[id]) || null;
  }
  return null;
}

// Central-reserve status is derived from count in one place so admin edits, dispatch and restock never disagree
const INVENTORY_BASELINE_UNITS = 250;
function applyInventoryStatus(item) {
  if (!item) return item;
  const c = Math.max(0, Number(item.count) || 0);
  item.count = c;
  if (c < 40) { item.status = 'Critical Deficit'; item.isRed = true; }
  else if (c < 90) { item.status = 'Low'; item.isRed = true; }
  else if (c < 250) { item.status = 'Moderate'; item.isRed = false; }
  else { item.status = 'Optimal'; item.isRed = false; }
  return item;
}
appState.inventory.forEach(applyInventoryStatus);

// Resolves an id, a legacy alias, or an exact facility name. Never guesses from partial names:
// first-word matching previously routed 7 of 40 facilities to the wrong hospital.
function resolveFacility(ref) {
  if (!ref) return null;
  if (typeof ref === 'object' && ref.id) return getFacilityById(ref.id);
  const byId = getFacilityById(ref);
  if (byId) return byId;
  const wanted = String(ref).trim().toLowerCase();
  return GLOBAL_FACILITIES.find(f => f.name.toLowerCase() === wanted) || null;
}

if (typeof window !== 'undefined') {
  window.BLOOD_GROUPS = BLOOD_GROUPS;
  window.canDonateTo = canDonateTo;
  window.isAllFilter = isAllFilter;
  window.escapeHTML = escapeHTML;
  window.facilityMatchesScope = facilityMatchesScope;
  window.findNearestDonorNode = findNearestDonorNode;
  window.haversineKm = haversineKm;
  window.resolveFacility = resolveFacility;
  window.applyInventoryStatus = applyInventoryStatus;
  window.INVENTORY_BASELINE_UNITS = INVENTORY_BASELINE_UNITS;
  window.GEOGRAPHIC_SCOPES = GEOGRAPHIC_SCOPES;
  window.GLOBAL_FACILITIES = GLOBAL_FACILITIES;
  window.GLOBAL_DONORS = GLOBAL_DONORS;
  window.appState = appState;
  window.realHospitals = realHospitals;
  window.realDonors = realDonors;
  window.getFacilityById = getFacilityById;
  window.getFacilitiesForScope = getFacilitiesForScope;
  window.getDonorsForScope = getDonorsForScope;
  window.searchGlobalDirectory = searchGlobalDirectory;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GEOGRAPHIC_SCOPES,
    GLOBAL_FACILITIES,
    GLOBAL_DONORS,
    appState,
    getFacilityById,
    resolveFacility,
    applyInventoryStatus,
    INVENTORY_BASELINE_UNITS,
    canDonateTo,
    isAllFilter,
    escapeHTML,
    facilityMatchesScope,
    findNearestDonorNode,
    BLOOD_GROUPS,
    getFacilitiesForScope,
    getDonorsForScope,
    searchGlobalDirectory
  };
}
