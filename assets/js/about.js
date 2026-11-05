// About page: sticky-nav background on scroll + reveal-on-scroll
(function () {
  var nav = document.querySelector('.nav');
  function onScroll() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function (el) { io.observe(el); });
})();

// Phones: slider dots for the swipe rows (four essentials, and mission / vision / objectives)
(function () {
  function makeSlider(track, itemSel, gap) {
    var cards = track.querySelectorAll(itemSel);
    if (!cards.length) return;
    var dots = document.createElement('div');
    dots.className = 'pillar-dots';
    cards.forEach(function (card) {
      var b = document.createElement('button');
      b.type = 'button';
      var label = card.querySelector('h3, .eyebrow');
      b.setAttribute('aria-label', 'Show ' + (label ? label.textContent : 'slide'));
      b.addEventListener('click', function () {
        track.scrollTo({ left: card.offsetLeft - track.offsetLeft - 20, behavior: 'smooth' });
      });
      dots.appendChild(b);
    });
    track.parentNode.insertBefore(dots, track.nextSibling);
    var buttons = dots.querySelectorAll('button');
    function sync() {
      var step = cards[0].offsetWidth + gap;
      var i = Math.min(cards.length - 1, Math.max(0, Math.round(track.scrollLeft / step)));
      buttons.forEach(function (b, n) { b.classList.toggle('on', n === i); });
    }
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }
  window.__makeSlider = makeSlider;
  makeSlider(document.querySelector('.pillars'), 'article', 14);
  var mv = document.querySelector('.mv-grid');
  if (mv) makeSlider(mv, '.mv-card', 14);
  var act = document.querySelector('.act-grid');
  if (act) makeSlider(act, '.act-card', 14);
})();

// Discover: expand / collapse the mission, vision and objectives
(function () {
  var btn = document.getElementById('discover-toggle');
  var panel = document.getElementById('mission-panel');
  if (!btn || !panel) return;
  var label = btn.querySelector('.lbl');

  function setOpen(open, scroll) {
    panel.classList.toggle('open', open);
    panel.inert = !open;
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    label.textContent = open ? 'Show less' : 'Discover';
    if (!scroll) return;
    var target = open ? document.getElementById('mission') : document.getElementById('about');
    // scroll once the panel has started to open, and again when it has finished growing
    setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 90);
    if (open) {
      var done = function (e) {
        if (e.propertyName !== 'grid-template-rows') return;
        panel.removeEventListener('transitionend', done);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      panel.addEventListener('transitionend', done);
    }
  }

  setOpen(false, false);
  btn.addEventListener('click', function () { setOpen(!panel.classList.contains('open'), true); });
  // always start collapsed on load / refresh, even if the address still ends in #mission
  if (location.hash === '#mission' && window.history && history.replaceState) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  document.querySelectorAll('a[href="#mission"]').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(true, true); });
  });
})();

// Founder (phones): "Read more" shows the rest of the bio
(function () {
  var btn = document.getElementById('founder-more');
  var section = document.getElementById('founder');
  if (!btn || !section) return;
  btn.addEventListener('click', function () {
    var open = section.classList.toggle('expanded');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Show less' : 'Read more';
  });
})();

// Media: tabs, picture viewer and article reader
(function () {
  var section = document.getElementById('media');
  if (!section) return;
  var tabs = Array.prototype.slice.call(section.querySelectorAll('[role="tab"]'));
  var panels = {};
  tabs.forEach(function (t) { panels[t.dataset.tab] = document.getElementById(t.getAttribute('aria-controls')); });

  function showTab(name, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    Object.keys(panels).forEach(function (k) { panels[k].hidden = k !== name; });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showTab(t.dataset.tab); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      showTab(n.dataset.tab, true);
    });
  });
  section.querySelectorAll('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.dataset.goto); });
  });

  // nav links: Media > Pictures / Videos / News
  ['pictures', 'videos', 'news'].forEach(function (name) {
    document.querySelectorAll('a[href="#' + name + '"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        showTab(name);
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });
  var h = (location.hash || '').replace('#', '');
  if (panels[h]) showTab(h);

  // picture viewer
  var box = document.getElementById('lightbox');
  var items = Array.prototype.slice.call(section.querySelectorAll('.gal-item'));
  var cur = 0;
  function showPic(i) {
    cur = (i + items.length) % items.length;
    var it = items[cur];
    document.getElementById('lb-img').src = it.dataset.full;
    document.getElementById('lb-img').alt = it.dataset.caption;
    document.getElementById('lb-cap').textContent = it.dataset.caption + '  (' + (cur + 1) + ' / ' + items.length + ')';
  }
  if (box && box.showModal) {
    items.forEach(function (it, i) {
      it.addEventListener('click', function () { showPic(i); box.showModal(); });
    });
    box.querySelector('.lb-close').addEventListener('click', function () { box.close(); });
    box.querySelector('.lb-prev').addEventListener('click', function () { showPic(cur - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { showPic(cur + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') showPic(cur - 1);
      if (e.key === 'ArrowRight') showPic(cur + 1);
    });
    // swipe left / right on a phone
    var tx = null;
    box.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 50) showPic(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  // article reader
  var reader = document.getElementById('reader');
  if (reader && reader.showModal) {
    section.querySelectorAll('[data-article]').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = b.closest('.news-card');
        document.getElementById('reader-tag').innerHTML = card.querySelector('.news-tag').innerHTML;
        document.getElementById('reader-title').textContent = card.querySelector('h3').textContent;
        document.getElementById('reader-body').innerHTML = document.getElementById(b.dataset.article).innerHTML;
        reader.showModal();
      });
    });
    reader.querySelector('.lb-close').addEventListener('click', function () { reader.close(); });
    reader.addEventListener('click', function (e) { if (e.target === reader) reader.close(); });
  }

  // phones: swipe dots for the news cards
  var ng = section.querySelector('.news-grid');
  if (ng && window.__makeSlider) window.__makeSlider(ng, '.news-card', 14);
})();

