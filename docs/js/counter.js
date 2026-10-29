/* ==========================================================================
   Masla-e-Karachi — counter.js
   --------------------------------------------------------------------------
   Numbers ko 0 se ginti karke dikhata hai, jab woh screen par aayen.

   ABHI KISI PAGE PAR COUNTER NAHI HAI (jhoote numbers nahi dikhane).
   Jab asli data aaye to HTML mein sirf yeh likho, aur is page par
   <script src="js/counter.js" defer></script> bhi lagao:

     <span class="stat__value" data-counter="1240">0</span>

   Optional attributes:
     data-counter-duration="1600"   (milliseconds, 300 se 8000)
     data-counter-decimals="1"      (point ke baad kitne digits, 0 se 4)
     data-counter-from="0"          (kahan se shuru)
     data-counter-delay="200"       (shuru hone se pehle intezar, ms)
     data-counter-prefix="+"        data-counter-suffix="%"

   Khaas baatein:
   - Reduced-motion wale visitor ko seedha final number milta hai
   - Ginti easeOutCubic se chalti hai (Masla 8)
   - Print karte waqt bhi final number
   - Number nahi hai (jaise "—") to us element ko chhedta nahi
   - Baad mein JS se naye counter add karo to: window.MEK_COUNTER.refresh()
   ========================================================================== */

(function () {
  'use strict';

  var formatters = {};
  var observer = null;

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* toLocaleString har frame par mehnga hai, isliye formatter ek baar banta hai */
  function formatter(decimals) {
    if (!formatters[decimals]) {
      try {
        formatters[decimals] = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      } catch (e) {
        formatters[decimals] = { format: function (v) { return v.toFixed(decimals); } };
      }
    }
    return formatters[decimals];
  }

  function intAttr(el, name, fallback, min, max) {
    var n = parseInt(el.getAttribute(name), 10);
    if (!isFinite(n)) { return fallback; }
    return Math.min(max, Math.max(min, n));
  }

  function read(el) {
    var target = parseFloat(el.getAttribute('data-counter'));
    var from = parseFloat(el.getAttribute('data-counter-from'));
    return {
      target: target,
      from: isFinite(from) ? from : 0,
      decimals: intAttr(el, 'data-counter-decimals', 0, 0, 4),
      duration: intAttr(el, 'data-counter-duration', 1600, 300, 8000),
      delay: intAttr(el, 'data-counter-delay', 0, 0, 3000),
      prefix: el.getAttribute('data-counter-prefix') || '',
      suffix: el.getAttribute('data-counter-suffix') || ''
    };
  }

  function valid(o) {
    return isFinite(o.target) && Math.abs(o.target) < 1e12;
  }

  function show(el, o, value) {
    /* textContent hi use hota hai (HTML nahi), isliye attribute se kuch inject nahi ho sakta */
    el.textContent = o.prefix + formatter(o.decimals).format(value) + o.suffix;
  }

  function easeOutCubic(p) { return 1 - Math.pow(1 - p, 3); }

  function finalize(el) {
    var o = read(el);
    if (valid(o)) { show(el, o, o.target); }
  }

  function run(el) {
    var o = read(el);
    if (!valid(o)) { return; } /* number nahi hai to chhor do */

    if (reduced()) { show(el, o, o.target); return; }

    /* delay ke dauran final number nazar na aaye: pehle shuru ka number */
    show(el, o, o.from);

    function start() {
      var t0 = null;
      function frame(now) {
        if (t0 === null) { t0 = now; }
        var p = Math.min((now - t0) / o.duration, 1);
        show(el, o, o.from + (o.target - o.from) * easeOutCubic(p));
        if (p < 1) { window.requestAnimationFrame(frame); } else { show(el, o, o.target); }
      }
      window.requestAnimationFrame(frame);
    }

    if (o.delay) { window.setTimeout(start, o.delay); } else { start(); }
  }

  function refresh() {
    var counters = document.querySelectorAll('[data-counter]:not([data-counter-bound])');
    if (!counters.length) { return; }

    Array.prototype.forEach.call(counters, function (el) {
      el.setAttribute('data-counter-bound', '1');
    });

    /* Motion allowed hai to screen par aane tak shuru ka number (taake final number jhatke se 0 na ho) */
    if (!reduced() && 'IntersectionObserver' in window) {
      Array.prototype.forEach.call(counters, function (el) {
        var o = read(el);
        if (valid(o)) { show(el, o, o.from); }
      });
    }

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(counters, finalize);
      return;
    }

    if (!observer) {
      observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { run(entry.target); obs.unobserve(entry.target); }
        });
      }, { threshold: 0.4, rootMargin: '0px 0px -5% 0px' });
    }

    Array.prototype.forEach.call(counters, function (el) { observer.observe(el); });
  }

  function setup() {
    refresh();
    /* Print mein ginti ke beech ka number na chhape */
    window.addEventListener('beforeprint', function () {
      Array.prototype.forEach.call(document.querySelectorAll('[data-counter]'), finalize);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

  window.MEK_COUNTER = { refresh: refresh };
})();
