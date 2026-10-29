
// ── TAB SWITCHER for Services page
function switchTab(tabId, btn){
  // Update buttons
  document.querySelectorAll('.subnav-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  // Update panels
  document.querySelectorAll('.services-panel').forEach(p=>p.classList.remove('active'));
  const panel = document.getElementById('panel-'+tabId);
  if(panel){
    panel.classList.add('active');
    observeReveals(panel);
  }
}

// ── NAV scroll state
const nav=document.getElementById('nav');

// ── PAGE SWITCHING
let currentPage=window.__PAGE__||'main';
const ROUTES={"main": "/", "services": "/hotels/", "hotels": "/hotels/", "residences": "/branded-residences/", "about": "/about/", "essays": "/essays/", "essay-1": "/essays/lacquerwork-and-the-logic-of-accumulation/", "essay-3": "/essays/hmong-motifs-as-curatorial-language/", "essay-4": "/essays/layers-of-time/", "essay-5": "/essays/the-hands-we-trust/", "essay-6": "/essays/why-the-best-art-disappears/"};

function showPage(id){
  var u=ROUTES[id];
  if(u && u!==location.pathname) location.href=u;
}

function updateNav(pageId){
  document.querySelectorAll('.nav-links a').forEach(a=>{
    a.classList.remove('active');
    if(a.dataset.page===pageId || (!a.dataset.page&&pageId===a.getAttribute('href'))) {
      // skip
    }
  });
  // Mark active by data-page
  document.querySelectorAll('.nav-links a').forEach(a=>{
    const dp=a.getAttribute('data-page');
    const onclick=a.getAttribute('onclick')||'';
    if(onclick.includes("'"+pageId+"'")) a.classList.add('active');
    else if(dp===pageId && pageId==='main') a.classList.add('active');
  });
}

// ── SCROLL: nav compact + page-specific scroll tracking
document.querySelectorAll('.page').forEach(pg=>{
  pg.addEventListener('scroll',()=>{
    nav.classList.toggle('scrolled', pg.scrollTop>80);
  });
});

// ── REVEAL ON SCROLL
function observeReveals(container){
  const items=container.querySelectorAll('.reveal:not(.in)');
  if(!items.length) return;
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  },{threshold:0.08, rootMargin:'0px 0px -24px 0px', root:container});
  items.forEach(el=>io.observe(el));
}

// Init reveals on main page
observeReveals(document.getElementById('page-'+currentPage));

// ── Smooth scroll for anchor links on main page
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const target=document.querySelector(a.getAttribute('href'));
    if(target){
      e.preventDefault();
      const page=document.getElementById('page-'+currentPage);
      const offset=target.getBoundingClientRect().top + page.scrollTop - 100;
      page.scrollTo({top:offset,behavior:'smooth'});
    }
  });
});