// Contact: step-by-step form (sends through the visitor's email app) + live map of Accra
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var TO = 'info@mishiafoundation.org';
  var steps = Array.prototype.slice.call(form.querySelectorAll('.sf-step'));
  var dots = Array.prototype.slice.call(form.querySelectorAll('.sf-dots li'));
  var next = document.getElementById('sf-next');
  var nextLabel = document.getElementById('sf-next-label');
  var status = document.getElementById('f-status');
  var cur = 0, reached = 0;

  function show(i, focus) {
    cur = i; if (i > reached) reached = i;
    steps.forEach(function (s, n) { s.classList.toggle('is-active', n === i); });
    dots.forEach(function (d, n) {
      d.classList.toggle('on', n === i);
      d.classList.toggle('done', n < i || (n <= reached && n !== i));
      d.querySelector('button').disabled = n > reached;
    });
    nextLabel.textContent = i === steps.length - 1 ? 'Send' : 'Next';
    status.textContent = ''; status.classList.remove('err');
    if (focus !== false) {
      var f = steps[i].querySelector('input[type="text"],input[type="email"],input[type="tel"],textarea,input:checked');
      if (f) f.focus({ preventScroll: true });
    }
  }
  function valid(i) {
    var s = steps[i], f = s.querySelector('input[type="text"],input[type="email"],textarea');
    if (!f || !f.required) { return true; }
    var v = f.value.trim();
    var ok = !!v && (f.type !== 'email' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v));
    f.classList.toggle('bad', !ok);
    if (!ok) {
      status.classList.add('err');
      status.textContent = f.type === 'email' ? 'Please enter a valid email address.' : 'Please fill this in to continue.';
    }
    return ok;
  }
  function send() {
    var f = form.elements;
    var enq = form.querySelector('input[name="enquiry"]:checked').value;
    var body = 'Name: ' + f.name.value.trim() + '\nPhone: ' + (f.phone.value.trim() || '-') +
               '\nEmail: ' + f.email.value.trim() + '\nEnquiry: ' + enq + '\n\n' + f.message.value.trim();
    window.location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent(enq + ' from ' + f.name.value.trim()) +
                           '&body=' + encodeURIComponent(body);
    status.textContent = 'Your email app should open with your message ready. If it does not, write to ' + TO + '.';
  }
  function advance() {
    if (!valid(cur)) return;
    if (cur < steps.length - 1) show(cur + 1); else send();
  }
  next.addEventListener('click', advance);
  form.addEventListener('submit', function (e) { e.preventDefault(); advance(); });
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'radio') { e.preventDefault(); advance(); }
  });
  dots.forEach(function (d, n) {
    d.querySelector('button').addEventListener('click', function () { if (n <= reached) show(n); });
  });
  show(0, false);

})();

// Footer: the time in Accra and the visitor's own time
(function () {
  var a = document.getElementById('foot-time'), y = document.getElementById('foot-you');
  if (!a && !y) return;
  var opts = { hour: '2-digit', minute: '2-digit', hour12: true };
  var accra, you;
  try {
    accra = new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: 'Africa/Accra' }, opts));
    you = new Intl.DateTimeFormat('en-GB', opts);
  } catch (e) { return; }
  function tick() {
    var now = new Date();
    if (a) a.textContent = accra.format(now).toUpperCase();
    if (y) y.textContent = you.format(now).toUpperCase();
  }
  tick(); setInterval(tick, 15000);
})();

