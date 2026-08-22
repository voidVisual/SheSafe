/**
 * SheSafe Frontend API Client & State Management
 * Dynamically resolves backend endpoints, handles JWT auth, and provides
 * graceful offline demo fallbacks when the Express server is starting or offline.
 */

// Dynamically determine the backend API base URL
function resolveApiBase() {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  
  // If served directly via file:// protocol or Live Server (e.g. port 5500, 3000, 8080)
  if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000')) {
    return 'http://localhost:5000';
  }
  // Same-origin if served by Express on port 5000
  return '';
}

const API_BASE = resolveApiBase();

// Storage helper for session tokens, active user, and offline mock persistence
const TokenStorage = {
  getToken: () => localStorage.getItem('shesafe_token'),
  setToken: (token) => localStorage.setItem('shesafe_token', token),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('shesafe_user'));
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('shesafe_user', JSON.stringify(user)),
  isOfflineMode: () => localStorage.getItem('shesafe_offline_mode') === 'true',
  setOfflineMode: (val) => localStorage.setItem('shesafe_offline_mode', val ? 'true' : 'false'),
  clear: () => {
    localStorage.removeItem('shesafe_token');
    localStorage.removeItem('shesafe_user');
    localStorage.removeItem('shesafe_offline_mode');
  }
};

// Default Demo User Data for Offline / Quick Start
const DEMO_USER = {
  id: 1,
  name: 'Ushashi Mandal',
  phone: '+91 9876543210',
  email: 'ushashi@shesafe.app',
  emergencyMessage: 'EMERGENCY! I need immediate help. Here is my live location: ',
  emergencyContactsCount: 3,
  hasActiveSOS: false
};

const DEFAULT_OFFLINE_CONTACTS = [
  { id: 1, name: 'Mom', phone: '+91 9775800554', relationship: 'Mother', is_primary: 1 },
  { id: 2, name: 'Dad', phone: '+91 9475265165', relationship: 'Father', is_primary: 0 },
  { id: 3, name: 'Brother', phone: '+91 9748748772', relationship: 'Brother', is_primary: 0 }
];

const DEFAULT_HELPLINES = [
  { name: 'National Emergency', number: '112', description: 'Universal Emergency Police & Ambulance' },
  { name: 'Women Helpline', number: '1091', description: '24x7 Women Distress & Safety Helpline' },
  { name: 'Women Domestic Abuse', number: '181', description: 'NCW National Women Support Line' },
  { name: 'Cyber Crime Helpline', number: '1930', description: 'Online Harassment & Cyber Abuse' }
];

/**
 * Built-in Rule Engine for AI Safety advice when offline or API is starting
 */
