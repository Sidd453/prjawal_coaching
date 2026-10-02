import { api } from '../api.js';
import { can } from '../session.js';
import { html, mount, $, $$, toast, inr, fmtDate, confirmBox, emptyState, pager, downloadCSV } from '../ui.js';
import { collectFeeModal, receiptModal } from './feeModals.js';

export const render = async (page) => {
  const { data: batches } = can('batches:view') ? await api.get('/batches') : { data: [] };
  mount(page, html`<div class="page-head"><div><h1>Fees</h1><p>Receipts and pending balances.</p></div>${can('fees:collect') ? html`<button class="btn primary" id="collect">Collect fee</button>` : ''}</div>
    <div class="tabs">${can('fees:view') ? html`<button data-tab="payments">Payments</button>` : ''}${can('fees:dues') ? html`<button data-tab="dues">Pending fees</button>` : ''}</div><div id="pane"></div>`);
  const guard = (fn) => fn().catch((e) => toast(e.message, 'err'));
  let current = can('fees:view') ? 'payments' : 'dues';
  const refresh = () => guard(tabs[current]);

  const payments = async () => {
    const pane = $('#pane', page);
    const state = { from: '', to: '', mode: '', page: 1 };
    mount(pane, html`<div class="toolbar"><label class="muted">From <input type="date" id="from"></label><label class="muted">To <input type="date" id="to"></label>
      <select id="mode"><option value="">All modes</option><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank">Bank</option></select>
      <b id="sum" class="num" style="margin-left:auto"></b></div><div id="list"></div>`);
    const load = async () => {
      const res = await api.get('/fees/payments', { ...state, limit: 20 });
      $('#sum', pane).textContent = `Collected: ${inr(res.collected)}`;
      mount($('#list', pane), res.data.length ? html`<div class="table-wrap"><table><thead><tr><th>Receipt</th><th>Student</th><th>Date</th><th>Mode</th><th class="right">Amount</th><th></th></tr></thead><tbody>
        ${res.data.map((p) => html`<tr><td>${p.receiptNo}</td><td><b>${p.student?.name || 'Deleted student'}</b><span class="sub">${p.student?.batch?.name || ''}</span></td><td>${fmtDate(p.paidOn)}</td><td>${p.mode.toUpperCase()}</td>
          <td class="right num">${inr(p.amount)}</td><td><div class="actions">${can('fees:receipt') ? html`<button class="btn sm" data-receipt="${p._id}">Receipt</button>` : ''}${can('fees:delete') ? html`<button class="btn sm danger" data-del="${p._id}">Delete</button>` : ''}</div></td></tr>`)}
        </tbody></table></div>${pager(res)}` : html`<div class="card">${emptyState('No payments found', 'Change the dates or collect a new fee.')}</div>`);
    };
    ['from', 'to', 'mode'].forEach((k) => $(`#${k}`, pane).addEventListener('change', (e) => { state[k] = e.target.value; state.page = 1; guard(load); }));
    pane.onclick = (e) => {
      const t = (a) => e.target.closest(`[data-${a}]`);
      if (t('page')) { state.page = Number(t('page').dataset.page); guard(load); }
      if (t('receipt')) guard(() => receiptModal(t('receipt').dataset.receipt));
      if (t('del') && confirmBox('Delete this receipt? The student balance will go up by this amount.')) guard(async () => { await api.del(`/fees/payments/${t('del').dataset.del}`); toast('Receipt deleted.'); await load(); });
    };
    await load();
  };

  const dues = async () => {
    const pane = $('#pane', page);
    mount(pane, html`<div class="toolbar"><select id="batch"><option value="">All batches</option>${batches.map((b) => html`<option value="${b._id}">${b.name}</option>`)}</select>
      <button class="btn" id="csv">Export CSV</button><b id="sum" class="num" style="margin-left:auto"></b></div><div id="list"></div>`);
    let rows = [];
    const load = async () => {
      const res = await api.get('/fees/dues', { batch: $('#batch', pane).value });
      rows = res.data;
      $('#sum', pane).textContent = `Total pending: ${inr(res.totalDue)}`;
      mount($('#list', pane), rows.length ? html`<div class="table-wrap"><table><thead><tr><th>Student</th><th>Batch</th><th>Phone</th><th class="right">Paid</th><th class="right">Pending</th><th></th></tr></thead><tbody>
        ${rows.map((s) => {
          const msg = encodeURIComponent(`Hello, this is a reminder from Patil Ujjwal Coaching Classes. A fee of Rs ${s.due} is pending for ${s.name}. Please pay at the earliest. Thank you.`);
          return html`<tr><td><b>${s.name}</b><span class="sub">${s.rollNo}</span></td><td>${s.batch?.name || '-'}</td><td>${s.phone}</td><td class="right num">${inr(s.paid)}</td>
            <td class="right num"><b style="color:var(--red)">${inr(s.due)}</b></td>
            <td><div class="actions"><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/91${s.phone.replace(/\D/g, '').slice(-10)}?text=${msg}">WhatsApp</a>${can('fees:collect') ? html`<button class="btn sm primary" data-pay="${s._id}">Collect</button>` : ''}</div></td></tr>`;
        })}</tbody></table></div>` : html`<div class="card">${emptyState('No pending fees', 'Every active student is fully paid.')}</div>`);
    };
    $('#batch', pane).addEventListener('change', () => guard(load));
    $('#csv', pane).addEventListener('click', () => downloadCSV('pending-fees.csv', [['Roll no', 'Name', 'Batch', 'Phone', 'Paid', 'Pending'], ...rows.map((s) => [s.rollNo, s.name, s.batch?.name, s.phone, s.paid, s.due])]));
    pane.onclick = (e) => { const b = e.target.closest('[data-pay]'); if (b) collectFeeModal({ student: rows.find((s) => s._id === b.dataset.pay), onDone: refresh }); };
    await load();
  };

  const tabs = { payments, dues };
  $('#collect', page)?.addEventListener('click', () => collectFeeModal({ onDone: refresh }));
  page.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    $$('.tabs button', page).forEach((x) => x.classList.toggle('active', x === b));
    current = b.dataset.tab; refresh();
  });
  $$('.tabs button', page).find((b) => b.dataset.tab === current)?.classList.add('active');
  await tabs[current]();
};
