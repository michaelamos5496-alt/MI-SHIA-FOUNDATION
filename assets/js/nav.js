// Mobile menu toggle
(function () {
  var nav = document.querySelector('.nav');
  var btn = document.querySelector('.menu-toggle');
  if (!nav || !btn) return;
  function setOpen(open) {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  btn.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
  var mobile = window.matchMedia('(max-width: 720px)');
  // Leaders / Media: tap to expand on mobile instead of navigating
  nav.querySelectorAll('.has-sub > a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!mobile.matches) return;
      e.preventDefault();
      var item = a.parentElement;
      var open = !item.classList.contains('sub-open');
      nav.querySelectorAll('.has-sub').forEach(function (s) { s.classList.remove('sub-open'); });
      item.classList.toggle('sub-open', open);
      a.setAttribute('aria-expanded', open);
    });
  });
  // Any other link closes the menu
  nav.querySelectorAll('.nav-links a').forEach(function (a) {
    if (a.parentElement.classList.contains('has-sub') && a === a.parentElement.firstElementChild) return;
    a.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  // tapping anywhere outside the open menu closes it
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('open') && !nav.contains(e.target)) setOpen(false);
  });
})();