function getLocalSafetyAdvice(situation) {
  const text = (situation || '').toLowerCase();

  if (text.includes('follow') || text.includes('behind') || text.includes('stalk')) {
    return `🚨 **Immediate Safety Steps for Being Followed:**\n` +
      `1. **Do NOT head home or into isolated areas.** Head directly toward a well-lit, crowded place (store, cafe, metro station, or fuel station).\n` +
      `2. **Stay on the phone:** Call an emergency contact or speak loudly to make it known someone is tracking you.\n` +
      `3. **Trigger SheSafe SOS:** Tap the SOS button immediately so your trusted contacts receive your live GPS coordinates.\n` +
      `4. **If danger is imminent, dial 112 or 1091 (Women Helpline) immediately.**`;
  }

  if (text.includes('cab') || text.includes('taxi') || text.includes('auto') || text.includes('driver')) {
    return `🚕 **Cab / Ride Safety Steps:**\n` +
      `1. **Share Live Trip:** Open the Live Location tab in SheSafe and share your live route.\n` +
      `2. **Call a Family Member / Friend:** Loudly mention the vehicle license number and that you are on your way.\n` +
      `3. **If route deviates:** Firmly tell the driver to stop at a populated place. If they refuse, open the window, shout for attention, and trigger SOS or dial 112.`;
  }

  if (text.includes('dark') || text.includes('alone') || text.includes('scared') || text.includes('night')) {
    return `🌙 **Night / Isolated Area Safety Advice:**\n` +
      `1. **Keep moving toward illuminated roads:** Avoid shortcuts, parks, or unlit alleys.\n` +
      `2. **Keep hands free:** Keep your phone ready in your hand with emergency speed-dial ready.\n` +
      `3. **Stay alert:** Remove earphones/headphones to stay aware of your surroundings.\n` +
      `4. **Activate Live Location:** Let your emergency contacts track your position until you are safely indoors.`;
  }

  if (text.includes('harass') || text.includes('touch') || text.includes('threat') || text.includes('abuse')) {
    return `⚠️ **Harassment / Threat Response:**\n` +
      `1. **Make Noise / Draw Attention:** Loudly tell the person to back off in a firm, clear voice so bystanders notice.\n` +
      `2. **Move to a public space:** Approach a shopkeeper, security guard, or groups of families.\n` +
      `3. **Document & Report:** Note descriptions and call Women Powerline 1090 or National Emergency 112.\n` +
      `4. **Trigger SOS:** Tap the SOS button in SheSafe immediately.`;
  }

  return `🛡️ **Safety Guidance:**\n` +
    `1. **Trust your instincts:** If something feels wrong, remove yourself from the situation immediately.\n` +
    `2. **Stay in populated, well-lit spaces** and avoid isolated routes.\n` +
    `3. **Keep emergency contacts informed:** Share your live location via SheSafe.\n` +
    `4. **In any emergency:** Tap the red SOS button or dial 112 / 1091 for instant police assistance.`;
}

/**
 * Base fetch wrapper with auth header injection and connection diagnostics
 */
