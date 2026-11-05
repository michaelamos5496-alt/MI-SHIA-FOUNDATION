/* =====================================================================
   Mi Shia Foundation: GSAP scroll animations and effects
   Loaded after the page (see the loader in index.html), and only for
   visitors who have not asked for less motion or a data saver.
   Needs: gsap + ScrollTrigger. Lenis (smooth scrolling) is optional.
   ===================================================================== */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });
  var root = document.documentElement;
  root.classList.add('gsap-on');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var refresh = function () { ScrollTrigger.refresh(); };

  /* ------------------------------------------------------------------
     0. Smooth scrolling (Lenis) on computers with a mouse
     ------------------------------------------------------------------ */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (window.Lenis && fine) {
    var lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('dialog').forEach(function (d) { d.setAttribute('data-lenis-prevent', ''); });
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      if (id === '#top' || id === '#home') { e.preventDefault(); lenis.scrollTo(0, { duration: 1.4 }); return; }
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      window.__scrollToEl(t);
    });
  }

  /* things that change the page height need ScrollTrigger to measure again */
  var panel = $('#mission-panel');
  if (panel) panel.addEventListener('transitionend', function (e) { if (e.propertyName === 'grid-template-rows') refresh(); });
  $$('[role="tab"], #founder-more').forEach(function (b) { b.addEventListener('click', function () { setTimeout(refresh, 90); }); });
  window.addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);

  /* ------------------------------------------------------------------
     helpers
     ------------------------------------------------------------------ */
  // the plain fade-in (.reveal) steps aside for elements GSAP animates
  function take(list) {
    list.forEach(function (el) {
      if (!el) return;
      el.classList.remove('reveal', 'in', 'done');
      el.style.transitionDelay = '';
    });
  }
  // animate in, with CSS transitions switched off while it runs, then hand control back to the CSS
  function rise(els, vars) {
    els = [].concat(els).filter(Boolean);
    if (!els.length) return null;
    els.forEach(function (el) { el.classList.add('gs-busy'); });
    var done = vars.onComplete;
    vars.onComplete = function () {
      els.forEach(function (el) { el.classList.remove('gs-busy'); });
      gsap.set(els, { clearProps: 'transform,opacity,visibility' });
      if (done) done();
    };
    return gsap.from(els, vars);
  }
  // wrap every word of an element (keeping child tags such as the highlight)
  function splitWords(root, kind) {
    var out = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.textContent = p;
            if (kind === 'mask') {
              var m = document.createElement('span'); m.className = 'w-mask';
              w.className = 'w'; m.appendChild(w); frag.appendChild(m);
            } else { w.className = 'rw'; frag.appendChild(w); }
            out.push(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && !ch.classList.contains('w-mask') && !ch.classList.contains('rw')) {
          walk(ch);
        }
      });
    })(root);
    return out;
  }

  /* ------------------------------------------------------------------
     1. Scroll progress line across the top
     ------------------------------------------------------------------ */
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.15 } });

  /* ------------------------------------------------------------------
     split text once (headlines rise out of masks, paragraphs fill in word by word)
     ------------------------------------------------------------------ */
  var heads = [];
  ['.about-title', '.mission-head h2', '.act-head h2', '.sb-content h2', '.founder-copy h2', '.media-head h2', '.contact-head h2']
    .forEach(function (sel) { var el = $(sel); if (el) heads.push({ el: el, words: splitWords(el, 'mask') }); });
  var paras = [];
  ['.lede', '.mission-head p:not(.eyebrow)', '.founder-bio > p:first-child', '.act-head p:not(.eyebrow)']
    .forEach(function (sel) { var el = $(sel); if (el) paras.push({ el: el, words: splitWords(el, 'rw') }); });

  /* ------------------------------------------------------------------
     everything below adapts: computers get the full set, phones a lighter one
     ------------------------------------------------------------------ */
  var mm = gsap.matchMedia();
  mm.add({ desk: '(min-width: 721px)', phone: '(max-width: 720px)' }, function (ctx) {
    var desk = ctx.conditions.desk;

    /* 2. Hero: as you scroll away, the title zooms toward you, the words lift off,
          and the background photo slides */
    var hero = $('#home');
    if (hero) {
      var tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      tl.to('.hero .title', { scale: desk ? 1.22 : 1.12, yPercent: -5, opacity: 0.1, ease: 'none' }, 0)
        .to('.hero .welcome', { y: -80, opacity: 0, ease: 'none' }, 0)
        .to('.hero .cta', { y: -130, opacity: 0, ease: 'none' }, 0)
        .fromTo(hero, { '--bgy': '52%' }, { '--bgy': '78%', ease: 'none' }, 0);
    }

    /* 3. Headlines: every word rises out of its own mask */
    heads.forEach(function (h) {
      gsap.from(h.words, {
        yPercent: 118, rotate: 4, transformOrigin: '0% 100%', duration: 1.15, ease: 'power4.out', stagger: 0.07,
        scrollTrigger: { trigger: h.el, start: 'top 88%' }
      });
    });

    /* 4. Paragraphs: words light up one by one as you scroll through them */
    paras.forEach(function (p) {
      gsap.to(p.words, {
        opacity: 1, ease: 'none', stagger: 1,
        scrollTrigger: { trigger: p.el, start: 'top 84%', end: 'bottom 54%', scrub: true }
      });
    });

    /* 5. About: the Ghana map swings in, the brush strokes slide on, the badge pops and counts up */
    var am = $('.about-map');
    if (am) {
      take([am, $('.about-copy')]);
      gsap.from('.about-map .ghana', { scale: 0.7, rotate: -6, opacity: 0, transformOrigin: '60% 55%', duration: 1.5, ease: 'power3.out', scrollTrigger: { trigger: am, start: 'top 80%' } });
      gsap.from('.about-map .ghana > path', { x: -90, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: 0.12, delay: 0.25, scrollTrigger: { trigger: am, start: 'top 80%' } });
      gsap.from('.about-map .badge', { scale: 0, rotate: -25, duration: 1, ease: 'back.out(2.4)', delay: 0.7, scrollTrigger: { trigger: am, start: 'top 80%' } });
      var year = $('.badge strong');
      if (year) {
        var target = parseInt(year.textContent, 10) || 2019, o = { n: target - 29 };
        year.textContent = o.n;
        gsap.to(o, { n: target, duration: 1.8, ease: 'power2.out', snap: { n: 1 }, delay: 0.8,
          onUpdate: function () { year.textContent = o.n; },
          scrollTrigger: { trigger: am, start: 'top 80%' } });
      }
      gsap.from('.about-cta', { y: 36, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.about-cta', start: 'top 92%' } });
    }
    var pill = $$('.pillars article');
    if (pill.length) { take(pill); rise(pill, { y: 60, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.pillars', start: 'top 94%' } }); }

    /* 6. Mission, vision, objectives: the cards deal in */
    var mv = $$('.mv-card');
    if (mv.length) { take(mv); rise(mv, { y: 90, rotate: function (i) { return [-3, 2, -2][i] || 0; }, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.14, scrollTrigger: { trigger: '.mv-grid', start: 'top 86%' } }); }

    /* 7. Activities: cards fly in at slight angles */
    var ac = $$('.act-card');
    if (ac.length) {
      take(ac);
      rise(ac, { y: desk ? 130 : 70, rotate: function (i) { return [-6, 4, -4, 6, -2][i] || 0; }, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: 0.13, scrollTrigger: { trigger: '.act-grid', start: 'top 84%' } });
    }

    /* 9. Support banner: it opens up like a curtain while the photo drifts and the words follow */
    var sb = $('.sb');
    if (sb) {
      take([sb]);
      gsap.fromTo(sb, { clipPath: 'inset(11% 9% 11% 9% round 46px)' }, { clipPath: 'inset(0% 0% 0% 0% round 34px)', ease: 'none',
        scrollTrigger: { trigger: sb, start: 'top 96%', end: 'top 38%', scrub: true } });
      gsap.fromTo('.sb-photo', { yPercent: -5, scale: 1.26 }, { yPercent: 5, scale: 1.14, ease: 'none',
        scrollTrigger: { trigger: sb, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from('.sb-content > *', { y: 50, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: sb, start: 'top 58%' } });
    }

    /* 10. Founder: the photos fly in from different sides, the brush strokes paint on */
    var col = $('.collage');
    if (col) {
      take([col, $('.founder-copy')]);
      rise($$('.ph', col), {
        y: 170, x: function (i) { return [-130, 50, 150, -70][i] || 0; }, rotate: function (i) { return [-14, 8, 12, -10][i] || 0; },
        scale: 0.74, opacity: 0, duration: 1.35, ease: 'power3.out', stagger: 0.15,
        scrollTrigger: { trigger: col, start: 'top 82%' }
      });
      gsap.from($$('.fs', col), { scaleX: 0, transformOrigin: '0% 50%', duration: 1.1, ease: 'power3.out', stagger: 0.22, delay: 0.5, scrollTrigger: { trigger: col, start: 'top 82%' } });
      gsap.from('.founder-bio, .founder-cta', { y: 50, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.14, scrollTrigger: { trigger: '.founder-copy', start: 'top 70%' } });
    }

    /* 11. Photos inside frames slowly zoom out while they pass */
    $$('.ph img, .gal-item img').forEach(function (img) {
      gsap.fromTo(img, { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* 12. Media: the pictures pop in, scattered */
    var gal = $$('.gal-item');
    if (gal.length) { take(gal); rise(gal, { y: 70, scale: 0.88, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: { amount: 0.8, from: 'random' }, scrollTrigger: { trigger: '.gallery', start: 'top 86%' } }); }

    /* 13. Contact: the map pin drops in and bounces, the map slides under the panel */
    if ($('.map-pin')) {
      gsap.from('.map-pin', { y: -160, opacity: 0, duration: 1.4, ease: 'bounce.out', scrollTrigger: { trigger: '.contact', start: 'top 66%' } });
      gsap.fromTo('.tilebox', { y: -40 }, { y: 40, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true } });
    }

    /* 14. Footer: the panel opens like a curtain and the giant wordmark comes down into place */
    if ($('.sf-panel')) {
      gsap.fromTo('.sf-panel', { clipPath: 'inset(12% 5% 0% 5% round 70px 70px 0 0)' }, { clipPath: 'inset(0% 0% 0% 0% round 64px 64px 0 0)', ease: 'none',
        scrollTrigger: { trigger: '.sitefoot', start: 'top bottom', end: 'top 35%', scrub: true } });
      gsap.fromTo('.sf-word span', { yPercent: -72 }, { yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: '.sitefoot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    }

    /* 15. Magnetic buttons (computers with a mouse only) */
    if (desk && fine) {
      $$('.btn, .discover-btn, .sb-btn, .sf-next, .sf-go').forEach(function (el) {
        el.classList.add('mag');
        var qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
        var qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          qx((e.clientX - (r.left + r.width / 2)) * 0.28);
          qy((e.clientY - (r.top + r.height / 2)) * 0.4);
        });
        el.addEventListener('pointerleave', function () { qx(0); qy(0); });
      });
    }

    return function () { /* GSAP undoes the tweens and triggers made above when the screen size class changes */ };
  });

  refresh();
})();