// ── ESSAY CAROUSEL
(function(){
  const carousel  = document.getElementById('essaysCarousel');
  const prevBtn   = document.getElementById('carouselPrev');
  const nextBtn   = document.getElementById('carouselNext');
  const fill      = document.getElementById('carouselFill');
  const countEl   = document.getElementById('carouselCount');
  const wrap      = document.getElementById('essaysCarouselWrap');
  if(!carousel) return;

  const cards = carousel.querySelectorAll('.essay-card');
  const total = cards.length;
  const GAP   = 32;
  let current=0, isDragging=false, startX=0, startOffset=0, currentOffset=0, velocity=0, lastX=0, lastTime=0;

  const cardWidth = ()=> cards[0].getBoundingClientRect().width;
  const maxOffset = ()=> Math.max(0,(total*(cardWidth()+GAP)) - wrap.getBoundingClientRect().width + 64);

  function setOffset(x, animated){
    x = Math.max(0, Math.min(x, maxOffset()));
    currentOffset = x;
    if(animated){
      carousel.classList.add('is-animating');
      setTimeout(()=>carousel.classList.remove('is-animating'),620);
    }
    carousel.style.transform = `translateX(-${x}px)`;
    updateUI();
  }
  function snapToCard(idx){
    idx = Math.max(0, Math.min(idx, total-1));
    current = idx;
    setOffset(idx*(cardWidth()+GAP), true);
  }
  function updateUI(){
    const step = cardWidth()+GAP;
    current = Math.max(0, Math.min(Math.round(currentOffset/step), total-1));
    fill.style.width = ((current+1)/total*100)+'%';
    countEl.textContent = String(current+1).padStart(2,'0')+' / '+String(total).padStart(2,'0');
    prevBtn.disabled = current===0;
    nextBtn.disabled = current===total-1;
  }
  prevBtn.addEventListener('click', ()=>{ stopAuto(); snapToCard(current-1); });
  nextBtn.addEventListener('click', ()=>{ stopAuto(); snapToCard(current+1); });

  function onDown(e){
    if(e.target.closest('.essay-link')) return;
    isDragging=true; startX=e.clientX; startOffset=currentOffset;
    lastX=e.clientX; lastTime=Date.now(); velocity=0;
    carousel.classList.add('is-dragging'); carousel.classList.remove('is-animating');
    carousel.setPointerCapture(e.pointerId);
  }
  function onMove(e){
    if(!isDragging) return;
    const now=Date.now(), dt=now-lastTime||1;
    velocity=(e.clientX-lastX)/dt; lastX=e.clientX; lastTime=now;
    const raw=startOffset+(startX-e.clientX);
    const clamped=Math.max(0,Math.min(raw,maxOffset()));
    setOffset(clamped+(raw-clamped)*0.15,false);
  }
  function onUp(){
    if(!isDragging) return;
    isDragging=false; carousel.classList.remove('is-dragging');
    const step=cardWidth()+GAP;
    let snapIdx=Math.round((currentOffset+(-velocity*180))/step);
    snapToCard(Math.max(0,Math.min(snapIdx,total-1)));
  }
  carousel.addEventListener('pointerdown', onDown);
  carousel.addEventListener('pointermove', onMove);
  carousel.addEventListener('pointerup', onUp);
  carousel.addEventListener('pointercancel', onUp);

  document.addEventListener('keydown', e=>{
    if(currentPage!=='essays') return;
    if(e.key==='ArrowRight'){ stopAuto(); snapToCard(current+1); }
    if(e.key==='ArrowLeft'){ stopAuto(); snapToCard(current-1); }
  });

  // Auto-motion
  const AUTO_DELAY=4200;
  let autoTimer=null, userPaused=false;
  function advanceAuto(){ snapToCard(current>=total-1?0:current+1); }
  function startAuto(){
    if(autoTimer||userPaused) return;
    autoTimer=setInterval(()=>{ if(currentPage==='essays' && !isDragging) advanceAuto(); }, AUTO_DELAY);
  }
  function stopAuto(){ clearInterval(autoTimer); autoTimer=null; }
  wrap.addEventListener('pointerenter', ()=>{ userPaused=true; stopAuto(); });
  wrap.addEventListener('pointerleave', ()=>{ userPaused=false; startAuto(); });

  window._startEssayAuto = startAuto;
  window._stopEssayAuto  = stopAuto;

  updateUI();
  if(currentPage==='essays') startAuto();
})();

/* ════════════════════════════════════════════════════════════════
   APPLE-STYLE LUXURY FLOW — engine
   ════════════════════════════════════════════════════════════════ */
