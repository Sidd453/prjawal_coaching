(function(){
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // scroll progress + back to top
  var bar=document.createElement('div');bar.id='progress';document.body.appendChild(bar);
  var fab=document.createElement('div');fab.className='fab';
  fab.innerHTML='<a class="wa" href="https://wa.me/919529972494?text=Hello%20PUCC%2C%20I%20want%20admission%20details" target="_blank" rel="noopener" aria-label="WhatsApp us"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11 11 0 003.2 17.3L2 22l4.8-1.2A11 11 0 1020.5 3.5zM12 20a8.9 8.9 0 01-4.5-1.2l-.3-.2-2.8.7.8-2.7-.2-.3A8.9 8.9 0 1112 20zm4.9-6.6c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.2 7.2 0 01-3.6-3.1c-.3-.5.3-.5.8-1.5.1-.2 0-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.8 11.9 11.9 0 004.6 4c1.7.7 2.4.8 3.2.7a2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.6-.3z"/></svg></a><a class="ph" href="tel:+919529972494" aria-label="Call us"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/></svg></a><button class="up" aria-label="Back to top"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg></button>';
  document.body.appendChild(fab);
  var up=$('.up',fab);up.onclick=function(){scrollTo({top:0,behavior:reduce?'auto':'smooth'})};
  var tick=false;addEventListener('scroll',function(){if(tick)return;tick=true;requestAnimationFrame(function(){
    var h=document.documentElement,p=h.scrollTop/(h.scrollHeight-h.clientHeight||1);bar.style.transform='scaleX('+p+')';up.classList.toggle('show',h.scrollTop>600);tick=false;});},{passive:true});
  // marquee strip after hero / banner
  var first=$('.hero')||$('.page-banner');
  if(first){var items=['ADMISSIONS OPEN','CBSE & State Board 5th–12th','Sainik School AISSEE & RMS Preparation','Concept-Based Learning','Regular Tests & Doubt Solving','Sai Nagar, Mamurdi, Pune'];
    var s=document.createElement('div');s.className='ad-strip';s.setAttribute('aria-label','Announcements');
    var run=items.map(function(t){return '<span>'+t.replace(/&/g,'&amp;')+'</span>'}).join('');
    s.innerHTML='<div class="ad-track">'+run+run+'</div>';first.parentNode.insertBefore(s,first.nextSibling);}
  // big admissions ad before the CTA block
  var cta=$('.cta');
  if(cta&&!$('.ad-banner')){var sec=cta.closest('section')||cta,w=document.createElement('section');
    w.innerHTML='<div class="wrap"><div class="ad-banner reveal"><div><span class="ad-tag"><i></i>ADMISSIONS OPEN</span><h2>Save time. Build concepts.<br><em>Achieve results.</em></h2><p>Join Patil Ujjwal Coaching Classes for structured teaching, regular tests, doubt-solving and personal attention.</p><div class="ad-pills"><span>CBSE &amp; State 5th–12th</span><span>AISSEE &amp; RMS</span><span>Mathematics &amp; Science</span><span>Personal Attention</span></div></div><div class="ad-side"><a class="btn btn-white" href="contact.html">Book a Free Demo</a><div><small>Call us today</small><a class="call" href="tel:+919529972494">+91 95299 72494</a></div><small>Geeta Corner, Sai Nagar, Mamurdi, Dehuroad, Pune</small></div></div></div>';
    sec.parentNode.insertBefore(w,sec);}
  // reveal for anything new
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});$$('.reveal:not(.in)').forEach(function(el){io.observe(el)});
}
  // cursor spotlight + gentle tilt on cards
  $$('.why-card,.course-card,.dir-card,.approach-card').forEach(function(c){
    c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')});});
  // hero parallax
  if(!reduce){var hv=$('.hero-visual');addEventListener('pointermove',function(e){if(!hv||innerWidth<900)return;var x=(e.clientX/innerWidth-.5)*10,y=(e.clientY/innerHeight-.5)*10;hv.style.translate=x+'px '+y+'px'},{passive:true});}
})();
