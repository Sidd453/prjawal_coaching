import { api, auth } from './api.js';
import { html, mount, $, $$, formData, toast, modal, icon } from './ui.js';
import * as dashboard from './pages/dashboard.js';
import * as students from './pages/students.js';
import * as batches from './pages/batches.js';
import * as attendance from './pages/attendance.js';
import * as fees from './pages/fees.js';
import * as enquiries from './pages/enquiries.js';
import * as staff from './pages/staff.js';
import { session, can, canAny } from './session.js';

const routes = {
  dashboard: { label: 'Dashboard', icon: 'home', page: dashboard, allow: () => can('dashboard:view') },
  students: { label: 'Students', icon: 'users', page: students, allow: () => can('students:view') },
  batches: { label: 'Batches', icon: 'layers', page: batches, allow: () => can('batches:view') },
  attendance: { label: 'Attendance', icon: 'check', page: attendance, allow: () => can('attendance:view') },
  fees: { label: 'Fees', icon: 'rupee', page: fees, allow: () => canAny('fees:view', 'fees:dues') },
  enquiries: { label: 'Enquiries', icon: 'inbox', page: enquiries, allow: () => can('enquiries:view') },
  staff: { label: 'Staff & roles', icon: 'shield', page: staff, allow: () => can('users:view') },
};
const visibleRoutes = () => Object.entries(routes).filter(([, r]) => r.allow());
const homeKey = () => visibleRoutes()[0]?.[0];

const root = $('#root');
let user = null;
const setUser = (u) => { user = u; session.set(u); };

const renderLogin = () => {
  mount(root, html`<div class="login">
    <section class="login-art">
      <div class="login-brand"><img src="../assets/images/logo-icon.png" alt=""><span>Staff portal</span></div>
      <div><h1>Patil Ujjwal Coaching Classes</h1><p>Attendance, fees and admissions in one place.</p></div>
      <ul class="login-points"><li>Role based access for every staff member</li><li>Fee receipts and pending reminders</li><li>Daily attendance in two taps</li></ul>
    </section>
    <section class="login-form">
      <form id="loginForm" novalidate>
        <div><h2>Welcome back</h2><p class="muted">Log in with the account your admin created for you.</p></div>
        <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="username" placeholder="you@example.com" required></div>
        <div class="field"><label for="password">Password</label><div class="pw"><input id="password" name="password" type="password" autocomplete="current-password" required><button type="button" id="showPw" aria-label="Show password">Show</button></div></div>
        <p class="err-text" id="loginErr" role="alert"></p>
        <button class="btn primary" id="loginBtn">Log in</button>
        <a class="back-link" href="../index.html">&larr; Back to website</a>
      </form>
    </section>
  </div>`);
  $('#showPw').addEventListener('click', (e) => { const i = $('#password'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; e.target.textContent = show ? 'Hide' : 'Show'; });
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#loginBtn'); btn.disabled = true; $('#loginErr').textContent = '';
    try {
      const res = await api.post('/auth/login', formData(e.target));
      auth.token = res.token; setUser(res.user);
      location.hash = `#/${homeKey() || ''}`;
      renderShell();
    } catch (err) { $('#loginErr').textContent = err.message; btn.disabled = false; }
  });
};

const changePasswordModal = () => modal({
  title: 'Change password',
  body: html`<form id="pwForm" class="grid" style="gap:14px">
    <div class="field"><label>Current password</label><input name="currentPassword" type="password" required></div>
    <div class="field"><label>New password</label><input name="newPassword" type="password" minlength="8" required><small>At least 8 characters.</small></div>
    <p class="err-text" id="pwErr"></p>
    <div class="modal-foot"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Update password</button></div>
  </form>`,
  onMount: (el, close) => el.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api.post('/auth/change-password', formData(e.target)); toast('Password updated.'); close(); }
    catch (err) { $('#pwErr', el).textContent = err.message; }
  }),
});

const renderShell = async () => {
  const items = visibleRoutes();
  mount(root, html`<div class="shell">
    <aside class="side" id="side">
      <div class="brand"><img src="../assets/images/logo-icon.png" alt=""><span>Patil Ujjwal<small>Coaching Classes</small></span></div>
      <nav class="nav">${items.map(([key, r]) => html`<a href="#/${key}" data-route="${key}">${icon(r.icon)}${r.label}</a>`)}</nav>
      <div class="side-foot"><b>${user.name}</b><span class="role-chip r-${user.role}">${user.roleLabel}</span><br>
        <button id="pwBtn">Change password</button><br><button id="logoutBtn">Log out</button></div>
    </aside>
    <div class="main">
      <div class="topbar"><button id="menuBtn" aria-label="Open menu">&#9776;</button><b>Patil Ujjwal</b></div>
      <main class="page" id="page"></main>
    </div>
  </div>`);
  $('#menuBtn').addEventListener('click', () => $('#side').classList.toggle('open'));
  $('#logoutBtn').addEventListener('click', logout);
  $('#pwBtn').addEventListener('click', changePasswordModal);
  $('#side').addEventListener('click', (e) => { if (e.target.closest('a')) $('#side').classList.remove('open'); });
  navigate();
};

const navigate = async () => {
  const key = (location.hash.replace('#/', '') || 'dashboard').split('?')[0];
  const wanted = routes[key]?.allow() ? key : homeKey();
  const route = routes[wanted];
  if (!route) { $('#page').innerHTML = '<div class="card"><b>No access</b><p class="muted">Your role has no pages assigned. Ask an admin.</p></div>'; return; }
  if (wanted !== key) history.replaceState(null, '', `#/${wanted}`);
  const active = Object.keys(routes).find((k) => routes[k] === route);
  $$('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === active));
  const page = $('#page');
  if (!page) return;
  page.onclick = page.onchange = null;
  page.innerHTML = '<p class="muted">Loading&hellip;</p>';
  try { await route.page.render(page, { user }); }
  catch (err) { page.innerHTML = `<div class="card"><b>Could not load this page.</b><p class="muted">${err.message}</p></div>`; }
};

const logout = () => { auth.token = null; setUser(null); location.href = '../index.html'; };

window.addEventListener('hashchange', () => user && navigate());
window.addEventListener('auth:expired', () => { setUser(null); renderLogin(); toast('Session expired. Please log in again.', 'err'); });

(async () => {
  if (!auth.token) return renderLogin();
  try { setUser((await api.get('/auth/me')).user); renderShell(); }
  catch { renderLogin(); }
})();
