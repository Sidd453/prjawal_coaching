import { api } from '../api.js';
import { html, $, formData, toast, modal, inr, fmtDate, today, debounce } from '../ui.js';

export const receiptModal = async (id) => {
  const { data: r } = await api.get(`/fees/payments/${id}/receipt`);
  modal({
    title: `Receipt ${r.receiptNo}`,
    body: html`<div class="receipt">
      <header><div><h3>Patil Ujjwal Coaching Classes</h3><small class="muted">Geeta Corner, Sai Nagar, Mamurdi, Dehuroad, Pune 412101<br>+91 95299 72494</small></div>
        <div class="right"><b>${r.receiptNo}</b><br><small class="muted">${fmtDate(r.paidOn)}</small></div></header>
      <dl>
        <dt>Received from</dt><dd><b>${r.student.name}</b> (${r.student.rollNo})</dd>
        <dt>Batch</dt><dd>${r.student.batch?.name || '-'}</dd>
        <dt>Payment mode</dt><dd>${r.mode.toUpperCase()}</dd>
        ${r.forPeriod ? html`<dt>Towards</dt><dd>${r.forPeriod}</dd>` : ''}
        ${r.remarks ? html`<dt>Remarks</dt><dd>${r.remarks}</dd>` : ''}
        <dt>Total fee</dt><dd>${inr(r.payable)}</dd>
        <dt>Balance after this</dt><dd>${inr(r.due)}</dd>
      </dl>
      <div class="amount">${inr(r.amount)} received</div>
      <footer><span>Received by ${r.receivedBy?.name || 'Office'}</span><span>This is a computer generated receipt.</span></footer>
    </div>
    <div class="modal-foot"><button class="btn" data-close>Close</button><button class="btn primary" id="printBtn">Print receipt</button></div>`,
    onMount: (el) => $('#printBtn', el).addEventListener('click', () => window.print()),
  });
};

export const collectFeeModal = ({ student = null, onDone } = {}) => {
  let chosen = student;
  modal({
    title: 'Collect fee',
    body: html`<form id="feeForm" class="grid" style="gap:14px">
      <div class="field ${student ? 'hide' : ''}"><label>Find student</label>
        <input id="stuSearch" placeholder="Type name, roll no or phone" autocomplete="off">
        <select id="stuPick" size="4" class="hide"></select></div>
      <div id="stuInfo" class="card" style="padding:12px 16px">${student ? '' : html`<span class="muted">Pick a student to see the pending fee.</span>`}</div>
      <div class="form-grid">
        <div class="field"><label>Amount (&#8377;)</label><input name="amount" type="number" min="1" required></div>
        <div class="field"><label>Payment mode</label><select name="mode"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank">Bank transfer</option></select></div>
        <div class="field"><label>Date</label><input name="paidOn" type="date" value="${today()}" max="${today()}" required></div>
        <div class="field"><label>Towards</label><input name="forPeriod" placeholder="e.g. Instalment 1, June"></div>
        <div class="field full"><label>Remarks</label><input name="remarks" placeholder="Optional"></div>
      </div>
      <p class="err-text" id="feeErr" role="alert"></p>
      <div class="modal-foot"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary" id="feeSave">Save and print receipt</button></div>
    </form>`,
    onMount: (el, close) => {
      const form = $('#feeForm', el);
      const showInfo = (s) => {
        chosen = s;
        $('#stuInfo', el).innerHTML = `<b>${s.name}</b> (${s.rollNo})<br>Total ${inr(s.payable)} &middot; Paid ${inr(s.paid)} &middot; <b style="color:var(--red)">Pending ${inr(s.due)}</b>`;
        form.amount.value = s.due || ''; form.amount.max = s.due;
      };
      const load = async (id) => showInfo((await api.get(`/students/${id}`)).data);
      if (student) load(student._id);

      const pick = $('#stuPick', el);
      let found = [];
      $('#stuSearch', el).addEventListener('input', debounce(async (e) => {
        const q = e.target.value.trim();
        if (q.length < 2) return pick.classList.add('hide');
        found = (await api.get('/students', { q, status: 'active', limit: 8 })).data;
        pick.innerHTML = found.map((s, i) => `<option value="${i}">${s.rollNo} - ${s.name.replace(/</g, '&lt;')} (due ${inr(s.due)})</option>`).join('');
        pick.classList.toggle('hide', !found.length);
      }));
      pick.addEventListener('change', () => { showInfo(found[pick.value]); pick.classList.add('hide'); });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!chosen) return ($('#feeErr', el).textContent = 'Pick a student first.');
        const btn = $('#feeSave', el); btn.disabled = true;
        try {
          const res = await api.post('/fees/payments', { ...formData(form), student: chosen._id });
          toast('Payment recorded.'); close(); onDone?.();
          receiptModal(res.data._id);
        } catch (err) { $('#feeErr', el).textContent = err.message; btn.disabled = false; }
      });
    },
  });
};
