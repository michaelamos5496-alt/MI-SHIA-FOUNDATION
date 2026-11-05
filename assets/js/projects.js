// Project map: pins <-> project cards, photo viewer, press article, print.
(function () {
  var sec = document.getElementById('projects');
  if (!sec) return;
  var map = sec.querySelector('.pm-map');
  var cards = [].slice.call(sec.querySelectorAll('.pm-card'));
  var pins = [].slice.call(sec.querySelectorAll('.pm-pin'));

  // position pins from real coordinates on the saved z12 tile grid
  if (map) {
    var z = +map.dataset.z, x0 = +map.dataset.x0, y0 = +map.dataset.y0, w = +map.dataset.w, h = +map.dataset.h, n = Math.pow(2, z);
    pins.forEach(function (p) {
      var lat = +p.dataset.lat * Math.PI / 180, lon = +p.dataset.lon;
      var x = (lon + 180) / 360 * n;
      var y = (1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2 * n;
      p.style.left = ((x - x0) / w * 100).toFixed(2) + '%';
      p.style.top = ((y - y0) / h * 100).toFixed(2) + '%';
    });
  }

  // zoom the map onto a project's pin and show its area as a ring (~1.2 km radius)
  var stage = sec.querySelector('.pm-stage'), ring = sec.querySelector('.pm-ring'), reset = sec.querySelector('.pm-reset');
  var ZOOM = 2.6;
  function zoomTo(pin) {
    if (!map || !stage) return;
    var W = map.clientWidth, H = map.clientHeight;
    if (!pin) {
      stage.style.transform = '';
      map.style.setProperty('--pz', 1);
      map.classList.remove('is-zoomed');
      if (reset) reset.hidden = true;
      return;
    }
    var px = parseFloat(pin.style.left) / 100 * W, py = parseFloat(pin.style.top) / 100 * H;
    stage.style.transform = 'translate(' + (W / 2 - px * ZOOM).toFixed(1) + 'px,' + (H / 2 - py * ZOOM).toFixed(1) + 'px) scale(' + ZOOM + ')';
    map.style.setProperty('--pz', ZOOM);
    // metres per pixel at this latitude, z12 tiles shown at W / 3 css px per tile
    var lat = +pin.dataset.lat, mpp = 156543.03 * Math.cos(lat * Math.PI / 180) / Math.pow(2, 12) * 256 / (W / 3);
    var r = 1200 / mpp;
    ring.style.left = pin.style.left; ring.style.top = pin.style.top;
    ring.style.width = ring.style.height = (r * 2) + 'px';
    map.classList.add('is-zoomed');
    if (reset) reset.hidden = false;
  }
  if (reset) reset.addEventListener('click', function () { zoomTo(null); pins.forEach(function (p) { p.classList.remove('is-on'); }); cards.forEach(function (c) { setOpen(c, false); }); });
  window.addEventListener('resize', function () { var on = sec.querySelector('.pm-pin.is-on'); if (on && map.classList.contains('is-zoomed')) zoomTo(on); });

  function setOpen(card, open) {
    var b = card.querySelector('.pm-head-btn');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    card.classList.toggle('is-open', open);
    pins.forEach(function (p) {
      if (p.dataset.for === card.id.replace('proj-', '')) p.classList.toggle('is-on', open);
    });
  }
  function select(card) {
    cards.forEach(function (c) { if (c !== card) setOpen(c, false); });
    var pin0 = sec.querySelector('.pm-pin[data-for="' + card.id.replace('proj-', '') + '"]');
    var open = !card.classList.contains('is-open') || (pin0 && !map.classList.contains('is-zoomed'));
    setOpen(card, open);
    zoomTo(open ? sec.querySelector('.pm-pin[data-for="' + card.id.replace('proj-', '') + '"]') : null);
    if (window.ScrollTrigger) setTimeout(function () { window.ScrollTrigger.refresh(); }, 420);
  }
  cards.forEach(function (c) {
    c.querySelector('.pm-head-btn').addEventListener('click', function () { select(c); });
  });
  pins.forEach(function (p) {
    p.addEventListener('click', function () {
      var c = document.getElementById('proj-' + p.dataset.for);
      if (!c) return;
      if (!c.classList.contains('is-open')) select(c);
      else { setOpen(c, true); zoomTo(p); }
      var head = c.querySelector('.pm-head-btn');
      // on phones the list is below the map, so bring the card into view
      if (window.matchMedia('(max-width: 980px)').matches) {
        if (window.__scrollToEl) window.__scrollToEl(c); else c.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      head.focus({ preventScroll: true });
    });
  });
  if (cards[0]) setOpen(cards[0], true);  // first card open, map stays zoomed out until a project is chosen
  pins.forEach(function (p) { p.classList.remove('is-on'); });

  // photo viewer (own dialog, so it never mixes with the Media gallery)
  var box = document.getElementById('pm-viewer');
  var set = [], cur = 0;
  function show(i) {
    cur = (i + set.length) % set.length;
    var b = set[cur];
    document.getElementById('pm-img').src = b.dataset.full;
    document.getElementById('pm-img').alt = b.dataset.caption;
    document.getElementById('pm-cap').textContent = b.dataset.caption + (set.length > 1 ? '  (' + (cur + 1) + ' / ' + set.length + ')' : '');
  }
  if (box && box.showModal) {
    sec.querySelectorAll('.pm-photo').forEach(function (b) {
      b.addEventListener('click', function () {
        set = [].slice.call(b.parentNode.querySelectorAll('.pm-photo'));
        show(set.indexOf(b));
        var many = set.length > 1;
        box.querySelector('.lb-prev').hidden = !many;
        box.querySelector('.lb-next').hidden = !many;
        box.showModal();
      });
    });
    box.querySelector('.lb-close').addEventListener('click', function () { box.close(); });
    box.querySelector('.lb-prev').addEventListener('click', function () { show(cur - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { show(cur + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
  }

  // press article: reuse the article text already on the page
  var reader = document.getElementById('reader');
  sec.querySelectorAll('.pm-article').forEach(function (b) {
    b.addEventListener('click', function () {
      var src = document.getElementById(b.dataset.article);
      if (!reader || !reader.showModal || !src) return;
      document.getElementById('reader-tag').textContent = 'News';
      document.getElementById('reader-title').textContent = 'Orange Sanitary Pads collaborates with Mi Shia Foundation to promote Menstrual Hygiene';
      document.getElementById('reader-body').innerHTML = src.innerHTML;
      reader.showModal();
    });
  });

  // print / save as PDF: only this section, every project open
  var pbtn = sec.querySelector('.pm-print');
  var d = document.getElementById('pm-date');
  if (pbtn) {
    pbtn.addEventListener('click', function () {
      if (d) d.textContent = 'Printed ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + location.host + location.pathname.replace(/index\.html$/, '');
      document.body.classList.add('print-projects');
      window.print();
    });
    window.addEventListener('afterprint', function () { document.body.classList.remove('print-projects'); });
  }
})();