async function request(endpoint, options = {}) {
  const token = TokenStorage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const url = `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({ success: false, message: 'Invalid server response' }));

    if (res.status === 401 && !endpoint.includes('/api/auth/login') && !endpoint.includes('/api/auth/signup')) {
      TokenStorage.clear();
      const currentPath = window.location.pathname;
      if (!currentPath.includes('index.html') && !currentPath.includes('signup.html') && !currentPath.includes('login.html')) {
        window.location.href = 'login.html';
      }
    }

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err) {
    // Detect network / connection failures
    const isNetworkErr =
      err.name === 'TypeError' ||
      err.message.includes('Failed to fetch') ||
      err.message.includes('NetworkError') ||
      err.message.includes('Network request failed');

    if (isNetworkErr) {
      const helpfulErr = new Error(
        `Backend server unreachable at ${API_BASE || 'http://localhost:5000'}. Please start the server using 'npm start' or use Demo Mode.`
      );
      helpfulErr.isNetworkError = true;
      console.warn(`[SheSafe Network Diagnostic] Connection to ${url} failed. Server might be offline.`);
      throw helpfulErr;
    }

    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

// Auth API
const authAPI = {
  checkServerHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        return { online: true, data, url: API_BASE || 'http://localhost:5000' };
      }
      return { online: false, url: API_BASE || 'http://localhost:5000' };
    } catch {
      return { online: false, url: API_BASE || 'http://localhost:5000' };
    }
  },

  signup: async (fullName, phone, email, password, confirmPassword) => {
    try {
      const data = await request('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ fullName, phone, email, password, confirmPassword })
      });
      if (data.token) {
        TokenStorage.setToken(data.token);
        TokenStorage.setUser(data.user);
        TokenStorage.setOfflineMode(false);
      }
      return data;
    } catch (err) {
      if (err.isNetworkError) {
        // Offline demo signup fallback
        const offlineUser = {
          id: Date.now(),
          name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          emergencyMessage: 'EMERGENCY! I need immediate help. Here is my live location: ',
          emergencyContactsCount: 3,
          hasActiveSOS: false
        };
        const offlineToken = 'offline_demo_token_' + Date.now();
        TokenStorage.setToken(offlineToken);
        TokenStorage.setUser(offlineUser);
        TokenStorage.setOfflineMode(true);
        return {
          success: true,
          offline: true,
          message: 'Signed up in Offline Demo Mode (Server is offline)',
          token: offlineToken,
          user: offlineUser
        };
      }
      throw err;
    }
  },

  login: async (emailOrPhone, password) => {
    try {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrPhone, password })
      });
      if (data.token) {
        TokenStorage.setToken(data.token);
        TokenStorage.setUser(data.user);
        TokenStorage.setOfflineMode(false);
      }
      return data;
    } catch (err) {
      if (err.isNetworkError) {
        // Check for Demo Login or saved local user
        const cleanInput = (emailOrPhone || '').trim().toLowerCase();
        const savedUser = TokenStorage.getUser();
        
        if (cleanInput === 'ushashi@shesafe.app' || cleanInput === 'ushashi' || (savedUser && savedUser.email === cleanInput)) {
          const userObj = savedUser || DEMO_USER;
          const offlineToken = 'offline_demo_token_' + Date.now();
          TokenStorage.setToken(offlineToken);
          TokenStorage.setUser(userObj);
          TokenStorage.setOfflineMode(true);
          return {
            success: true,
            offline: true,
            message: 'Logged in via Offline Demo Mode',
            token: offlineToken,
            user: userObj
          };
        }
        throw new Error(
          "Backend server (http://localhost:5000) is offline. Start the backend with 'npm start', or use 'Quick Demo Login' to test offline."
        );
      }
      throw err;
    }
  },

  getProfile: async () => {
    if (TokenStorage.isOfflineMode()) {
      const user = TokenStorage.getUser() || DEMO_USER;
      return { success: true, user, offline: true };
    }
    try {
      return await request('/api/auth/me');
    } catch (err) {
      if (err.isNetworkError) {
        const user = TokenStorage.getUser() || DEMO_USER;
        return { success: true, user, offline: true };
      }
      throw err;
    }
  },

  updateProfile: async (profileData) => {
    if (TokenStorage.isOfflineMode()) {
      const current = TokenStorage.getUser() || DEMO_USER;
      const updated = { ...current, ...profileData };
      TokenStorage.setUser(updated);
      return { success: true, user: updated, offline: true };
    }
    try {
      return await request('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
    } catch (err) {
      if (err.isNetworkError) {
        const current = TokenStorage.getUser() || DEMO_USER;
        const updated = { ...current, ...profileData };
        TokenStorage.setUser(updated);
        return { success: true, user: updated, offline: true };
      }
      throw err;
    }
  },

  logout: () => {
    TokenStorage.clear();
    window.location.href = 'login.html';
  }
};

// Contacts API
const contactsAPI = {
  getAll: async () => {
    if (TokenStorage.isOfflineMode()) {
      const local = JSON.parse(localStorage.getItem('shesafe_offline_contacts')) || DEFAULT_OFFLINE_CONTACTS;
      return { success: true, contacts: local, offline: true };
    }
    try {
      return await request('/api/contacts');
    } catch (err) {
      if (err.isNetworkError) {
        const local = JSON.parse(localStorage.getItem('shesafe_offline_contacts')) || DEFAULT_OFFLINE_CONTACTS;
        return { success: true, contacts: local, offline: true };
      }
      throw err;
    }
  },

  add: async (name, phone, relationship = 'Contact', email = '') => {
    if (TokenStorage.isOfflineMode()) {
      const list = JSON.parse(localStorage.getItem('shesafe_offline_contacts')) || [...DEFAULT_OFFLINE_CONTACTS];
      const newContact = { id: Date.now(), name, phone, relationship, email, is_primary: 0 };
      list.push(newContact);
      localStorage.setItem('shesafe_offline_contacts', JSON.stringify(list));
      return { success: true, contact: newContact, offline: true };
    }
    try {
      return await request('/api/contacts', {
        method: 'POST',
        body: JSON.stringify({ name, phone, relationship, email })
      });
    } catch (err) {
      if (err.isNetworkError) {
        const list = JSON.parse(localStorage.getItem('shesafe_offline_contacts')) || [...DEFAULT_OFFLINE_CONTACTS];
        const newContact = { id: Date.now(), name, phone, relationship, email, is_primary: 0 };
        list.push(newContact);
        localStorage.setItem('shesafe_offline_contacts', JSON.stringify(list));
        return { success: true, contact: newContact, offline: true };
      }
      throw err;
    }
  },

  update: async (id, contactData) => {
    if (TokenStorage.isOfflineMode()) {
      let list = JSON.parse(localStorage.getItem('shesafe_offline_contacts')) || DEFAULT_OFFLINE_CONTACTS;
      list = list.map(c => c.id === id ? { ...c, ...contactData } : c);
      localStorage.setItem('shesafe_offline_contacts', JSON.stringify(list));
      return { success: true, offline: true };
    }
    return await request(`/api/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contactData)
    });
  },

  delete: async (id) => {
    if (TokenStorage.isOfflineMode()) {
      let list = JSON.parse(localStorage.getItem('shesafe_offline_contacts')) || DEFAULT_OFFLINE_CONTACTS;
      list = list.filter(c => c.id !== id);
      localStorage.setItem('shesafe_offline_contacts', JSON.stringify(list));
      return { success: true, offline: true };
    }
    return await request(`/api/contacts/${id}`, {
      method: 'DELETE'
    });
  }
};

