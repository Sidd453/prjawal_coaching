import { api } from '../api.js';
import { html, mount, inr, fmtDate, monthLabel, emptyState } from '../ui.js';
import { can } from '../session.js';

export const render = async (page) => {
  const d = await api.get('/dashboard');
  const f = d.finance;
  const max = f ? Math.max(...f.trend.map((t) => t.total), 1) : 1;
  const t = d.today;
  mount(page, html`
    <div class="page-head"><div><h1>Dashboard</h1><p>${fmtDate(t.date)}</p></div>
      ${can('attendance:mark') ? html`<a class="btn primary" href="#/attendance">Take today's attendance</a>` : ''}</div>
    <div class="grid g4">
      <div class="card stat"><span>Active students</span><b class="num">${d.students}</b></div>
      ${f ? html`<div class="card stat ok"><span>Collected this month</span><b class="num">${inr(f.monthCollection)}</b></div>
      <div class="card stat due"><span>Fees pending</span><b class="num">${inr(f.totalDue)}</b></div>` : html`<div class="card stat"><span>Active batches</span><b class="num">${d.batches}</b></div>`}
      ${d.newEnquiries != null ? html`<div class="card stat"><span>New enquiries</span><b class="num">${d.newEnquiries}</b></div>` : ''}
    </div>
    <div class="grid g2" style="margin-top:16px">
      ${f ? html`<div class="card"><h3>Fee collection, last 6 months</h3>
        ${f.trend.length ? html`<div class="bars">${f.trend.map((m) => html`<div><span class="num">${inr(m.total)}</span><i style="height:${Math.round((m.total / max) * 100)}%"></i>${monthLabel(m.month)}</div>`)}</div>`
          : emptyState('No payments yet', 'Collected fees will show up here.')}</div>` : ''}
      <div class="card" ${f ? '' : 'style="grid-column:1/-1"'}><h3>Today's attendance</h3>
        ${t.marked ? html`<div class="list">
          <div><span>Present</span><b class="num">${t.present}</b></div><div><span>Late</span><b class="num">${t.late}</b></div>
          <div><span>Absent</span><b class="num">${t.absent}</b></div><div><span>On leave</span><b class="num">${t.leave}</b></div></div>`
          : emptyState('Not marked yet', can('attendance:view') ? html`<a href="#/attendance">Open the register</a>` : '')}</div>
    </div>
    ${f ? html`<div class="card" style="margin-top:16px"><h3>Recent payments</h3>
      ${f.recentPayments.length ? html`<div class="list">${f.recentPayments.map((p) => html`<div>
        <span><b>${p.student?.name || 'Deleted student'}</b> <span class="muted">${p.receiptNo} &middot; ${fmtDate(p.paidOn)}</span></span><b class="num">${inr(p.amount)}</b></div>`)}</div>`
        : emptyState('Nothing recorded', 'Use Fees to collect the first payment.')}</div>` : ''}`);
};
