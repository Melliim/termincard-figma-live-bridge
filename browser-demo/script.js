const statusConfig = {
  available: { badge: 'VERFÜGBAR', button: 'Termin buchen' },
  waitlist: { badge: 'WARTELISTE', button: 'Auf Warteliste setzen' },
  full: { badge: 'AUSGEBUCHT', button: 'Nicht verfügbar' }
};

const card = document.querySelector('#terminCard');
const badge = document.querySelector('#badge');
const actionButton = document.querySelector('#actionButton');
const htmlSnippet = document.querySelector('#htmlSnippet');
const cssSnippet = document.querySelector('#cssSnippet');
const controls = document.querySelectorAll('[data-set-status]');
const reloadButton = document.querySelector('#reloadTokens');
const syncState = document.querySelector('#syncState');

let currentStatus = 'available';
let lastGeneratedAt = null;

function setStatus(status) {
  const config = statusConfig[status];
  currentStatus = status;
  card.dataset.status = status;
  badge.textContent = config.badge;
  actionButton.textContent = config.button;
  actionButton.disabled = status === 'full';
  controls.forEach(btn => btn.classList.toggle('active', btn.dataset.setStatus === status));
  renderSnippets(status);
}

function renderSnippets(status) {
  htmlSnippet.textContent = `<article class="termin-card" data-status="${status}">\n  <span class="badge">${statusConfig[status].badge}</span>\n  <h3>Personalausweis beantragen</h3>\n  <button>${statusConfig[status].button}</button>\n</article>`;
  cssSnippet.textContent = `/* Live values come from bridge-server /tokens */\n[data-status="${status}"] .badge {\n  background: var(--status-${status}-bg);\n  color: var(--status-${status}-text);\n}\n\nCurrent CSS variable:\n--status-${status}-bg = ${getComputedStyle(document.documentElement).getPropertyValue(`--status-${status}-bg`).trim()}`;
}

function applyPayload(payload) {
  const root = document.documentElement;
  const t = payload.tokens;
  root.style.setProperty('--status-available-bg', t.available.bg);
  root.style.setProperty('--status-available-text', t.available.text);
  root.style.setProperty('--status-available-border', t.available.border);
  root.style.setProperty('--status-waitlist-bg', t.waitlist.bg);
  root.style.setProperty('--status-waitlist-text', t.waitlist.text);
  root.style.setProperty('--status-waitlist-border', t.waitlist.border);
  root.style.setProperty('--status-full-bg', t.full.bg);
  root.style.setProperty('--status-full-text', t.full.text);
  root.style.setProperty('--status-full-border', t.full.border);
  root.style.setProperty('--card-radius', `${payload.layout.radius}px`);
  root.style.setProperty('--card-padding', `${payload.layout.padding}px`);
  root.style.setProperty('--card-gap', `${payload.layout.gap}px`);
  lastGeneratedAt = payload.generatedAt;
  if (payload.activeStatus && statusConfig[payload.activeStatus]) setStatus(payload.activeStatus);
  renderSnippets(currentStatus);
  syncState.textContent = `Connected. Last sync: ${new Date(payload.generatedAt).toLocaleTimeString()}`;
}

async function loadSyncedTokens() {
  try {
    const res = await fetch('http://localhost:3001/tokens?ts=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('Bridge server returned ' + res.status);
    const json = await res.json();
    if (!json.ok || !json.payload) throw new Error('Invalid bridge response');
    if (json.payload.generatedAt !== lastGeneratedAt) applyPayload(json.payload);
    else syncState.textContent = `Connected. No new sync yet. Last sync: ${new Date(lastGeneratedAt).toLocaleTimeString()}`;
  } catch (error) {
    syncState.textContent = 'Not connected to bridge server. Run npm start and keep the terminal open.';
  }
}

controls.forEach(button => button.addEventListener('click', () => setStatus(button.dataset.setStatus)));
reloadButton.addEventListener('click', loadSyncedTokens);

setStatus('available');
loadSyncedTokens();
setInterval(loadSyncedTokens, 1500);