// SOS API
const sosAPI = {
  trigger: async (latitude, longitude, address, batteryLevel) => {
    if (TokenStorage.isOfflineMode()) {
      const sosData = {
        id: Date.now(),
        latitude,
        longitude,
        address,
        batteryLevel,
        dispatchedContacts: DEFAULT_OFFLINE_CONTACTS
      };
      sessionStorage.setItem('shesafe_active_sos', JSON.stringify(sosData));
      return { success: true, sos: sosData, offline: true };
    }
    try {
      return await request('/api/sos/trigger', {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude, address, batteryLevel })
      });
    } catch (err) {
      if (err.isNetworkError) {
        const sosData = {
          id: Date.now(),
          latitude,
          longitude,
          address,
          batteryLevel,
          dispatchedContacts: DEFAULT_OFFLINE_CONTACTS
        };
        sessionStorage.setItem('shesafe_active_sos', JSON.stringify(sosData));
        return { success: true, sos: sosData, offline: true };
      }
      throw err;
    }
  },

  getStatus: async () => {
    if (TokenStorage.isOfflineMode()) {
      const hasSos = !!sessionStorage.getItem('shesafe_active_sos');
      return { success: true, active: hasSos, offline: true };
    }
    try {
      return await request('/api/sos/status');
    } catch (err) {
      return { success: true, active: false, offline: true };
    }
  },

  resolve: async (sosId) => {
    if (TokenStorage.isOfflineMode()) {
      sessionStorage.removeItem('shesafe_active_sos');
      return { success: true, message: 'SOS alert resolved locally.', offline: true };
    }
    try {
      return await request('/api/sos/resolve', {
        method: 'POST',
        body: JSON.stringify({ sosId })
      });
    } catch (err) {
      sessionStorage.removeItem('shesafe_active_sos');
      return { success: true, message: 'SOS alert resolved.', offline: true };
    }
  },

  getHistory: async () => {
    if (TokenStorage.isOfflineMode()) {
      return { success: true, alerts: [], offline: true };
    }
    return await request('/api/sos/history');
  }
};

