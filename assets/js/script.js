// ===================================================================
// Patil Ujjwal Coaching Classes | shared site script (all pages)
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

// ===== Testimonials from the backend (GET /api/testimonials) =====
// The cards already in the HTML are a fallback. They are replaced only when the API answers with data.
const TM_COLORS = ['linear-gradient(150deg,#E50914,#B4070F)','linear-gradient(150deg,#0a7a4e,#054228)','linear-gradient(150deg,#2b2b2b,#111111)'];
const tmInitials = n => n.trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
function tmEl(tag, cls, text){ const e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
function tmStars(r){ return '\u2605'.repeat(r) + '\u2606'.repeat(5 - r); }

function buildHomeCard(t, i){
  const card = tmEl('article','tm-card');
  const top = tmEl('div','tm-top');
  const stars = tmEl('span','tm-stars', tmStars(t.rating)); stars.setAttribute('aria-label', t.rating + ' out of 5 stars');
  top.appendChild(stars); if(t.tag) top.appendChild(tmEl('span','tm-tag', t.tag));
  const who = tmEl('div','tm-who');
  const av = tmEl('span','tm-av', tmInitials(t.name)); av.style.background = TM_COLORS[i % TM_COLORS.length];
  const info = document.createElement('div'); info.appendChild(tmEl('b', null, t.name)); info.appendChild(tmEl('small', null, t.role));
  who.appendChild(av); who.appendChild(info);
  card.appendChild(top); card.appendChild(tmEl('p','tm-q', t.quote)); card.appendChild(who);
  return card;
}
function buildResultsCard(t, i){
  const card = tmEl('div','testi-card');
  card.appendChild(tmEl('div','testi-stars', tmStars(t.rating)));
  card.appendChild(tmEl('p','q', t.quote));
  const who = tmEl('div','testi-who');
  const av = tmEl('span','av', tmInitials(t.name)); av.style.background = TM_COLORS[i % TM_COLORS.length];
  const info = document.createElement('div'); info.appendChild(tmEl('b', null, t.name)); info.appendChild(tmEl('small', null, t.role));
  who.appendChild(av); who.appendChild(info);
  card.appendChild(who);
  return card;
}
// Resolves to an array of testimonials, or [] if the server is slow, down, or has none yet.
function loadTestimonials(limit){
  const ctrl = ('AbortController' in window) ? new AbortController() : null;
  const timer = ctrl ? setTimeout(()=>ctrl.abort(), 8000) : null;
  return fetch((window.API_BASE || '') + '/api/testimonials?limit=' + (limit || 30), ctrl ? { signal: ctrl.signal } : undefined)
    .then(r => r.ok ? r.json() : { data: [] })
    .then(j => Array.isArray(j.data) ? j.data : [])
    .catch(() => [])
    .finally(() => { if(timer) clearTimeout(timer); });
}

// ===== Testimonial carousel =====
const track = document.getElementById('testiTrack');
if(track){
  const cardW = () => { const c = track.querySelector('.testi-card'); return c ? c.offsetWidth + 22 : 300; };
  const tNext = document.getElementById('tNext');
  const tPrev = document.getElementById('tPrev');
  if(tNext) tNext.addEventListener('click', ()=> track.scrollBy({left:cardW(), behavior:'smooth'}));
  if(tPrev) tPrev.addEventListener('click', ()=> track.scrollBy({left:-cardW(), behavior:'smooth'}));
  loadTestimonials(30).then(list=>{
    if(!list.length) return;
    track.replaceChildren(...list.map(buildResultsCard));
    track.scrollLeft = 0;
  });
}

// ===== Gallery (real photos) + lightbox =====
const galleryData = [
  // {src:'assets/images/gallery/classroom-writing.jpg', label:'Focused Learning', pos:'center'},
  {src:'assets/images/gallery/students-listening.jpg', label:'Attentive Students', pos:'center'},
  // {src:'assets/images/gallery/exam-supervision.jpg', label:'Exam Practice', pos:'center'},
  // {src:'assets/images/gallery/director.jpg', label:'Patil Ujjwal Sir', pos:'center 40%'},
  {src:'assets/images/gallery/exam-row.jpg', label:'Test Day', pos:'center 35%'},
  {src:'assets/images/gallery/exam-hall.jpg', label:'Guided Test Session', pos:'center'},
  {src:'assets/images/gallery/centre-signboard.jpg', label:'Our Centre: Classes 5th to 12th', pos:'center'},
  {src:'assets/images/gallery/classroom-banner.jpg', label:'Focused Classroom', pos:'center'},
  {src:'assets/images/gallery/teaching-podium.jpg', label:'Lecture Session', pos:'center'},
  {src:'assets/images/gallery/exam-classroom.jpg', label:'Practice Test', pos:'center'},
  {src:'assets/images/gallery/director-office.jpg', label:'Patil Ujjwal Sir at the Centre', pos:'center 40%'},
];
const grid = document.getElementById('galleryGrid');
const lightbox = document.getElementById('lightbox');
const lbTitle = document.getElementById('lbTitle');
const lbImg = document.getElementById('lbImg');
let lbIndex = 0;
function showLightbox(i){
  lbIndex = (i + galleryData.length) % galleryData.length;
  lbImg.src = galleryData[lbIndex].src; lbImg.alt = galleryData[lbIndex].label;
  lbTitle.textContent = galleryData[lbIndex].label;
  lightbox.classList.add('open');
}
if(grid){
  galleryData.forEach((g,i)=>{
    const item = document.createElement('div');
    item.className='g-item reveal';
    item.innerHTML = `<img class="real" src="${g.src}" alt="${g.label}" loading="lazy">
      <div class="overlay"><span class="view"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg></span></div>
      <div class="cap">${g.label}</div>`;
    item.addEventListener('click', ()=> showLightbox(i));
    grid.appendChild(item);
    io.observe(item);
  });
}
const lbClose = document.getElementById('lbClose');
if(lightbox){
  lbClose.addEventListener('click', ()=> lightbox.classList.remove('open'));
  lightbox.addEventListener('click', (e)=>{ if(e.target===lightbox) lightbox.classList.remove('open'); });
  document.getElementById('lbPrev').addEventListener('click', ()=> showLightbox(lbIndex-1));
  document.getElementById('lbNext').addEventListener('click', ()=> showLightbox(lbIndex+1));
  document.addEventListener('keydown', (e)=>{
    if(!lightbox.classList.contains('open')) return;
    if(e.key==='Escape') lightbox.classList.remove('open');
    if(e.key==='ArrowLeft') showLightbox(lbIndex-1);
    if(e.key==='ArrowRight') showLightbox(lbIndex+1);
  });
}

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
    // API_BASE is empty when the site is served by the backend; set window.API_BASE in a <script> for a separate host.
    const API_BASE = window.API_BASE || '';
    fetch(API_BASE + '/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, course, message })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if(!res.ok) throw new Error(data.message || 'Could not send your enquiry.');
        form.style.display = 'none';
        successBox.classList.add('show');
      })
      .catch((err) => { alert(err.message + ' Please try again or call us.'); })
      .finally(() => {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      });
  });
}


