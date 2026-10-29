/* ==========================================================================
   Masla-e-Karachi — faq.js
   --------------------------------------------------------------------------
   FAQ accordion: sawal par click karo to jawab khulta hai, dobara click par band.
   - aria-expanded khud update hota hai (screen reader ke liye)
   - Keyboard: Upar/Neeche arrow, Home, End se sawalon ke beech ghoomo
   - Kisi sawal ka link (jaise faq.html#faq-q3) khole to wahi sawal khul jata hai
   - Sawal khulne par URL mein uska #link lag jata hai (share karne ke liye)
   - Khulne ke baad jawab screen ke bahar ho to khud scroll ho jata hai
   - Sirf ek sawal khula rakhna ho to .accordion par data-single lagao
   - Topic chips ([data-faq-filter] ke andar [data-filter] buttons, aria-pressed) groups ko chhantte hain
   - Optional buttons:  <button data-accordion-open-all>  /  <button data-accordion-close-all>
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function safeDecode(s) {
    try { return decodeURIComponent(s); } catch (e) { return ''; }
  }

  function setItem(item, open) {
    var btn = item.querySelector('.accordion__button');
    item.classList.toggle('is-open', open);
    if (btn) { btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  }

  function headerOffset() {
    var h = document.querySelector('.site-header');
    return (h ? h.offsetHeight : 0) + 16;
  }

  /* Khulne ki animation (~300ms) ke baad dekho ke jawab poora nazar aa raha hai ya nahi */
  function ensureVisible(item) {
    var wait = reduced() ? 0 : 380;
    window.setTimeout(function () {
      var r = item.getBoundingClientRect();
      var vh = window.innerHeight || root.clientHeight;
      var top = headerOffset();
      var y = window.pageYOffset || root.scrollTop || 0;
      var dest = null;

      if (r.top < top) { dest = y + r.top - top; }                          /* upar se kat raha hai */
      else if (r.bottom > vh) {                                             /* neeche se kat raha hai */
        dest = r.height > vh - top ? y + r.top - top : y + r.bottom - vh + 16;
      }
      if (dest !== null) {
        window.scrollTo({ top: Math.max(0, dest), behavior: reduced() ? 'auto' : 'smooth' });
      }
    }, wait);
  }

  function setHash(btn) {
    if (!btn || !btn.id) { return; }
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search + '#' + btn.id);
    } catch (e) { /* koi baat nahi */ }
  }

  function setup() {
    var buttons = document.querySelectorAll('.accordion__button');
    if (!buttons.length) { return; }

    /* HTML aur class ki halat ek jaisi rakho (screen reader ko sahi batao) */
    Array.prototype.forEach.call(document.querySelectorAll('.accordion__item'), function (item) {
      setItem(item, item.classList.contains('is-open'));
    });

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.accordion__item');
        if (!item) { return; }
        var willOpen = !item.classList.contains('is-open');

        var group = item.closest('.accordion');
        if (willOpen && group && group.hasAttribute('data-single')) {
          Array.prototype.forEach.call(group.querySelectorAll('.accordion__item.is-open'), function (other) {
            if (other !== item) { setItem(other, false); }
          });
        }
        setItem(item, willOpen);
        if (willOpen) { setHash(btn); ensureVisible(item); }
      });

      /* Keyboard: WAI-ARIA accordion pattern */
      btn.addEventListener('keydown', function (e) {
        var key = e.key;
        if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End') { return; }
        var group = btn.closest('.accordion') || document;
        var list = Array.prototype.slice.call(group.querySelectorAll('.accordion__button'));
        var i = list.indexOf(btn);
        if (i < 0) { return; }

        var next = i;
        if (key === 'ArrowDown') { next = (i + 1) % list.length; }
        else if (key === 'ArrowUp') { next = (i - 1 + list.length) % list.length; }
        else if (key === 'Home') { next = 0; }
        else if (key === 'End') { next = list.length - 1; }

        e.preventDefault();
        list[next].focus();
      });
    });

    /* Sab kholo / sab band karo (agar page par aise buttons hon) */
    function bulk(selector, open) {
      Array.prototype.forEach.call(document.querySelectorAll(selector), function (b) {
        b.addEventListener('click', function () {
          var scope = b.closest('section, .accordion-wrap') || document;
          Array.prototype.forEach.call(scope.querySelectorAll('.accordion__item'), function (item) {
            setItem(item, open);
          });
        });
      });
    }
    bulk('[data-accordion-open-all]', true);
    bulk('[data-accordion-close-all]', false);

    /* Topic filter: chip dabao to sirf wahi group dikhe (aria-pressed update) */
    var chips = document.querySelectorAll('[data-faq-filter] [data-filter]');
    var groups = document.querySelectorAll('.faq-group[data-group]');

    function applyFilter(key) {
      Array.prototype.forEach.call(groups, function (g) {
        g.hidden = !(key === 'all' || g.getAttribute('data-group') === key);
      });
      Array.prototype.forEach.call(chips, function (c) {
        c.setAttribute('aria-pressed', c.getAttribute('data-filter') === key ? 'true' : 'false');
      });
    }

    Array.prototype.forEach.call(chips, function (c) {
      c.addEventListener('click', function () { applyFilter(c.getAttribute('data-filter')); });
    });

    /* Link se aaye (#faq-q3 ya #faq-a3) to wahi sawal khol do */
    function openFromHash() {
      var id = safeDecode(window.location.hash.slice(1));
      if (!id) { return; }
      var target = document.getElementById(id);
      var item = target && target.closest('.accordion__item');
      if (!item) { return; }
      if (item.closest('.faq-group[hidden]')) { applyFilter('all'); }   /* chhupa group ho to sab dikha do */
      setItem(item, true);
      item.scrollIntoView({ block: 'start' });   /* offset CSS ke scroll-padding-top se */
    }

    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
