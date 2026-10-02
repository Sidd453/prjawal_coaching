import { api } from '../api.js';
import { html, mount, $, $$, formData, toast, modal, inr, fmtDate, today, debounce, confirmBox, emptyState, pager, meter, downloadCSV } from '../ui.js';
import { collectFeeModal, receiptModal } from './feeModals.js';
import { can } from '../session.js';

const studentForm = (s, batches) => html`<form class="grid" style="gap:14px">
  <div class="form-grid">
    <div class="field"><label>Student name</label><input name="name" value="${s.name || ''}" required></div>
    <div class="field"><label>Parent name</label><input name="parentName" value="${s.parentName || ''}"></div>
    <div class="field"><label>Phone</label><input name="phone" type="tel" value="${s.phone || ''}" required></div>
    <div class="field"><label>Email</label><input name="email" type="email" value="${s.email || ''}"></div>
    <div class="field"><label>School</label><input name="school" value="${s.school || ''}"></div>
    <div class="field"><label>Batch</label><select name="batch" required><option value="">Select batch</option>
      ${batches.map((b) => html`<option value="${b._id}" data-fee="${b.fee}" ${String(s.batch?._id || s.batch) === b._id ? 'selected' : ''}>${b.name}</option>`)}</select></div>
    <div class="field"><label>Admission date</label><input name="admissionDate" type="date" value="${s.admissionDate || today()}" required></div>
    <div class="field"><label>Status</label><select name="status"><option value="active" ${s.status !== 'inactive' ? 'selected' : ''}>Active</option><option value="inactive" ${s.status === 'inactive' ? 'selected' : ''}>Inactive</option></select></div>
    <div class="field"><label>Total fee (&#8377;)</label><input name="totalFee" type="number" min="0" value="${s.totalFee ?? ''}" required></div>
    <div class="field"><label>Discount (&#8377;)</label><input name="discount" type="number" min="0" value="${s.discount ?? 0}"></div>
    <div class="field full"><label>Address</label><input name="address" value="${s.address || ''}"></div>
  </div>
  <p class="err-text" role="alert"></p>
  <div class="modal-foot"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save student</button></div>
</form>`;

const openForm = async (student, reload) => {
  const { data: batches } = await api.get('/batches', { active: 'true' });
  modal({
    title: student ? 'Edit student' : 'Add student', wide: true, body: studentForm(student || {}, batches),
    onMount: (el, close) => {
      const form = $('form', el);
      form.batch.addEventListener('change', () => {
        const fee = form.batch.selectedOptions[0]?.dataset.fee;
        if (fee && !student) form.totalFee.value = fee;
      });
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const body = formData(form);
          student ? await api.put(`/students/${student._id}`, body) : await api.post('/students', body);
          toast('Student saved.'); close(); reload();
        } catch (err) { $('.err-text', el).textContent = err.message; }
      });
    },
  });
};

const openProfile = async (id, reload) => {
  const { data: s } = await api.get(`/students/${id}`);
  const pct = s.attendance.percentage;
  const money = can('fees:view');
  modal({
    title: s.name, wide: true,
    body: html`<div class="grid g4" style="margin-bottom:16px">
        ${money ? html`<div class="card stat"><span>Total fee</span><b class="num">${inr(s.payable)}</b></div>
        <div class="card stat ok"><span>Paid</span><b class="num">${inr(s.paid)}</b></div>
        <div class="card stat due"><span>Pending</span><b class="num">${inr(s.due)}</b></div>` : ''}
        <div class="card stat"><span>Attendance</span><b class="num">${pct == null ? '-' : pct + '%'}</b></div></div>
      <div class="list" style="margin-bottom:16px">
        <div><span class="muted">Roll no</span><span>${s.rollNo}</span></div>
        <div><span class="muted">Batch</span><span>${s.batch?.name || '-'}</span></div>
        <div><span class="muted">Parent / phone</span><span>${s.parentName || '-'} &middot; ${s.phone}</span></div>
        <div><span class="muted">Admitted</span><span>${fmtDate(s.admissionDate)}</span></div>
        <div><span class="muted">Days</span><span>${s.attendance.present} present, ${s.attendance.late} late, ${s.attendance.absent} absent, ${s.attendance.leave} leave</span></div></div>
      ${money ? html`<h3 style="margin-bottom:8px">Payments</h3>
      ${s.payments.length ? html`<div class="table-wrap"><table><thead><tr><th>Receipt</th><th>Date</th><th>Mode</th><th class="right">Amount</th><th></th></tr></thead><tbody>
        ${s.payments.map((p) => html`<tr><td>${p.receiptNo}</td><td>${fmtDate(p.paidOn)}</td><td>${p.mode.toUpperCase()}</td><td class="right num">${inr(p.amount)}</td>
          <td class="right">${can('fees:receipt') ? html`<button class="btn sm" data-receipt="${p._id}">Receipt</button>` : ''}</td></tr>`)}</tbody></table></div>`
        : emptyState('No payments yet', 'Collect the first instalment.')}` : ''}
      <div class="modal-foot"><button class="btn" data-close>Close</button>${money && can('fees:collect') && s.due > 0 ? html`<button class="btn primary" id="collect">Collect fee</button>` : ''}</div>`,
    onMount: (el, close) => {
      el.addEventListener('click', (e) => { const r = e.target.closest('[data-receipt]'); if (r) receiptModal(r.dataset.receipt); });
      $('#collect', el)?.addEventListener('click', () => { close(); collectFeeModal({ student: s, onDone: reload }); });
    },
  });
};

