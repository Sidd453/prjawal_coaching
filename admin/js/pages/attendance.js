import { api } from '../api.js';
import { can } from '../session.js';
import { html, mount, $, $$, toast, today, fmtDate, emptyState, meter, downloadCSV } from '../ui.js';

const STATES = [['present', 'P', 'Present'], ['absent', 'A', 'Absent'], ['late', 'L', 'Late'], ['leave', 'V', 'On leave']];

export const render = async (page) => {
  const { data: batches } = await api.get('/batches', { active: 'true' });
  mount(page, html`<div class="page-head"><div><h1>Attendance</h1><p>Mark the daily register or review a month.</p></div></div>
    <div class="tabs"><button class="active" data-tab="mark">Daily register</button><button data-tab="report">Monthly report</button></div>
    <div id="pane"></div>`);
  if (!batches.length) return mount($('#pane', page), html`<div class="card">${emptyState('Create a batch first', html`<a href="#/batches">Go to Batches</a>`)}</div>`);

  const batchSelect = (id) => html`<select id="${id}">${batches.map((b) => html`<option value="${b._id}">${b.name}</option>`)}</select>`;
  const guard = (fn) => fn().catch((e) => toast(e.message, 'err'));

  /* ---- Daily register ---- */
  const markPane = () => {
    const pane = $('#pane', page);
    mount(pane, html`<div class="toolbar">${batchSelect('batch')}<input type="date" id="date" value="${today()}" max="${today()}">${can('attendance:mark') ? html`<button class="btn" id="allP">Mark all present</button>` : ''}</div><div id="sheet"></div>`);
    let students = [];

    const draw = () => {
      const count = (s) => students.filter((x) => x.status === s).length;
      const total = students.length || 1;
      $('#sheet', pane).innerHTML = students.length ? html`
        <div class="reg-bar"><div class="tally" aria-hidden="true">${STATES.map(([k]) => html`<i class="${k[0] === 'p' ? 'p' : k === 'absent' ? 'a' : k === 'late' ? 'l' : 'v'}" style="width:${(count(k) / total) * 100}%"></i>`)}</div>
          <div class="legend">${STATES.map(([k, , label]) => html`<span>${label} <b>${count(k)}</b></span>`)}</div></div>
        <div class="roll">${students.map((s, i) => html`<div class="mark" data-s="${s.status || ''}"><div><b>${s.name}</b><small>${s.rollNo}</small></div>
          <div class="seg" role="group" aria-label="Attendance for ${s.name}">${STATES.map(([k, ch, label]) => html`<button type="button" data-i="${i}" data-v="${k}" title="${label}" aria-label="${label}" aria-pressed="${s.status === k}" ${can('attendance:mark') ? '' : 'disabled'}>${ch}</button>`)}</div></div>`)}</div>
        <div class="savebar"><span class="muted">${students.filter((s) => !s.status).length} not marked</span>${can('attendance:mark') ? html`<button class="btn primary" id="save">Save attendance</button>` : html`<span class="badge">View only</span>`}</div>`.v
        : html`<div class="card">${emptyState('No students in this batch', html`<a href="#/students">Add students</a>`)}</div>`.v;
    };

    const load = async () => {
      const res = await api.get('/attendance/sheet', { batch: $('#batch', pane).value, date: $('#date', pane).value });
      students = res.data; draw();
    };
    $('#batch', pane).addEventListener('change', () => guard(load));
    $('#date', pane).addEventListener('change', () => guard(load));
    $('#allP', pane)?.addEventListener('click', () => { students.forEach((s) => { s.status = 'present'; }); draw(); });
    pane.onclick = (e) => {
      const b = e.target.closest('[data-v]');
      if (b) { students[b.dataset.i].status = b.dataset.v; draw(); }
      if (e.target.closest('#save')) guard(async () => {
        const marked = students.filter((s) => s.status);
        if (!marked.length) return toast('Mark at least one student.', 'err');
        const res = await api.post('/attendance/bulk', { batch: $('#batch', pane).value, date: $('#date', pane).value, records: marked.map((s) => ({ student: s._id, status: s.status })) });
        toast(res.message);
      });
    };
    guard(load);
  };

  /* ---- Monthly report ---- */
  const reportPane = () => {
    const pane = $('#pane', page);
    mount(pane, html`<div class="toolbar">${batchSelect('batch')}<input type="month" id="month" value="${today().slice(0, 7)}" max="${today().slice(0, 7)}"><button class="btn" id="csv">Export CSV</button></div><div id="out"></div>`);
    let report = null;
    const load = async () => {
      report = await api.get('/attendance/report', { batch: $('#batch', pane).value, month: $('#month', pane).value });
      mount($('#out', pane), report.data.length ? html`<p class="muted" style="margin-bottom:10px">${report.workingDays} days marked this month.</p>
        <div class="table-wrap"><table><thead><tr><th>Student</th><th class="right">Present</th><th class="right">Late</th><th class="right">Absent</th><th class="right">Leave</th><th>Attendance</th></tr></thead><tbody>
        ${report.data.map((s) => html`<tr><td><b>${s.name}</b><span class="sub">${s.rollNo}</span></td><td class="right num">${s.present}</td><td class="right num">${s.late}</td><td class="right num">${s.absent}</td><td class="right num">${s.leave}</td>
          <td><b class="num">${s.percentage}%</b>${meter(s.percentage)}</td></tr>`)}</tbody></table></div>`
        : html`<div class="card">${emptyState('No students in this batch', '')}</div>`);
    };
    $('#batch', pane).addEventListener('change', () => guard(load));
    $('#month', pane).addEventListener('change', () => guard(load));
    $('#csv', pane).addEventListener('click', () => report && downloadCSV(`attendance-${report.month}.csv`,
      [['Roll no', 'Name', 'Present', 'Late', 'Absent', 'Leave', 'Percentage'], ...report.data.map((s) => [s.rollNo, s.name, s.present, s.late, s.absent, s.leave, s.percentage + '%'])]));
    guard(load);
  };

  const tabs = { mark: markPane, report: reportPane };
  page.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    $$('.tabs button', page).forEach((x) => x.classList.toggle('active', x === b));
    $('#pane', page).onclick = null; tabs[b.dataset.tab]();
  });
  markPane();
};