(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Intro curtain dismiss ── */
  const curtain = document.getElementById('introCurtain');
  if(curtain){
    setTimeout(()=>curtain.classList.add('gone'), 3200);
  }

  /* ── Promote existing .reveal items to scale-reveal where appropriate ── */
  // Add `reveal-scale` to selected headline/image elements for the Apple-style scale up
  const scaleTargets = [
    '.hero-headline', '.contact-headline',
    '.about-page-headline', '.hotels-headline',
    '.step-project-title', '.essay-page-title',
    '.work-page-headline', '.writing-headline',
    '.project-featured', '.art-block', '.about-hero-image',
    '.hotel-card-img', '.essay-hero-image', '.essay-image'
  ];
  scaleTargets.forEach(sel=>{
    document.querySelectorAll(sel).forEach(el=>{
      // Skip elements that already have their own entrance animation
      if(el.classList.contains('hero-enter')) return;
      el.classList.add('reveal-scale');
    });
  });

  /* ── IntersectionObserver for .reveal-scale (per active page) ── */
  function observeScale(container){
    const items=container.querySelectorAll('.reveal-scale:not(.in)');
    if(!items.length) return;
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },{threshold:0.06, rootMargin:'0px 0px -8% 0px', root:container});
    items.forEach(el=>io.observe(el));
  }
  document.querySelectorAll('.page').forEach(p=>observeScale(p));

  /* ── Wrap showPage to re-observe new pages' reveal-scale items ── */
  const origShowPage = window.showPage;
  window.showPage = function(id, linkEl){
    origShowPage(id, linkEl);
    setTimeout(()=>{
      const pg = document.getElementById('page-'+id);
      if(pg){
        observeScale(pg);
        attachParallax(pg);
        updateProgress(pg);
      }
    }, 180);
  };

  /* ── Scroll progress hairline (tracks active page) ── */
  const progress = document.getElementById('scrollProgress');
  function updateProgress(pg){
    if(!pg || !progress) return;
    const max = pg.scrollHeight - pg.clientHeight;
    const pct = max>0 ? Math.min(100,(pg.scrollTop / max) * 100) : 0;
    progress.style.width = pct + '%';
    progress.classList.toggle('visible', pg.scrollTop > 40 && pct < 99);
  }

  /* ── Parallax: track elements with [data-parallax] inside the active page ── */
  let parallaxItems = [];
  function attachParallax(pg){
    parallaxItems = Array.from(pg.querySelectorAll('[data-parallax], #hero .hero-media'));
  }
  attachParallax(document.getElementById('page-'+currentPage));

  function runParallax(pg){
    if(reduceMotion) return;
    const vh = pg.clientHeight;
    const sTop = pg.scrollTop;
    parallaxItems.forEach(el=>{
      const r = el.getBoundingClientRect();
      // Page is fixed; getBoundingClientRect already reflects scroll
      const centerOffset = (r.top + r.height/2) - vh/2;
      const factor = parseFloat(getComputedStyle(el).getPropertyValue('--py-factor')) || 0.22;
      const py = -centerOffset * factor;
      el.style.setProperty('--py', py.toFixed(1) + 'px');
      // Hero media gets a subtle scale tied to its position too
      if(el.classList.contains('hero-media')){
        const t = Math.max(0, Math.min(1, sTop / vh));
        el.style.setProperty('--hs', (1.06 + t*0.04).toFixed(3));
      }
    });
  }

  /* ── Soft inertial smoothing on wheel (Apple-ish) ─────────────────
     We don't fully hijack — we just LERP the page.scrollTop a tiny
     bit toward the target. Touch / pointer scroll passes through. */
  const SMOOTH_LERP = reduceMotion ? 1 : 0.14; // 0 = no movement, 1 = instant
  const SMOOTH_GAIN = reduceMotion ? 1 : 1.1;  // wheel multiplier
  const pageState = new WeakMap();

  function smoothPage(pg){
    if(pageState.has(pg)) return;
    const state = { target: pg.scrollTop, raf:0 };
    pageState.set(pg, state);

    pg.addEventListener('wheel', e=>{
      if(reduceMotion) return;
      // Skip if user is interacting with carousel area (horizontal feel)
      if(e.target.closest('.essays-carousel')) return;
      // Only smooth standard wheel/trackpad — not pinch (ctrl)
      if(e.ctrlKey) return;
      e.preventDefault();
      state.target = Math.max(0, Math.min(state.target + e.deltaY * SMOOTH_GAIN, pg.scrollHeight - pg.clientHeight));
      if(!state.raf){
        const tick = ()=>{
          const cur = pg.scrollTop;
          const diff = state.target - cur;
          if(Math.abs(diff) < 0.5){
            pg.scrollTop = state.target;
            state.raf = 0;
            return;
          }
          pg.scrollTop = cur + diff * SMOOTH_LERP;
          state.raf = requestAnimationFrame(tick);
        };
        state.raf = requestAnimationFrame(tick);
      }
    }, { passive:false });

    // Sync target on regular scroll (touch / drag / keyboard / spacebar)
    let syncTimer;
    pg.addEventListener('scroll', ()=>{
      if(!state.raf) state.target = pg.scrollTop;
      // Throttle progress + parallax
      clearTimeout(syncTimer);
      syncTimer = setTimeout(()=>{}, 1);
    }, { passive:true });
  }
  document.querySelectorAll('.page').forEach(smoothPage);

  /* ── Single rAF loop for progress + parallax on active page ── */
  function loop(){
    const pg = document.getElementById('page-'+currentPage);
    if(pg){
      updateProgress(pg);
      runParallax(pg);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ── Magnetic effect on luxury CTAs ── */
  const magnets = document.querySelectorAll(
    '.contact-email, .text-link, .carousel-btn, .essay-link, .hero-scroll'
  );
  magnets.forEach(el=>{
    el.classList.add('magnetic');
    el.addEventListener('pointermove', e=>{
      if(reduceMotion) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width/2);
      const y = e.clientY - (r.top + r.height/2);
      const max = 8;
      const tx = Math.max(-max, Math.min(max, x * 0.25));
      const ty = Math.max(-max, Math.min(max, y * 0.4));
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    });
    el.addEventListener('pointerleave', ()=>{
      el.style.transform = '';
    });
  });

  /* ── Glow cursor (desktop only) ── */
  const cursor = document.getElementById('glowCursor');
  if(cursor && window.matchMedia('(pointer:fine)').matches && !reduceMotion){
    let cx=0, cy=0, tx=0, ty=0;
    window.addEventListener('pointermove', e=>{
      tx = e.clientX; ty = e.clientY;
      if(!cursor.classList.contains('visible')) cursor.classList.add('visible');
    });
    window.addEventListener('pointerleave', ()=>cursor.classList.remove('visible'));
    function cursorTick(){
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate3d(${cx-9}px, ${cy-9}px, 0)`;
      requestAnimationFrame(cursorTick);
    }
    cursorTick();

    // Bigger over interactive elements
    const enlarge = 'a, button, .hotel-card, .project-featured, .project-grid-item, .essay-card, .magnetic, .subnav-tab, .essays-carousel';
    document.addEventListener('pointerover', e=>{
      if(e.target.closest(enlarge)) cursor.classList.add('over-link');
      else cursor.classList.remove('over-link');
    });
  }

  /* ── Refined hero scroll cue: fade as you scroll past first page of hero ── */
  const heroScrollCue = document.querySelector('.hero-scroll');
  if(heroScrollCue){
    const pg = document.getElementById('page-main');
    pg.addEventListener('scroll', ()=>{
      const t = Math.max(0, Math.min(1, pg.scrollTop / 240));
      heroScrollCue.style.opacity = (1 - t).toFixed(2);
    }, { passive:true });
  }

  /* ── Tweak: keyboard nav between pages (luxury detail) ── */
  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape' && currentPage !== 'main'){
      window.showPage('main');
    }
  });

  /* ── Legacy hash links (#about etc.) redirect to real pages ── */
  (function(){var h=(location.hash||'').replace('#','');if(h&&ROUTES[h]&&ROUTES[h]!==location.pathname){location.replace(ROUTES[h]);}})();

  /* ── PINNED COMMITMENTS — image swap as you scroll ── */
  (function(){
    const sec = document.getElementById('commitmentsPinned');
    if(!sec) return;
    const panels = sec.querySelectorAll('.cp-panel');
    const imgs = sec.querySelectorAll('.cp-img');
    const counter = document.getElementById('cpCounter');
    const labelEl = document.getElementById('cpLabel');
    const fill = document.getElementById('cpProgressFill');
    let activeIdx = 0;

    function setActive(i){
      if(i === activeIdx) return;
      activeIdx = i;
      imgs.forEach((el, idx)=> el.classList.toggle('is-active', idx===i));
      if(counter) counter.textContent = String(i+1).padStart(2,'0') + ' / 05';
      const p = panels[i];
      if(labelEl && p){
        const lbl = p.getAttribute('data-label') || '';
        labelEl.style.opacity = '0';
        setTimeout(()=>{ labelEl.textContent = lbl; labelEl.style.opacity = ''; }, 220);
      }
    }

    function updatePinned(){
      const vh = window.innerHeight;
      // Find panel whose center is closest to viewport center
      let bestI = 0, bestDist = Infinity;
      panels.forEach((p, i)=>{
        const r = p.getBoundingClientRect();
        const center = r.top + r.height/2;
        const dist = Math.abs(center - vh/2);
        if(dist < bestDist){ bestDist = dist; bestI = i; }
        // Reveal panel when its top enters the lower 80% of viewport
        if(r.top < vh * 0.85 && r.bottom > 0){
          p.classList.add('in-view');
        }
      });
      setActive(bestI);

      // Progress fill
      const sr = sec.getBoundingClientRect();
      const total = sr.height - vh;
      const passed = -sr.top;
      const pct = Math.max(0, Math.min(100, (passed / total) * 100));
      if(fill) fill.style.height = pct + '%';
    }

    // Hook into the global rAF loop by piggybacking on scroll events
    const pg = sec.closest('.page');
    if(pg){
      pg.addEventListener('scroll', updatePinned, { passive:true });
    }
    window.addEventListener('resize', updatePinned);
    // initial state once page becomes active
    setTimeout(updatePinned, 200);
    // re-run after page transitions
    const origShow = window.showPage;
    window.showPage = function(id, linkEl){
      origShow(id, linkEl);
      if(id === 'about') setTimeout(updatePinned, 400);
    };
  })();

})();

/* ── MOBILE NAV — hamburger menu (injected on every page) ── */
(function(){
  var nav = document.getElementById('nav');
  if(!nav) return;
  var links = nav.querySelector('.nav-links');
  if(!links) return;
  // Build hamburger button
  var btn = document.createElement('button');
  btn.className = 'nav-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Open menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(btn);
  links.id = links.id || 'navLinks';
  btn.setAttribute('aria-controls', links.id);

  function setOpen(open){
    nav.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-open', open);
  }
  btn.addEventListener('click', function(){ setOpen(!nav.classList.contains('menu-open')); });
  // Close when a menu link is tapped
  links.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ setOpen(false); });
  });
  // Close on Escape
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && nav.classList.contains('menu-open')) setOpen(false);
  });
})();
