import { api } from '../api.js';
import { can } from '../session.js';
import { html, mount, $, toast, fmtDate, confirmBox, emptyState } from '../ui.js';

const STATUS = [['new', 'New', 'red'], ['contacted', 'Contacted', 'amber'], ['joined', 'Joined', 'green'], ['closed', 'Closed', '']];

export const render = async (page, { user }) => {
  let filter = '';
  const load = async () => {
    const { data } = await api.get('/enquiries', { status: filter });
    mount(page, html`<div class="page-head"><div><h1>Enquiries</h1><p>People who filled the contact form on the website.</p></div></div>
      <div class="toolbar"><select id="filter"><option value="">All</option>${STATUS.map(([k, l]) => html`<option value="${k}" ${filter === k ? 'selected' : ''}>${l}</option>`)}</select></div>
      ${data.length ? html`<div class="table-wrap"><table><thead><tr><th>Name</th><th>Interested in</th><th>Message</th><th>Received</th><th>Status</th><th></th></tr></thead><tbody>
        ${data.map((q) => html`<tr><td><b>${q.name}</b><span class="sub"><a href="tel:${q.phone}">${q.phone}</a>${q.email ? ' - ' + q.email : ''}</span></td><td>${q.course || '-'}</td>
          <td style="max-width:280px">${q.message || '-'}</td><td>${fmtDate(q.createdAt)}</td>
          <td>${can('enquiries:update') ? html`<select data-status="${q._id}" aria-label="Status for ${q.name}">${STATUS.map(([k, l]) => html`<option value="${k}" ${q.status === k ? 'selected' : ''}>${l}</option>`)}</select>` : html`<span class="badge">${q.status}</span>`}</td>
          <td>${can('enquiries:delete') ? html`<button class="btn sm danger" data-del="${q._id}">Delete</button>` : ''}</td></tr>`)}</tbody></table></div>`
        : html`<div class="card">${emptyState('No enquiries', 'New website enquiries will appear here.')}</div>`}`);
    $('#filter', page).addEventListener('change', (e) => { filter = e.target.value; load(); });
    page.onchange = async (e) => {
      const s = e.target.closest('[data-status]'); if (!s) return;
      try { await api.patch(`/enquiries/${s.dataset.status}`, { status: s.value }); toast('Status updated.'); } catch (err) { toast(err.message, 'err'); }
    };
    page.onclick = async (e) => {
      const d = e.target.closest('[data-del]');
      if (d && confirmBox('Delete this enquiry?')) { try { await api.del(`/enquiries/${d.dataset.del}`); load(); } catch (err) { toast(err.message, 'err'); } }
    };
  };
  await load();
};
