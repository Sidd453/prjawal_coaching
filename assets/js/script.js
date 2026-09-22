// ===================================================================
// Patil Ujjwal Coaching Classes — shared site script (all pages)
// ===================================================================

// ===== Active nav link (based on current page file) =====
(function setActiveNav(){
  const here = (location.pathname.split('/').pop() || 'index.html').split('#')[0] || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a, footer ul li a').forEach(a=>{
    const hrefFile = (a.getAttribute('href') || '').split('#')[0];
    if(hrefFile && hrefFile === here){ a.classList.add('active'); }
  });
})();

// ===== Navbar scroll state =====
const navEl = document.getElementById('siteNav');
function onScroll(){
  if(navEl) navEl.classList.toggle('scrolled', window.scrollY > 40);
}
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();

// ===== Mobile menu =====
const hamBtn = document.getElementById('hamBtn');
const mobileMenu = document.getElementById('mobileMenu');
const scrim = document.getElementById('scrim');
function closeMenu(){
  if(!hamBtn) return;
  hamBtn.classList.remove('open'); hamBtn.setAttribute('aria-expanded','false');
  mobileMenu.classList.remove('open'); scrim.classList.remove('open');
  document.body.style.overflow='';
}
if(hamBtn && mobileMenu && scrim){
  hamBtn.addEventListener('click', ()=>{
    const open = !mobileMenu.classList.contains('open');
    hamBtn.classList.toggle('open', open); hamBtn.setAttribute('aria-expanded', open);
    mobileMenu.classList.toggle('open', open); scrim.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  scrim.addEventListener('click', closeMenu);
  mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click', closeMenu));
}

// ===== Reveal on scroll =====
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, {threshold:.1, rootMargin:'0px 0px 120px 0px'});
document.querySelectorAll('.reveal:not(.in)').forEach(el=>io.observe(el));

// ===== Animated counters =====
function animateCount(el){
  const target = parseFloat(el.getAttribute('data-count'));
  const suffix = el.getAttribute('data-suffix') || '';
  const dur = 1400;
  const start = performance.now();
  function tick(now){
    const p = Math.min(1, (now-start)/dur);
    const eased = 1 - Math.pow(1-p, 3);
    el.textContent = Math.round(target*eased) + suffix;
    if(p<1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const statIo = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ animateCount(e.target); statIo.unobserve(e.target); }
  });
}, {threshold:.5});
document.querySelectorAll('.stat b').forEach(el=>statIo.observe(el));

// ===== Testimonial carousel =====
const track = document.getElementById('testiTrack');
if(track){
  const cardW = () => { const c = track.querySelector('.testi-card'); return c ? c.offsetWidth + 22 : 300; };
  const tNext = document.getElementById('tNext');
  const tPrev = document.getElementById('tPrev');
  if(tNext) tNext.addEventListener('click', ()=> track.scrollBy({left:cardW(), behavior:'smooth'}));
  if(tPrev) tPrev.addEventListener('click', ()=> track.scrollBy({left:-cardW(), behavior:'smooth'}));
}

// ===== Gallery placeholder tiles =====
const galleryData = [
  {label:'Classroom', h:220, c1:'#E50914', c2:'#B4070F'},
  {label:'Students at Work', h:300, c1:'#075B3A', c2:'#054228'},
  {label:'Teaching Session', h:200, c1:'#111111', c2:'#2b2b2b'},
  {label:'Institute Event', h:270, c1:'#075B3A', c2:'#0c3d29'},
  {label:'Group Activity', h:230, c1:'#E50914', c2:'#8f050c'},
  {label:'Achievement Day', h:310, c1:'#111111', c2:'#333333'},
  {label:'Doubt-Solving Session', h:210, c1:'#075B3A', c2:'#054228'},
  {label:'Batch Photo', h:260, c1:'#E50914', c2:'#B4070F'},
  {label:'Annual Function', h:240, c1:'#111111', c2:'#2b2b2b'},
  {label:'Award Ceremony', h:280, c1:'#075B3A', c2:'#0c3d29'},
  {label:'Practical Class', h:220, c1:'#E50914', c2:'#8f050c'},
  {label:'Campus View', h:250, c1:'#111111', c2:'#333333'},
];
const grid = document.getElementById('galleryGrid');
const cameraSvg = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
if(grid){
  galleryData.forEach(g=>{
    const item = document.createElement('div');
    item.className='g-item';
    item.innerHTML = `
      <div class="ph" style="height:${g.h}px;background:linear-gradient(150deg, ${g.c1}, ${g.c2});">
        ${cameraSvg}
        <span>${g.label}</span>
      </div>
      <div class="overlay"><span class="view">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
      </span></div>`;
    item.addEventListener('click', ()=> openLightbox(g.label));
    grid.appendChild(item);
  });
}
const lightbox = document.getElementById('lightbox');
const lbTitle = document.getElementById('lbTitle');
function openLightbox(label){ if(!lightbox) return; lbTitle.textContent = label; lightbox.classList.add('open'); }
const lbClose = document.getElementById('lbClose');
if(lbClose) lbClose.addEventListener('click', ()=> lightbox.classList.remove('open'));
if(lightbox) lightbox.addEventListener('click', (e)=>{ if(e.target===lightbox) lightbox.classList.remove('open'); });

// ===== Contact form validation + fake submit states =====
const form = document.getElementById('enquiryForm');
if(form){
  const submitBtn = document.getElementById('submitBtn');
  const successBox = document.getElementById('formSuccess');
  function setInvalid(fieldEl, invalid){ fieldEl.classList.toggle('invalid', invalid); }
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    let valid = true;
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    const course = form.course.value;
    const message = form.message.value.trim();

    const fName = form.querySelector('[data-field="name"]');
    const fPhone = form.querySelector('[data-field="phone"]');
    const fEmail = form.querySelector('[data-field="email"]');
    const fCourse = form.querySelector('[data-field="course"]');
    const fMessage = form.querySelector('[data-field="message"]');

    setInvalid(fName, name.length < 2); if(name.length<2) valid=false;
    const phoneOk = /^[0-9+\-\s]{7,15}$/.test(phone);
    setInvalid(fPhone, !phoneOk); if(!phoneOk) valid=false;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setInvalid(fEmail, !emailOk); if(!emailOk) valid=false;
    setInvalid(fCourse, course === ''); if(course==='') valid=false;
    setInvalid(fMessage, message.length < 5); if(message.length<5) valid=false;

    if(!valid) return;

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    setTimeout(()=>{
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      form.style.display = 'none';
      successBox.classList.add('show');
    }, 1200);
  });
}