// Location API
const locationAPI = {
  update: async (latitude, longitude, accuracy, speed, address, status) => {
    if (TokenStorage.isOfflineMode()) {
      localStorage.setItem('shesafe_last_location', JSON.stringify({ latitude, longitude, accuracy, speed, address, status, time: Date.now() }));
      return { success: true, offline: true };
    }
    try {
      return await request('/api/location/update', {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude, accuracy, speed, address, status })
      });
    } catch (err) {
      localStorage.setItem('shesafe_last_location', JSON.stringify({ latitude, longitude, accuracy, speed, address, status, time: Date.now() }));
      return { success: true, offline: true };
    }
  },

  getCurrent: async () => {
    if (TokenStorage.isOfflineMode()) {
      const loc = JSON.parse(localStorage.getItem('shesafe_last_location'));
      return { success: true, location: loc, offline: true };
    }
    return await request('/api/location/current');
  },

  getHistory: async () => {
    if (TokenStorage.isOfflineMode()) {
      return { success: true, history: [], offline: true };
    }
    return await request('/api/location/history');
  }
};

// Police & Helplines API
const policeAPI = {
  getHelplines: async () => {
    if (TokenStorage.isOfflineMode()) {
      return { success: true, helplines: DEFAULT_HELPLINES, offline: true };
    }
    try {
      return await request('/api/police/helplines');
    } catch (err) {
      return { success: true, helplines: DEFAULT_HELPLINES, offline: true };
    }
  },

  getNearby: async (lat, lon) => {
    return await request(`/api/police/nearby?lat=${lat}&lon=${lon}`);
  }
};

// AI Safety Assistant API
const aiAPI = {
  getAdvice: async (situation, location) => {
    if (TokenStorage.isOfflineMode()) {
      const advice = getLocalSafetyAdvice(situation);
      return { success: true, advice, source: 'shesafe-local-engine', offline: true };
    }
    try {
      return await request('/api/ai/advise', {
        method: 'POST',
        body: JSON.stringify({ situation, location })
      });
    } catch (err) {
      const fallbackAdvice = getLocalSafetyAdvice(situation);
      return { success: true, advice: fallbackAdvice, source: 'shesafe-fallback-engine', offline: true };
    }
  }
};

// Settings API
const settingsAPI = {
  get: async () => {
    const defaultSettings = { notifications: true, soundAlarm: true, autoShareLocation: true, language: 'en' };
    if (TokenStorage.isOfflineMode()) {
      const saved = JSON.parse(localStorage.getItem('shesafe_settings')) || defaultSettings;
      return { success: true, settings: saved, offline: true };
    }
    try {
      return await request('/api/settings');
    } catch (err) {
      const saved = JSON.parse(localStorage.getItem('shesafe_settings')) || defaultSettings;
      return { success: true, settings: saved, offline: true };
    }
  },

  update: async (settingsData) => {
    const saved = JSON.parse(localStorage.getItem('shesafe_settings')) || {};
    const updated = { ...saved, ...settingsData };
    localStorage.setItem('shesafe_settings', JSON.stringify(updated));

    if (TokenStorage.isOfflineMode()) {
      return { success: true, settings: updated, offline: true };
    }
    try {
      return await request('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsData)
      });
    } catch (err) {
      return { success: true, settings: updated, offline: true };
    }
  }
};

// UI Notification / Toast Helper
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('shesafe-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'shesafe-toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 90%;
      max-width: 400px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColors = {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#6A5AE0'
  };

  toast.style.cssText = `
    background: ${bgColors[type] || bgColors.info};
    color: white;
    padding: 12px 18px;
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    font-size: 13.5px;
    font-weight: 500;
    line-height: 1.4;
    text-align: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: translateY(-10px);
    pointer-events: auto;
  `;
  toast.innerText = message;
  toastContainer.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Remove after 4s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Global exports for browser
window.TokenStorage = TokenStorage;
window.authAPI = authAPI;
window.contactsAPI = contactsAPI;
window.sosAPI = sosAPI;
window.locationAPI = locationAPI;
window.policeAPI = policeAPI;
window.aiAPI = aiAPI;
window.settingsAPI = settingsAPI;
window.showToast = showToast;
window.API_BASE = API_BASE;
