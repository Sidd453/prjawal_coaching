import { api } from '../api.js';
import { can } from '../session.js';
import { html, mount, $, $$, formData, toast, modal, fmtDate, emptyState } from '../ui.js';

const ROLE_KEYS = ['admin', 'manager', 'accountant', 'teacher', 'receptionist'];
const GROUPS = [
  ['Dashboard', ['dashboard:view', 'dashboard:finance']],
  ['Batches', ['batches:view', 'batches:manage', 'batches:delete']],
  ['Students', ['students:view', 'students:create', 'students:update', 'students:delete', 'students:export']],
  ['Attendance', ['attendance:view', 'attendance:mark']],
  ['Fees', ['fees:view', 'fees:collect', 'fees:receipt', 'fees:dues', 'fees:delete']],
  ['Enquiries', ['enquiries:view', 'enquiries:update', 'enquiries:delete']],
  ['Staff', ['users:view', 'users:manage']],
];

const roleOptions = (roles, selected) => roles.map((r) => html`<option value="${r.key}" ${r.key === selected ? 'selected' : ''}>${r.label}</option>`);

export const render = async (page, { user }) => {
  const manage = can('users:manage');
  const { data: roles } = await api.get('/roles');
  let tab = 'people';

  const people = async () => {
    const { data } = await api.get('/users');
    mount($('#pane', page), html`<div class="table-wrap"><table><thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Added</th><th></th></tr></thead><tbody>
      ${data.map((u) => html`<tr><td><b>${u.name}</b><span class="sub">${u.email}</span></td>
        <td><span class="role-chip r-${u.role}">${roles.find((r) => r.key === u.role)?.label || u.role}</span></td>
        <td><span class="badge ${u.active ? 'green' : 'red'}">${u.active ? 'Active' : 'Disabled'}</span></td><td>${fmtDate(u.createdAt)}</td>
        <td><div class="actions">${u._id === user.id ? html`<span class="muted">You</span>` : manage ? html`
          <button class="btn sm" data-edit="${u._id}">Change role</button><button class="btn sm" data-reset="${u._id}">Reset password</button>
          <button class="btn sm ${u.active ? 'danger' : ''}" data-toggle="${u._id}">${u.active ? 'Disable' : 'Enable'}</button>` : ''}</div></td></tr>`)}</tbody></table></div>`);
    page.onclick = async (e) => {
      const t = (a) => e.target.closest(`[data-${a}]`);
      try {
        if (t('toggle')) { await api.patch(`/users/${t('toggle').dataset.toggle}/toggle`); people(); }
        if (t('edit')) editRole(data.find((u) => u._id === t('edit').dataset.edit));
        if (t('reset')) resetPw(data.find((u) => u._id === t('reset').dataset.reset));
        if (t('tab')) switchTab(t('tab').dataset.tab);
      } catch (err) { toast(err.message, 'err'); }
    };
  };

  const matrix = () => {
    mount($('#pane', page), html`<div class="role-cards">${roles.map((r) => html`<div class="card"><span class="role-chip r-${r.key}">${r.label}</span><p class="muted" style="margin-top:8px">${r.description}</p></div>`)}</div>
      <div class="table-wrap" style="margin-top:16px"><table class="matrix"><thead><tr><th>Permission</th>${roles.map((r) => html`<th class="c">${r.label}</th>`)}</tr></thead><tbody>
      ${GROUPS.map(([group, perms]) => html`<tr class="grp"><td colspan="${roles.length + 1}">${group}</td></tr>
        ${perms.map((p) => html`<tr><td>${p.split(':')[1].replace('_', ' ')}</td>${roles.map((r) => html`<td class="c">${r.permissions.includes(p) ? html`<span class="yes" aria-label="Allowed">&#10003;</span>` : html`<span class="no" aria-label="Not allowed">&ndash;</span>`}</td>`)}</tr>`)}`)}
      </tbody></table></div>`);
    page.onclick = null;
  };

  const switchTab = (t) => {
    tab = t;
    $$('.tabs button', page).forEach((b) => b.classList.toggle('active', b.dataset.tab === t));
    (t === 'people' ? people : matrix)().catch((err) => toast(err.message, 'err'));
    if (t === 'people') return;
  };

  const addModal = () => modal({
    title: 'Add staff member',
    body: html`<form class="grid" style="gap:14px"><div class="form-grid">
      <div class="field"><label>Name</label><input name="name" required></div><div class="field"><label>Email</label><input name="email" type="email" required></div>
      <div class="field"><label>Temporary password</label><input name="password" type="password" minlength="8" required><small>Share it privately. They can change it after login.</small></div>
      <div class="field"><label>Role</label><select name="role">${roleOptions(roles, 'receptionist')}</select></div></div>
      <p class="err-text" role="alert"></p><div class="modal-foot"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Create account</button></div></form>`,
    onMount: (el, close) => $('form', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await api.post('/users', formData(e.target)); toast('Account created.'); close(); switchTab('people'); } catch (err) { $('.err-text', el).textContent = err.message; }
    }),
  });

  const editRole = (u) => modal({
    title: `Change role: ${u.name}`,
    body: html`<form class="grid" style="gap:14px"><div class="field"><label>Role</label><select name="role">${roleOptions(roles, u.role)}</select>
      <small>Takes effect immediately, even if they are logged in.</small></div>
      <p class="err-text" role="alert"></p><div class="modal-foot"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save role</button></div></form>`,
    onMount: (el, close) => $('form', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await api.patch(`/users/${u._id}`, formData(e.target)); toast('Role updated.'); close(); people(); } catch (err) { $('.err-text', el).textContent = err.message; }
    }),
  });

  const resetPw = (u) => modal({
    title: `Reset password: ${u.name}`,
    body: html`<form class="grid" style="gap:14px"><div class="field"><label>New password</label><input name="password" type="password" minlength="8" required></div>
      <p class="err-text" role="alert"></p><div class="modal-foot"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Reset password</button></div></form>`,
    onMount: (el, close) => $('form', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await api.post(`/users/${u._id}/reset-password`, formData(e.target)); toast('Password reset.'); close(); } catch (err) { $('.err-text', el).textContent = err.message; }
    }),
  });

  mount(page, html`<div class="page-head"><div><h1>Staff &amp; roles</h1><p>Each role sees and does only what it needs.</p></div>
    ${manage ? html`<button class="btn primary" id="add">Add staff</button>` : ''}</div>
    <div class="tabs"><button class="active" data-tab="people">People</button><button data-tab="roles">Roles &amp; access</button></div><div id="pane"></div>`);
  $('#add', page)?.addEventListener('click', addModal);
  page.querySelector('.tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) switchTab(b.dataset.tab); });
  await people();
};