// Hero video: it plays by default. It is switched off only for data-saver / slow connections,
// and it pauses while it is off screen to save battery.
(function () {
  var v = document.querySelector('.title video');
  if (!v) return;
  var c = navigator.connection || {};
  var saver = c.saveData || /(^|-)2g$/.test(c.effectiveType || '');
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (saver || still) {                 // keep the poster picture (and skip the 13 MB download)
    v.removeAttribute('autoplay'); v.pause();
    v.preload = 'none';
    var s = v.querySelector('source'); if (s) { s.removeAttribute('src'); v.load(); }
    return;
  }
  v.muted = true;
  var box = v.closest('.title');
  function shown() { if (box) box.classList.add('is-playing'); }
  v.addEventListener('playing', shown);
  if (!v.paused && v.readyState > 2) shown();                    // it may have started before this script ran
  var p = v.play(); if (p && p.catch) p.catch(function () {});   // helps browsers that ignore autoplay
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { var q = v.play(); if (q && q.catch) q.catch(function () {}); } else { v.pause(); }
      });
    }, { threshold: 0.05 }).observe(v);
  }
})();

// ===== Motion: stagger, word reveal, photo zoom, hero drift, footer wordmark =====
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;                       // people who asked for less motion get none of this
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var vh = function () { return window.innerHeight || document.documentElement.clientHeight; };

  // 1. stagger siblings that fade in together (cards in a row, gallery pictures, ...)
  var counts = new Map();
  document.querySelectorAll('.reveal').forEach(function (el) {
    var group = el.closest('ul, ol, .act-grid, .mv-grid, .pillars, .gallery, .news-grid') || el.parentElement;
    var n = counts.get(group) || 0;
    counts.set(group, n + 1);
    if (n > 0) el.style.transitionDelay = Math.min(n, 6) * 90 + 'ms';
    // once it has appeared, drop the delay and the slow curve so hover effects feel instant
    el.addEventListener('transitionend', function (e) {
      if (e.propertyName !== 'opacity' || !el.classList.contains('in')) return;
      el.style.transitionDelay = '';
      el.classList.add('done');
    });
  });

  // 2. split key paragraphs into words
  var wordBlocks = [];
  document.querySelectorAll('.founder-bio > p:first-child, .mission-head p:not(.eyebrow)').forEach(function (p) {
    var words = p.textContent.trim().split(/\s+/);
    p.innerHTML = words.map(function (w) { return '<span class="rw">' + w + '</span>'; }).join(' ');
    wordBlocks.push({ el: p, words: p.querySelectorAll('.rw'), lit: 0 });
  });

  // 3. photos that zoom out while scrolling past
  var zoomEls = Array.prototype.slice.call(document.querySelectorAll('.sb-photo, .ph img, .gal-item img'));
  var visible = new Set();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
    }, { rootMargin: '120px' });
    zoomEls.forEach(function (el) { io.observe(el); });
  }

  var title = document.querySelector('.title');
  var foot = document.querySelector('.sitefoot');
  var word = document.querySelector('.sf-word span');

  function update() {
    var h = vh(), y = window.pageYOffset || 0;

    // 4. hero title drifts down a little slower than the page
    if (title && y < h * 1.3) title.style.setProperty('--drift', (y * 0.22).toFixed(1) + 'px');

    // 2. light up words as the paragraph rises through the screen
    wordBlocks.forEach(function (b) {
      var top = b.el.getBoundingClientRect().top;
      var p = clamp((h * 0.88 - top) / (h * 0.42), 0, 1);
      var lit = Math.round(p * b.words.length);
      if (lit === b.lit) return;
      for (var i = Math.min(lit, b.lit); i < Math.max(lit, b.lit); i++) b.words[i].classList.toggle('on', i < lit);
      b.lit = lit;
    });

    // 3. photo zoom: 1.12 -> 1 across the time the photo is on screen (gentler on phones)
    var max = window.innerWidth < 720 ? 1.07 : 1.12;
    visible.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      var t = clamp((h - r.top) / (h + r.height), 0, 1);
      el.style.setProperty('--pz', (max - (max - 1) * t).toFixed(4));
    });

    // 5. footer wordmark descends as the footer comes into view
    if (foot && word) {
      var fr = foot.getBoundingClientRect();
      var fp = clamp((h - fr.top) / (fr.height * 0.9), 0, 1);
      word.style.setProperty('--wy', (-(1 - fp) * 60).toFixed(1) + '%');
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    window.requestAnimationFrame(function () { ticking = false; update(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', update);
  update();
})();
