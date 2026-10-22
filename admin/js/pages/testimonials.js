import { api } from '../api.js';
import { can } from '../session.js';
import { html, mount, $, formData, toast, modal, fmtDate, confirmBox, emptyState } from '../ui.js';

const stars = (n) => '\u2605'.repeat(n) + '\u2606'.repeat(5 - n);

const form = (t = {}) => html`<form class="grid" style="gap:14px">
  <div class="form-grid">
    <div class="field"><label>Name</label><input name="name" value="${t.name || ''}" maxlength="80" required></div>
    <div class="field"><label>Class / relation</label><input name="role" value="${t.role || ''}" maxlength="80" placeholder="e.g. Class 10 Student"></div>
    <div class="field"><label>Topic tag</label><input name="tag" value="${t.tag || ''}" maxlength="40" placeholder="e.g. Maths"></div>
    <div class="field"><label>Rating</label><select name="rating">${[5, 4, 3, 2, 1].map((n) => html`<option value="${n}" ${(t.rating || 5) === n ? 'selected' : ''}>${n} star${n > 1 ? 's' : ''}</option>`)}</select></div>
    <div class="field"><label>Show order</label><input name="order" type="number" min="0" value="${t.order ?? 0}"><small>Lower numbers show first.</small></div>
    <div class="field"><label>Pin to top</label><select name="featured"><option value="false" ${!t.featured ? 'selected' : ''}>No</option><option value="true" ${t.featured ? 'selected' : ''}>Yes</option></select></div>
    <div class="field full"><label>Testimonial</label><textarea name="quote" rows="4" maxlength="600" required>${t.quote || ''}</textarea></div>
  </div>
  <p class="err-text" role="alert"></p>
  <div class="modal-foot"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save testimonial</button></div>
</form>`;

const openForm = (t, reload) => modal({
  title: t ? 'Edit testimonial' : 'Add testimonial', body: form(t || {}),
  onMount: (el, close) => $('form', el).addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = formData(e.target);
    const body = { ...f, rating: Number(f.rating), order: Number(f.order) || 0, featured: f.featured === 'true' };
    try { t ? await api.put(`/admin/testimonials/${t._id}`, body) : await api.post('/admin/testimonials', body); toast('Testimonial saved.'); close(); reload(); }
    catch (err) { $('.err-text', el).textContent = err.message; }
  }),
});

export const render = async (page) => {
  const load = async () => {
    const { data } = await api.get('/admin/testimonials');
    const manage = can('testimonials:manage');
    mount(page, html`<div class="page-head"><div><h1>Testimonials</h1><p>Everything here is live on the website. Reviews sent by visitors appear instantly; edit or delete any that should not be shown.</p></div>
      ${manage ? html`<button class="btn primary" id="add">Add testimonial</button>` : ''}</div>
      ${data.length ? html`<div class="table-wrap"><table><thead><tr><th>Name</th><th>Testimonial</th><th>Rating</th><th>Added</th><th></th></tr></thead><tbody>
        ${data.map((t) => html`<tr><td><b>${t.name}</b><span class="sub">${t.role || '-'}${t.tag ? ' - ' + t.tag : ''}</span>${t.source === 'website' ? html`<span class="sub">Sent from website</span>` : ''}${t.featured ? html`<span class="badge">Pinned</span>` : ''}</td>
          <td style="max-width:340px">${t.quote}</td><td style="white-space:nowrap" aria-label="${t.rating} out of 5">${stars(t.rating)}</td><td>${fmtDate(t.createdAt)}</td>
          <td><div class="actions">
            ${manage ? html`<button class="btn sm" data-edit="${t._id}">Edit</button>` : ''}
            ${can('testimonials:delete') ? html`<button class="btn sm danger" data-del="${t._id}">Delete</button>` : ''}
          </div></td></tr>`)}</tbody></table></div>`
        : html`<div class="card">${emptyState('No testimonials', 'Add one, or wait for visitors to send reviews from the website.')}</div>`}`);
    $('#add', page)?.addEventListener('click', () => openForm(null, load));
    page.onclick = async (e) => {
      const edit = e.target.closest('[data-edit]'); const del = e.target.closest('[data-del]');
      try {
        if (edit) openForm(data.find((t) => t._id === edit.dataset.edit), load);
        if (del && confirmBox('Delete this testimonial?')) { await api.del(`/admin/testimonials/${del.dataset.del}`); toast('Testimonial deleted.'); load(); }
      } catch (err) { toast(err.message, 'err'); }
    };
  };
  await load();
};
