const STATUS = {
  available: {
    label: 'VERFÜGBAR',
    button: 'Termin buchen',
    bg: '#DFF7E8',
    text: '#126B3A',
    border: '#8ED9AC'
  },
  waitlist: {
    label: 'WARTELISTE',
    button: 'Auf Warteliste setzen',
    bg: '#FFF0C2',
    text: '#7A4B00',
    border: '#F5D36B'
  },
  full: {
    label: 'AUSGEBUCHT',
    button: 'Nicht verfügbar',
    bg: '#F3F4F6',
    text: '#6B7280',
    border: '#D1D5DB'
  }
};

figma.showUI(__html__, { width: 430, height: 720, themeColors: true });

function isHexColor(value) {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

function visualFor(status, tokens) {
  const base = STATUS[status] || STATUS.available;
  const token = tokens && tokens[status] ? tokens[status] : {};
  return {
    label: base.label,
    button: base.button,
    bg: isHexColor(token.bg) ? token.bg.trim() : base.bg,
    text: isHexColor(token.text) ? token.text.trim() : base.text,
    border: isHexColor(token.border) ? token.border.trim() : base.border
  };
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const value = parseInt(clean, 16);
  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255
  };
}

function solid(hex) {
  return [{ type: 'SOLID', color: hexToRgb(hex) }];
}

async function loadFonts() {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
}

function textNode(text, size, bold = false) {
  const node = figma.createText();
  node.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
  node.characters = text;
  node.fontSize = size;
  node.fills = solid('#1F2430');
  return node;
}

function applyBaseCardLayout(frame, status, tokens) {
  const s = visualFor(status, tokens);
  frame.name = `TerminCard / status=${status}`;
  frame.resize(330, 218);
  frame.layoutMode = 'VERTICAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'FIXED';
  frame.itemSpacing = 12;
  frame.paddingTop = 18;
  frame.paddingRight = 18;
  frame.paddingBottom = 18;
  frame.paddingLeft = 18;
  frame.cornerRadius = 18;
  frame.fills = solid('#FFFFFF');
  frame.strokes = solid(s.border);
  frame.strokeWeight = 2;
  frame.setPluginData('component', 'TerminCard');
  frame.setPluginData('status', status);
}

function buildCardChildren(status, tokens) {
  const s = visualFor(status, tokens);

  const badge = figma.createFrame();
  badge.name = 'Badge';
  badge.layoutMode = 'HORIZONTAL';
  badge.primaryAxisSizingMode = 'AUTO';
  badge.counterAxisSizingMode = 'AUTO';
  badge.paddingTop = 7;
  badge.paddingBottom = 7;
  badge.paddingLeft = 11;
  badge.paddingRight = 11;
  badge.cornerRadius = 999;
  badge.fills = solid(s.bg);
  const badgeText = textNode(s.label, 12, true);
  badgeText.name = 'Badge Text';
  badgeText.fills = solid(s.text);
  badge.appendChild(badgeText);

  const title = textNode('Personalausweis beantragen', 22, true);
  title.name = 'Title';
  const office = textNode('Bürgerbüro Mitte', 15, false);
  office.name = 'Office';
  office.fills = solid('#626B7C');
  const date = textNode('24. Mai 2026 · 10:30 Uhr', 15, false);
  date.name = 'Date';
  date.fills = solid('#626B7C');

  const button = figma.createFrame();
  button.name = 'Button';
  button.layoutMode = 'HORIZONTAL';
  button.primaryAxisSizingMode = 'AUTO';
  button.counterAxisSizingMode = 'AUTO';
  button.paddingTop = 10;
  button.paddingBottom = 10;
  button.paddingLeft = 14;
  button.paddingRight = 14;
  button.cornerRadius = 999;
  button.fills = solid(status === 'full' ? '#D8DBE3' : s.text);
  const buttonText = textNode(s.button, 14, true);
  buttonText.name = 'Button Text';
  buttonText.fills = solid(status === 'full' ? s.text : '#FFFFFF');
  button.appendChild(buttonText);

  return [badge, title, office, date, button];
}

async function createCard(status, x, y, tokens) {
  await loadFonts();
  const frame = figma.createFrame();
  frame.x = x;
  frame.y = y;
  applyBaseCardLayout(frame, status, tokens);
  buildCardChildren(status, tokens).forEach(child => frame.appendChild(child));
  figma.currentPage.appendChild(frame);
  return frame;
}

function isTerminCard(node) {
  return node && node.type === 'FRAME' && node.getPluginData('component') === 'TerminCard';
}

async function rebuildCardToStatus(node, status, tokens) {
  if (!isTerminCard(node)) return false;
  await loadFonts();
  while (node.children.length > 0) {
    node.children[0].remove();
  }
  applyBaseCardLayout(node, status, tokens);
  buildCardChildren(status, tokens).forEach(child => node.appendChild(child));
  return true;
}

async function applyTokenPreviewToSelected(status, tokens) {
  const node = figma.currentPage.selection[0];
  if (!isTerminCard(node)) return false;
  const selectedStatus = status || node.getPluginData('status') || 'available';
  await rebuildCardToStatus(node, selectedStatus, tokens);
  return true;
}

function selectedCardPayload() {
  const node = figma.currentPage.selection[0];
  if (!isTerminCard(node)) {
    figma.ui.postMessage({ type: 'selection', connected: false });
    return;
  }
  figma.ui.postMessage({
    type: 'selection',
    connected: true,
    nodeName: node.name,
    status: node.getPluginData('status') || 'available'
  });
}

figma.on('selectionchange', selectedCardPayload);

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-cards') {
    const startX = figma.viewport.center.x - 540;
    const startY = figma.viewport.center.y - 120;
    const cards = [];
    cards.push(await createCard('available', startX, startY, msg.tokens));
    cards.push(await createCard('waitlist', startX + 370, startY, msg.tokens));
    cards.push(await createCard('full', startX + 740, startY, msg.tokens));
    figma.currentPage.selection = [cards[0]];
    figma.viewport.scrollAndZoomIntoView(cards);
    selectedCardPayload();
    figma.notify('Created three TerminCard states.');
  }

  if (msg.type === 'set-status') {
    const node = figma.currentPage.selection[0];
    const ok = await rebuildCardToStatus(node, msg.status, msg.tokens);
    if (!ok) figma.notify('Select a generated TerminCard first.');
    if (ok) figma.notify(`Selected TerminCard set to ${msg.status}.`);
    selectedCardPayload();
  }

  if (msg.type === 'preview-tokens') {
    const ok = await applyTokenPreviewToSelected(msg.status, msg.tokens);
    if (!ok) return;
    selectedCardPayload();
  }
};

selectedCardPayload();