export const render = async (page) => {
  const { data: batches } = await api.get('/batches');
  const state = { q: '', batch: '', status: 'active', page: 1 };
  mount(page, html`<div class="page-head"><div><h1>Students</h1><p>Admissions, fees and contact details.</p></div>
    <div class="actions">${can('students:export') ? html`<button class="btn" id="export">Export CSV</button>` : ''}${can('students:create') ? html`<button class="btn primary" id="add">Add student</button>` : ''}</div></div>
    <div class="toolbar"><input class="grow" id="q" type="search" placeholder="Search name, roll no or phone">
      <select id="batch"><option value="">All batches</option>${batches.map((b) => html`<option value="${b._id}">${b.name}</option>`)}</select>
      <select id="status"><option value="active">Active</option><option value="inactive">Inactive</option><option value="">All</option></select></div>
    <div id="table"></div>`);

  let rows = [];
  const load = async () => {
    const res = await api.get('/students', { ...state, limit: 20 });
    rows = res.data;
    mount($('#table', page), rows.length ? html`<div class="table-wrap"><table><thead><tr><th>Student</th><th>Batch</th><th>Phone</th>${can('fees:view') ? html`<th>Fees</th>` : ''}<th></th></tr></thead><tbody>
      ${rows.map((s) => html`<tr><td><b>${s.name}</b><span class="sub">${s.rollNo}${s.status === 'inactive' ? ' - inactive' : ''}</span></td>
        <td>${s.batch?.name || '-'}</td><td>${s.phone}</td>
        ${can('fees:view') ? html`<td><span class="num">${inr(s.paid)} of ${inr(s.payable)}</span>${s.due > 0 ? html`<span class="badge red" style="margin-left:8px">${inr(s.due)} due</span>` : html`<span class="badge green" style="margin-left:8px">Paid</span>`}
          ${meter(s.payable ? (s.paid / s.payable) * 100 : 100)}</td>` : ''}
        <td><div class="actions"><button class="btn sm" data-view="${s._id}">View</button>${can('students:update') ? html`<button class="btn sm" data-edit="${s._id}">Edit</button>` : ''}${can('students:delete') ? html`<button class="btn sm danger" data-del="${s._id}">Delete</button>` : ''}</div></td></tr>`)}
      </tbody></table></div>${pager(res)}` : html`<div class="card">${emptyState('No students found', 'Try a different search, or add a new student.')}</div>`);
  };

  const guard = (fn) => fn().catch((err) => toast(err.message, 'err'));
  $('#q', page).addEventListener('input', debounce((e) => { state.q = e.target.value; state.page = 1; guard(load); }));
  $('#batch', page).addEventListener('change', (e) => { state.batch = e.target.value; state.page = 1; guard(load); });
  $('#status', page).addEventListener('change', (e) => { state.status = e.target.value; state.page = 1; guard(load); });
  $('#add', page)?.addEventListener('click', () => guard(() => openForm(null, load)));
  $('#export', page)?.addEventListener('click', async () => {
    const all = (await api.get('/students', { ...state, limit: 100 })).data;
    const money = can('fees:view');
    downloadCSV('students.csv', [['Roll no', 'Name', 'Parent', 'Phone', 'Batch', ...(money ? ['Payable', 'Paid', 'Due'] : [])],
      ...all.map((s) => [s.rollNo, s.name, s.parentName, s.phone, s.batch?.name, ...(money ? [s.payable, s.paid, s.due] : [])])]);
  });
  page.onclick = (e) => {
    const t = (a) => e.target.closest(`[data-${a}]`);
    if (t('page')) { state.page = Number(t('page').dataset.page); guard(load); }
    if (t('view')) guard(() => openProfile(t('view').dataset.view, load));
    if (t('edit')) guard(() => openForm(rows.find((s) => s._id === t('edit').dataset.edit), load));
    if (t('del') && confirmBox('Delete this student and their attendance records?')) {
      guard(async () => { await api.del(`/students/${t('del').dataset.del}`); toast('Student deleted.'); await load(); });
    }
  };
  await load();
};
