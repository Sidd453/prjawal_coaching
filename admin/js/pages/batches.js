import { api } from '../api.js';
import { can } from '../session.js';
import { html, mount, $, formData, toast, modal, inr, confirmBox, emptyState } from '../ui.js';

const batchForm = (b = {}) => html`<form class="grid" style="gap:14px">
  <div class="form-grid">
    <div class="field"><label>Batch name</label><input name="name" value="${b.name || ''}" required></div>
    <div class="field"><label>Class</label><input name="className" value="${b.className || ''}" placeholder="e.g. Class 10" required></div>
    <div class="field"><label>Timing</label><input name="timing" value="${b.timing || ''}" placeholder="e.g. 7:00 AM - 9:00 AM"></div>
    <div class="field"><label>Standard fee (&#8377;)</label><input name="fee" type="number" min="0" value="${b.fee ?? 0}"></div>
    <div class="field"><label>Seats</label><input name="capacity" type="number" min="1" value="${b.capacity ?? 30}"></div>
    <div class="field"><label>Status</label><select name="active"><option value="true" ${b.active !== false ? 'selected' : ''}>Active</option><option value="false" ${b.active === false ? 'selected' : ''}>Inactive</option></select></div>
    <div class="field full"><label>Subjects</label><input name="subjects" value="${(b.subjects || []).join(', ')}" placeholder="Maths, Science, English"><small>Separate with commas.</small></div>
  </div>
  <p class="err-text" role="alert"></p>
  <div class="modal-foot"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save batch</button></div>
</form>`;

const openForm = (batch, reload) => modal({
  title: batch ? 'Edit batch' : 'New batch', body: batchForm(batch || {}),
  onMount: (el, close) => $('form', el).addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = formData(e.target);
    const body = { ...f, active: f.active === 'true', subjects: f.subjects.split(',').map((s) => s.trim()).filter(Boolean) };
    try { batch ? await api.put(`/batches/${batch._id}`, body) : await api.post('/batches', body); toast('Batch saved.'); close(); reload(); }
    catch (err) { $('.err-text', el).textContent = err.message; }
  }),
});

export const render = async (page) => {
  const load = async () => {
    const { data } = await api.get('/batches');
    mount(page, html`<div class="page-head"><div><h1>Batches</h1><p>Groups of students who attend together.</p></div>
      ${can('batches:manage') ? html`<button class="btn primary" id="add">New batch</button>` : ''}</div>
      ${data.length ? html`<div class="table-wrap"><table><thead><tr><th>Batch</th><th>Timing</th><th>Subjects</th><th>Students</th><th>Fee</th><th></th></tr></thead><tbody>
        ${data.map((b) => html`<tr><td><b>${b.name}</b><span class="sub">${b.className}</span></td><td>${b.timing || '-'}</td><td>${b.subjects.join(', ') || '-'}</td>
          <td class="num">${b.students} / ${b.capacity}</td><td class="num">${can('fees:view') ? inr(b.fee) : '-'}</td>
          <td><div class="actions">${b.active ? '' : html`<span class="badge">Inactive</span>`}${can('batches:manage') ? html`<button class="btn sm" data-edit="${b._id}">Edit</button>` : ''}${can('batches:delete') ? html`<button class="btn sm danger" data-del="${b._id}">Delete</button>` : ''}</div></td></tr>`)}
      </tbody></table></div>` : html`<div class="card">${emptyState('No batches yet', 'Create a batch before adding students.')}</div>`}`);
    $('#add', page)?.addEventListener('click', () => openForm(null, load));
    page.onclick = async (e) => {
      const edit = e.target.closest('[data-edit]'); const del = e.target.closest('[data-del]');
      if (edit) openForm(data.find((b) => b._id === edit.dataset.edit), load);
      if (del && confirmBox('Delete this batch?')) {
        try { await api.del(`/batches/${del.dataset.del}`); toast('Batch deleted.'); load(); } catch (err) { toast(err.message, 'err'); }
      }
    };
  };
  await load();
};
