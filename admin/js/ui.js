// Tiny templating helpers: every interpolated value is HTML-escaped unless wrapped with raw().
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

class Raw { constructor(v) { this.v = v; } toString() { return this.v; } }
export const raw = (v) => new Raw(v);
const part = (v) => (Array.isArray(v) ? v.map(part).join('') : v instanceof Raw ? v.v : esc(v));
export const html = (strings, ...vals) => raw(strings.reduce((out, s, i) => out + s + (i < vals.length ? part(vals[i]) : ''), ''));

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const mount = (el, tpl) => { el.innerHTML = tpl.v; return el; };

export const inr = (n) => '\u20B9' + Number(n || 0).toLocaleString('en-IN');
export const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
export const fmtDate = (s) => (s ? new Date(s + (s.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
export const monthLabel = (m) => new Date(m + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
export const formData = (form) => Object.fromEntries(new FormData(form).entries());
export const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

export const toast = (message, type = 'ok') => {
  const el = Object.assign(document.createElement('div'), { className: `toast ${type}`, textContent: message });
  document.getElementById('toasts').append(el);
  setTimeout(() => el.remove(), 3800);
};

export const modal = ({ title, body, wide = false, onMount }) => {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-head"><h2>${esc(title)}</h2><button type="button" aria-label="Close" data-close>&times;</button></div>
    <div class="modal-body">${body.v}</div></div>`;
  const close = () => overlay.remove();
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
  overlay.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  document.body.append(overlay);
  onMount?.(overlay.querySelector('.modal-body'), close);
  return close;
};

export const confirmBox = (message) => window.confirm(message);

export const downloadCSV = (name, rows) => {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' })), download: name,
  });
  a.click();
  URL.revokeObjectURL(a.href);
};

export const emptyState = (title, hint) => html`<div class="empty"><b>${title}</b>${hint}</div>`;
export const pager = (p) => html`<div class="pager"><span>Page ${p.page} of ${p.pages} (${p.total} total)</span>
  <span class="actions"><button class="btn sm" data-page="${p.page - 1}" ${p.page <= 1 ? 'disabled' : ''}>Previous</button>
  <button class="btn sm" data-page="${p.page + 1}" ${p.page >= p.pages ? 'disabled' : ''}>Next</button></span></div>`;

export const meter = (pct) => {
  const p = Math.max(0, Math.min(100, pct));
  return html`<div class="meter ${p < 60 ? 'low' : p < 80 ? 'mid' : ''}"><i style="width:${p}%"></i></div>`;
};

const ICONS = {
  home: 'M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z',
  users: 'M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21a8 8 0 0116 0',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  check: 'M9 12l2 2 4-5M4 4h16v16H4z',
  rupee: 'M7 5h10M7 9h10M7 13h4a4 4 0 000-8M9 13l7 7',
  inbox: 'M4 13l2-8h12l2 8v6H4zM4 13h5a3 3 0 006 0h5',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
};
export const icon = (n) => raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`);