// ===== Home testimonials: auto-scroll + drag/swipe + arrows, seamless loop =====
(function(){
  const track = document.getElementById('tmTrack');
  if(!track) return;
  let N = 0;
  // Fills the track with the given cards plus two hidden copies, so the loop can wrap seamlessly.
  function populate(cards){
    track.replaceChildren(...cards);
    N = cards.length;
    for(let k=0;k<2;k++){
      cards.forEach(c=>{ const cl = c.cloneNode(true); cl.setAttribute('aria-hidden','true'); track.appendChild(cl); });
    }
  }
  populate(Array.from(track.children));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = 0.045;            // px per ms  (~45px/sec) gentle, readable
  let setW = 0, pos = 0, paused = false, inView = true, resumeT = null, dragging = false;

  function measure(){
    const cards = track.children;
    setW = cards[N].offsetLeft - cards[0].offsetLeft;
    if(setW > 0 && (track.scrollLeft < setW*0.5 || track.scrollLeft > setW*1.5)){
      track.scrollLeft = setW + (track.scrollLeft % setW);
    }
    pos = track.scrollLeft;
  }
  function wrap(){
    if(!setW) return;
    const x = track.scrollLeft;
    if(x < setW*0.5)      track.scrollLeft = x + setW;
    else if(x > setW*1.5) track.scrollLeft = x - setW;
  }
  function pause(){ paused = true; clearTimeout(resumeT); }
  function resume(delay){
    clearTimeout(resumeT);
    resumeT = setTimeout(()=>{ if(dragging) return; pos = track.scrollLeft; paused = false; }, delay);
  }

  // Swap in live testimonials from the backend when they arrive.
  loadTestimonials(30).then(list=>{
    if(!list.length) return;
    populate(list.map(buildHomeCard));
    setW = 0; measure(); track.scrollLeft = setW; pos = setW;
  });

  window.addEventListener('load', ()=>{ measure(); track.scrollLeft = setW; pos = setW; });
  window.addEventListener('resize', measure);
  measure(); track.scrollLeft = setW; pos = setW;

  let last = performance.now();
  function tick(now){
    const dt = Math.min(50, now - last); last = now;
    if(!paused && !reduce && inView && setW){
      pos += SPEED * dt;
      if(pos > setW*1.5) pos -= setW;
      track.scrollLeft = pos;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // only animate while the section is visible
  if('IntersectionObserver' in window){
    new IntersectionObserver(es=>{ inView = es[0].isIntersecting; if(inView) pos = track.scrollLeft; }, {threshold:0})
      .observe(track);
  }

  // keep the loop seamless while the user scrolls/swipes manually
  track.addEventListener('scroll', ()=>{ if(paused) wrap(); }, {passive:true});

  // pause on hover / focus / touch
  track.addEventListener('mouseenter', pause);
  track.addEventListener('mouseleave', ()=> resume(500));
  track.addEventListener('focusin', pause);
  track.addEventListener('focusout', ()=> resume(500));
  track.addEventListener('touchstart', pause, {passive:true});
  track.addEventListener('touchend', ()=> resume(2500), {passive:true});
  track.addEventListener('wheel', ()=>{ pause(); resume(1800); }, {passive:true});

  // mouse drag
  let startX = 0, startLeft = 0;
  track.addEventListener('pointerdown', e=>{
    if(e.pointerType !== 'mouse') return;
    dragging = true; pause();
    startX = e.clientX; startLeft = track.scrollLeft;
    track.classList.add('dragging'); track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', e=>{
    if(!dragging) return;
    track.scrollLeft = startLeft - (e.clientX - startX);
  });
  function endDrag(e){
    if(!dragging) return;
    dragging = false; track.classList.remove('dragging');
    try{ track.releasePointerCapture(e.pointerId); }catch(_){}
    resume(500);
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  // arrows
  function step(){
    const gap = parseFloat(getComputedStyle(track).columnGap) || 24;
    return track.children[0].offsetWidth + gap;
  }
  const prev = document.getElementById('tmPrev'), next = document.getElementById('tmNext');
  if(next) next.addEventListener('click', ()=>{ pause(); track.scrollBy({left: step(),  behavior:'smooth'}); resume(2500); });
  if(prev) prev.addEventListener('click', ()=>{ pause(); track.scrollBy({left: -step(), behavior:'smooth'}); resume(2500); });
})();


// ===== Share your experience (POST /api/testimonials, goes live immediately) =====
(function(){
  const form = document.getElementById('testimonialForm');
  if(!form) return;
  const ok = document.getElementById('testimonialSuccess');
  const btn = document.getElementById('testimonialBtn');
  const setInvalid = (el, bad) => el.classList.toggle('invalid', bad);
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const name = form.elements.name.value.trim(), role = form.elements.role.value.trim(), quote = form.elements.quote.value.trim();
    const rating = (form.querySelector('input[name="rating"]:checked') || {}).value;
    const fName = form.querySelector('[data-field="name"]'), fQuote = form.querySelector('[data-field="quote"]'), fRating = form.querySelector('[data-field="rating"]');
    setInvalid(fName, name.length < 2); setInvalid(fQuote, quote.length < 15); setInvalid(fRating, !rating);
    if(name.length < 2 || quote.length < 15 || !rating) return;
    btn.classList.add('loading'); btn.disabled = true;
    fetch((window.API_BASE || '') + '/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role, quote, rating: Number(rating), website: form.elements.website.value })
    })
      .then(async res=>{
        const data = await res.json().catch(()=>({}));
        if(!res.ok) throw new Error(data.message || 'Could not send your review.');
        form.style.display = 'none'; ok.classList.add('show');
        // show the new review in the carousel straight away
        const tr = document.getElementById('testiTrack');
        if(tr) loadTestimonials(30).then(list=>{ if(list.length){ tr.replaceChildren(...list.map(buildResultsCard)); tr.scrollLeft = 0; } });
      })
      .catch(err=>{ alert(err.message + ' Please try again in a moment.'); })
      .finally(()=>{ btn.classList.remove('loading'); btn.disabled = false; });
  });
})();
