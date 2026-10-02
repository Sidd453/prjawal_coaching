import { api } from '../api.js';
import { html, raw, mount, inr, fmtDate, monthLabel, emptyState } from '../ui.js';
import { can } from '../session.js';
import { areaChart, donut, legend, short, PALETTE } from '../charts.js';

// Last 6 months, with 0 for months that have no payments so the graph never skips a month.
const sixMonths = (trend) => {
  const map = new Map(trend.map((t) => [t.month, t.total]));
  const out = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ label: monthLabel(key), value: map.get(key) || 0, full: inr(map.get(key) || 0) });
  }
  return out;
};

const batchSegments = (batches) => {
  const rows = batches.filter((b) => b.students > 0).sort((a, b) => b.students - a.students);
  const head = rows.slice(0, PALETTE.length - 1).map((b, i) => ({ label: b.name, value: b.students, color: PALETTE[i] }));
  const rest = rows.slice(PALETTE.length - 1).reduce((s, b) => s + b.students, 0);
  return rest ? [...head, { label: 'Other batches', value: rest, color: PALETTE[PALETTE.length - 1] }] : head;
};

export const render = async (page) => {
  const d = await api.get('/dashboard');
  let batches = [];
  try { batches = (await api.get('/batches')).data || []; } catch { /* chart is optional */ }

  const f = d.finance, t = d.today;
  const months = f ? sixMonths(f.trend) : [];
  const sum = months.reduce((s, m) => s + m.value, 0);
  const best = months.reduce((b, m) => (m.value > b.value ? m : b), { value: 0 });

  const attSegs = [
    { label: 'Present', value: t.present, color: '#075B3A' }, { label: 'Late', value: t.late, color: '#B7791F' },
    { label: 'Absent', value: t.absent, color: '#E50914' }, { label: 'On leave', value: t.leave, color: '#5B6472' },
  ];
  const attended = t.present + t.late;
  const attPct = t.marked ? Math.round((attended / t.marked) * 100) : 0;

  const paid = f ? f.monthCollection : 0, due = f ? f.totalDue : 0;
  const feeSegs = [{ label: 'Collected this month', value: paid, color: '#075B3A' }, { label: 'Pending fees', value: due, color: '#E50914' }];
  const feePct = paid + due ? Math.round((paid / (paid + due)) * 100) : 0;

  const bSegs = batchSegments(batches);

  mount(page, html`
    <div class="page-head"><div><h1>Dashboard</h1><p>${fmtDate(t.date)}</p></div>
      ${can('attendance:mark') ? html`<a class="btn primary" href="#/attendance">Take today's attendance</a>` : ''}</div>

    <div class="grid g4">
      <div class="card stat"><span>Active students</span><b class="num">${d.students}</b></div>
      ${f ? html`<div class="card stat ok"><span>Collected this month</span><b class="num">${inr(f.monthCollection)}</b></div>
      <div class="card stat due"><span>Fees pending</span><b class="num">${inr(f.totalDue)}</b></div>` : html`<div class="card stat"><span>Active batches</span><b class="num">${d.batches}</b></div>`}
      ${d.newEnquiries != null ? html`<div class="card stat"><span>New enquiries</span><b class="num">${d.newEnquiries}</b></div>` : ''}
    </div>

    <div class="grid g2 charts-row">
      ${f ? html`<div class="card chart-card">
        <div class="chart-head"><h3>Fee collection, last 6 months</h3>
          <div class="chart-sub"><span>Total <b class="num">${inr(sum)}</b></span>${best.value ? html`<span>Best month <b>${best.label}</b></span>` : ''}</div></div>
        ${sum ? areaChart(months) : emptyState('No payments yet', 'Collected fees will show up here.')}</div>` : ''}
      <div class="card chart-card" ${f ? '' : raw('style="grid-column:1/-1"')}>
        <div class="chart-head"><h3>Today's attendance</h3></div>
        ${t.marked ? html`<div class="donut-wrap">${donut(attSegs, { big: attPct + '%', small: 'attended' })}${legend(attSegs)}</div>`
          : emptyState('Not marked yet', can('attendance:view') ? html`<a href="#/attendance">Open the register</a>` : '')}</div>
    </div>

    <div class="grid g2e charts-row">
      ${f ? html`<div class="card chart-card">
        <div class="chart-head"><h3>Fees: collected vs pending</h3></div>
        ${paid + due ? html`<div class="donut-wrap">${donut(feeSegs, { big: feePct + '%', small: 'collected' })}${legend(feeSegs, inr)}</div>`
          : emptyState('No fee data', 'Admit students and collect fees to see this.')}</div>` : ''}
      <div class="card chart-card" ${f ? '' : raw('style="grid-column:1/-1"')}>
        <div class="chart-head"><h3>Students by batch</h3></div>
        ${bSegs.length ? html`<div class="donut-wrap">${donut(bSegs, { big: String(d.students), small: 'students' })}${legend(bSegs)}</div>`
          : emptyState('No students in batches yet', 'Admit students to a batch to see the split.')}</div>
    </div>

    ${f ? html`<div class="card" style="margin-top:16px"><h3>Recent payments</h3>
      ${f.recentPayments.length ? html`<div class="list">${f.recentPayments.map((p) => html`<div>
        <span><b>${p.student?.name || 'Deleted student'}</b> <span class="muted">${p.receiptNo} &middot; ${fmtDate(p.paidOn)}</span></span><b class="num">${inr(p.amount)}</b></div>`)}</div>`
        : emptyState('Nothing recorded', 'Use Fees to collect the first payment.')}</div>` : ''}`);
};
