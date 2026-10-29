/* ==========================================================================
   Masla-e-Karachi — main.js
   --------------------------------------------------------------------------
   Is file mein sab "zinda" cheezein hain. Har hissa alag function hai aur
   try/catch mein chalta hai — ek hissa toot jaye to baaqi website chalti rahe.

   1.  SEO: canonical / og:url / og:image mein SITE_URL lagana (config.js se)
   2.  "Visit Real Website" buttons ka link (sirf https, config.js se)
   3.  Contact email link (config.js se)
   4.  Link security: javascript: links band, bahar ke links par rel=noopener
   5.  Header: scroll par "is-scrolled" look
   6.  Mobile menu: Escape, bahar click, Tab bahar jaye to band, resize par band
   7.  In-page links: sahi jagah focus (keyboard + screen reader ke liye),
       404 page ke <base> wale bug se bachao
   8.  "On this page" list mein jo section nazar aa raha ho use highlight
   9.  .reveal wali cheezein scroll par nazar aana (jump karne par bhi theek)
   10. Scroll progress bar: jin browsers mein CSS-only version nahi chalta
   11. Mouse ke peeche halka hara noor (sirf desktop, config se band ho sakta)
   12. "Upar jao" button (config se band ho sakta)
   13. Top bar: emergency line ki chalti hui patti (marquee)

   Sab kuch CSP-safe hai: koi inline <style>, eval ya inline handler nahi.
   Styles sirf JS ke CSSOM (el.style.x = ...) se lagti hain, jo
   "style-src 'self'" mein allowed hai.
   ========================================================================== */

(function () {
  'use strict';

  var CFG = window.MEK_CONFIG || {};
  var doc = document;
  var root = doc.documentElement;
  var DEBUG = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

  /* ---------- chhote helpers ---------- */
  function each(selector, fn, scope) {
    Array.prototype.forEach.call((scope || doc).querySelectorAll(selector), fn);
  }

  function one(selector) { return doc.querySelector(selector); }

  function media(query) {
    return !!(window.matchMedia && window.matchMedia(query).matches);
  }

  function reduced() { return media('(prefers-reduced-motion: reduce)'); }

  function scrollY() { return window.pageYOffset || root.scrollTop || 0; }

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  /* scroll jaise bhaari events: ek frame mein sirf ek baar kaam */
  function throttle(fn) {
    var queued = false;
    var raf = window.requestAnimationFrame || function (cb) { return window.setTimeout(cb, 16); };
    return function () {
      if (queued) { return; }
      queued = true;
      raf(function () { queued = false; fn(); });
    };
  }

  function safe(name, fn) {
    try { fn(); } catch (err) {
      if (DEBUG && window.console) { window.console.error('[MEK] ' + name + ':', err); }
    }
  }

  function safeDecode(s) {
    try { return decodeURIComponent(s); } catch (e) { return ''; }
  }

  function addRel(a, tokens) {
    var cur = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
    tokens.forEach(function (t) { if (cur.indexOf(t) < 0) { cur.push(t); } });
    a.setAttribute('rel', cur.join(' '));
  }

  /* Sirf https (ya localhost par http), user:pass wale link nahi */
  function safeUrl(raw) {
    var s = String(raw || '').trim();
    if (!s) { return ''; }
    var u;
    try { u = new URL(s); } catch (e) { return ''; }
    if (u.username || u.password) { return ''; }
    if (u.protocol === 'https:') { return u.href; }
    if (u.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(u.hostname)) { return u.href; }
    return '';
  }

  function lang() {
    return (window.MEK_I18N && window.MEK_I18N.lang) || root.getAttribute('lang') || 'en';
  }

  /* ==========================================================================
     2. ASLI WEBSITE KA LINK
     Har link jis par data-live-link ho, uska href config.js se aata hai.
     ========================================================================== */
  function setupLiveLinks() {
    var url = safeUrl(CFG.LIVE_SITE_URL);
    if (!url && DEBUG && window.console) {
      window.console.warn('[MEK] LIVE_SITE_URL sahi https:// link nahi hai (config.js)');
    }

    each('[data-live-link]', function (a) {
      if (url) {
        a.setAttribute('href', url);
        a.removeAttribute('aria-disabled');
        addRel(a, ['noopener']);
      } else {
        a.setAttribute('href', '#');
        a.setAttribute('aria-disabled', 'true');
        a.addEventListener('click', function (e) { e.preventDefault(); });
      }
    });
  }

  /* ==========================================================================
     3. CONTACT EMAIL
     ========================================================================== */
  function setupContactLinks() {
    var email = String(CFG.CONTACT_EMAIL || '').trim();
    var valid = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/.test(email);

    each('[data-contact-link]', function (a) {
      if (valid) {
        a.setAttribute('href', 'mailto:' + email);
        a.removeAttribute('data-i18n'); /* taake zubaan badalne par email na badle */
        a.removeAttribute('aria-disabled');
        a.textContent = email;
      } else {
        a.setAttribute('aria-disabled', 'true');
        a.addEventListener('click', function (e) { e.preventDefault(); });
      }
    });
  }

  /* ==========================================================================
     4. LINK SECURITY
     ========================================================================== */
  function hardenLinks() {
    each('a[href]', function (a) {
      var raw = (a.getAttribute('href') || '').replace(/[\u0000-\u0020]/g, '');

      /* javascript: / data: / vbscript: links foran khatam */
      if (/^(javascript|data|vbscript):/i.test(raw)) {
        a.removeAttribute('href');
        return;
      }

      var external = false;
      if (/^(https?:)?\/\//i.test(raw)) {
        try { external = new URL(a.href, window.location.href).host !== window.location.host; }
        catch (e) { external = true; }
      }

      if (external) {
        /* asli website ka referrer rehne do (traffic kahan se aaya), baaqi par nahi */
        addRel(a, a.hasAttribute('data-live-link') ? ['noopener'] : ['noopener', 'noreferrer']);
      } else if (a.getAttribute('target') === '_blank') {
        addRel(a, ['noopener']);
      }
    });
  }

  /* ==========================================================================
     5. HEADER — scroll par look badalna
     ========================================================================== */
  /* SMART HIDE: neeche scroll karo to header upar slide hokar chhup jata hai,
     upar scroll karo to wapas aata hai.
     BAND KARNA HO to sirf yeh ek line badlo:  HIDE_ON_SCROLL_DOWN = false  */
  var HIDE_ON_SCROLL_DOWN = true;
  var HIDE_AFTER = 160;   /* itne px neeche jane ke baad hi chhupe */
  var HIDE_DELTA = 6;     /* chhote jhatkon par na hile */

  function setupHeader() {
    var header = one('.site-header');
    if (!header) { return; }
    var lastY = scrollY();

    function show() { header.classList.remove('is-hidden'); }

    function update() {
      var y = Math.max(0, scrollY());
      header.classList.toggle('is-scrolled', y > 8);

      /* Hamesha dikhe: option band, reduced-motion, menu khula, ya header ke andar focus */
      if (!HIDE_ON_SCROLL_DOWN || reduced() ||
          header.classList.contains('is-open') || header.contains(doc.activeElement)) {
        show();
        lastY = y;
        return;
      }

      if (y <= HIDE_AFTER) { show(); lastY = y; return; }

      var diff = y - lastY;
      if (Math.abs(diff) < HIDE_DELTA) { return; }
      header.classList.toggle('is-hidden', diff > 0);
      lastY = y;
    }

    update();
    window.addEventListener('scroll', throttle(update), { passive: true });

    /* Tab/focus header mein aaye to turant wapas dikhe */
    header.addEventListener('focusin', show);

    /* Reduced-motion chalu ho jaye to header dikhta rahe */
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      var onMq = function () { update(); };
      if (mq.addEventListener) { mq.addEventListener('change', onMq); }
      else if (mq.addListener) { mq.addListener(onMq); }
    }
  }

  /* ==========================================================================
     6. MOBILE MENU
     ========================================================================== */
  function setupMenu() {
    var header = one('.site-header');
    var toggle = one('.nav-toggle');
    var nav = doc.getElementById('site-nav');
    if (!header || !toggle || !nav) { return; }

    function isOpen() { return header.classList.contains('is-open'); }

    function setOpen(open) {
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () { setOpen(!isOpen()); });

    /* Menu ke kisi link par click karte hi band */
    nav.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) { setOpen(false); }
    });

    /* Escape dabane par band, focus wapas button par */
    doc.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    /* Menu ke bahar click karne par band */
    doc.addEventListener('click', function (e) {
      if (isOpen() && !header.contains(e.target)) { setOpen(false); }
    });

    /* Tab dabate dabate focus header se bahar nikal jaye to band */
    header.addEventListener('focusout', function (e) {
      if (isOpen() && e.relatedTarget && !header.contains(e.relatedTarget)) { setOpen(false); }
    });

    /* Back button se wapas aao to menu band mile */
    window.addEventListener('pageshow', function () { setOpen(false); });

    /* Screen bari ho jaye (desktop) to menu band kar do */
    var wide = window.matchMedia ? window.matchMedia('(min-width: 62.5rem)') : null;
    if (wide) {
      var onChange = function (e) { if (e.matches) { setOpen(false); } };
      if (wide.addEventListener) { wide.addEventListener('change', onChange); }
      else if (wide.addListener) { wide.addListener(onChange); }
    }
  }

  /* ==========================================================================
     7. IN-PAGE LINKS (#section) — focus + 404 <base> fix
     Scroll ka offset CSS ke scroll-padding-top se aata hai.
     ========================================================================== */
  function focusTarget(el) {
    if (!el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '-1');
      el.addEventListener('blur', function onBlur() {
        el.removeAttribute('tabindex');
        el.removeEventListener('blur', onBlur);
      });
    }
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  function setupAnchors() {
    /* 404.html <base href> lagata hai; us par "#main" ka matlab home page ho jata hai.
       Aise mein hum link ko khud sambhalte hain. */
    var manual = !!doc.baseURI && doc.baseURI.split('#')[0] !== window.location.href.split('#')[0];

    doc.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) { return; }

      var href = a.getAttribute('href');
      if (href.length < 2) { return; }
      var target = doc.getElementById(safeDecode(href.slice(1)));
      if (!target) { return; }

      if (manual) {
        e.preventDefault();
        target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
        try { window.history.replaceState(null, '', window.location.pathname + window.location.search + href); }
        catch (err) { /* koi baat nahi */ }
      }
      focusTarget(target);
    });
  }

  /* ==========================================================================
     8. "ON THIS PAGE" HIGHLIGHT
     ========================================================================== */
  function setupToc() {
    var items = [];
    each('.toc a[href^="#"]', function (a) {
      var el = doc.getElementById(safeDecode(a.getAttribute('href').slice(1)));
      if (el) { items.push({ a: a, el: el }); }
    });
    if (!items.length) { return; }

    function mark(active) {
      items.forEach(function (it) {
        var on = it === active;
        it.a.classList.toggle('is-active', on);
        if (on) { it.a.setAttribute('aria-current', 'true'); } else { it.a.removeAttribute('aria-current'); }
      });
    }

    function update() {
      var header = one('.site-header');
      var line = (header ? header.offsetHeight : 0) + Math.round(window.innerHeight * 0.2);
      var active = null;
      items.forEach(function (it) {
        if (it.el.getBoundingClientRect().top <= line) { active = it; }
      });
      if (window.innerHeight + scrollY() >= root.scrollHeight - 4) { active = items[items.length - 1]; }
      mark(active);
    }

    update();
    window.addEventListener('scroll', throttle(update), { passive: true });
    window.addEventListener('resize', throttle(update));
  }

  /* ==========================================================================
     9. REVEAL (scroll par nazar aana)
     ========================================================================== */
  function setupReveal() {
    if (!doc.querySelector('.reveal')) { return; }

    function showAll() { each('.reveal', function (el) { el.classList.add('is-visible'); }); }

    window.addEventListener('beforeprint', showAll);

    if (reduced() || !('IntersectionObserver' in window)) { showAll(); return; }

    var io = new IntersectionObserver(function (entries, obs) {
      var batch = [];
      entries.forEach(function (entry) {
        /* Jo cheez screen ke UPAR reh gayi (hash se neeche jump kiya) use bhi dikha do,
           warna wapas scroll karne par gayab mile */
        var passed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        if (entry.isIntersecting) {
          batch.push(entry.target);
        } else if (passed) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });

      /* Ek hi waqt mein aane wali cheezein DOM order mein 70ms ke fasle se (max 6 tak) aati hain.
         Alag alag waqt par aane wali cheez ko intezar nahi karna padta. */
      batch.sort(function (a, b) {
        return (a.compareDocumentPosition(b) & 4) ? -1 : 1;
      });
      batch.forEach(function (el, i) {
        el.style.setProperty('--reveal-delay', (Math.min(i, 5) * 70) + 'ms');
        el.classList.add('is-visible');
        obs.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    each('.reveal', function (el) { io.observe(el); });
  }

  /* ==========================================================================
     10. SCROLL PROGRESS — fallback
     CSS-only version sirf un browsers mein chalta hai jo scroll-driven animation
     samajhte hain. Baaqi (Firefox, purana Safari) ke liye yeh JS wala.
     ========================================================================== */
  function setupProgressFallback() {
    var wrap = one('.scroll-progress');
    var bar = one('.scroll-progress__bar');
    if (!wrap || !bar || reduced()) { return; }
    if (window.CSS && window.CSS.supports && window.CSS.supports('animation-timeline: scroll()')) { return; }

    var w = wrap.style;
    w.display = 'block';
    w.position = 'fixed';
    w.top = '0';
    w.left = '0';
    w.right = '0';
    w.height = '3px';
    w.zIndex = '300';
    w.pointerEvents = 'none';

    var b = bar.style;
    b.display = 'block';
    b.height = '100%';
    b.boxShadow = '0 0 12px #39ff14, 0 0 2px #7dff63';
    b.transform = 'scaleX(0)';
    b.willChange = 'transform';

    /* site sirf English hai: progress bar hamesha left se right */
    b.background = 'linear-gradient(to right, #22c70a, #39ff14, #7dff63)';
    b.transformOrigin = '0 50%';

    var update = throttle(function () {
      var max = root.scrollHeight - window.innerHeight;
      var p = max > 0 ? clamp(scrollY() / max, 0, 1) : 0;
      b.transform = 'scaleX(' + p.toFixed(4) + ')';
    });

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ==========================================================================
     11. CURSOR GLOW — mouse ke peeche halka hara noor
     Sirf mouse wale desktop par. Touch / reduced-motion par bilkul nahi.
     ========================================================================== */
  function setupCursorGlow() {
    if (CFG.FX_CURSOR_GLOW === false) { return; }
    if (!media('(hover: hover) and (pointer: fine)') || reduced()) { return; }

    var el = doc.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    var s = el.style;
    s.position = 'fixed';
    s.top = '0';
    s.left = '0';
    s.width = '520px';
    s.height = '520px';
    s.marginTop = '-260px';
    s.marginLeft = '-260px';
    s.borderRadius = '50%';
    s.pointerEvents = 'none';
    s.zIndex = '1';
    s.opacity = '0';
    s.transition = 'opacity 0.4s ease';
    s.willChange = 'transform, opacity';
    s.background = 'radial-gradient(circle, rgba(57,255,20,0.09) 0%, rgba(57,255,20,0.035) 35%, rgba(57,255,20,0) 65%)';
    doc.body.appendChild(el);

    var tx = 0, ty = 0, x = 0, y = 0, raf = 0, seen = false;

    function loop() {
      x += (tx - x) * 0.14;   /* naram peecha karna (easing) */
      y += (ty - y) * 0.14;
      s.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      if (Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4) { raf = window.requestAnimationFrame(loop); }
      else { raf = 0; }
    }

    doc.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') { return; }
      tx = e.clientX;
      ty = e.clientY;
      if (!seen) { x = tx; y = ty; seen = true; }
      s.opacity = '1';
      if (!raf) { raf = window.requestAnimationFrame(loop); }
    }, { passive: true });

    root.addEventListener('mouseleave', function () { s.opacity = '0'; });
    window.addEventListener('beforeprint', function () { s.display = 'none'; });
    window.addEventListener('afterprint', function () { s.display = ''; });
  }

  /* ==========================================================================
     12. BACK TO TOP
     ========================================================================== */
  function setupBackToTop() {
    if (CFG.BACK_TO_TOP === false) { return; }

    var LABEL = { en: 'Back to top', ur: 'اوپر جائیں' };
    var SHOW_AFTER = 700;

    var btn = doc.createElement('button');
    btn.type = 'button';

    var NS = 'http://www.w3.org/2000/svg';
    var svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.4');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    ['M12 19V5', 'm5 12 7-7 7 7'].forEach(function (d) {
      var p = doc.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    btn.appendChild(svg);

    var s = btn.style;
    s.position = 'fixed';
    s.insetInlineEnd = 'calc(1rem + env(safe-area-inset-right, 0px))';
    s.insetBlockEnd = 'calc(1rem + env(safe-area-inset-bottom, 0px))';
    s.zIndex = '90';
    s.width = '2.9rem';
    s.height = '2.9rem';
    s.padding = '0';
    s.display = 'grid';
    s.placeItems = 'center';
    s.borderRadius = '50%';
    s.border = '1px solid rgba(57,255,20,0.45)';
    s.background = 'rgba(13,13,13,0.9)';
    s.color = '#39ff14';
    s.cursor = 'pointer';
    s.boxShadow = '0 8px 24px -8px rgba(0,0,0,0.8), 0 0 18px rgba(57,255,20,0.22)';
    s.webkitBackdropFilter = 'blur(8px)';
    s.backdropFilter = 'blur(8px)';
    s.opacity = '0';
    s.visibility = 'hidden';
    s.transform = 'translateY(12px)';
    s.transition = 'opacity 0.25s ease, transform 0.25s ease, visibility 0s linear 0.25s, background-color 0.2s ease, color 0.2s ease';

    function label() {
      var text = LABEL[lang()] || LABEL.en;
      btn.setAttribute('aria-label', text);
      btn.setAttribute('title', text);
    }

    function hot(on) {
      s.background = on ? '#39ff14' : 'rgba(13,13,13,0.9)';
      s.color = on ? '#0d0d0d' : '#39ff14';
    }

    var shown = false;
    function update() {
      var want = scrollY() > SHOW_AFTER;
      if (want === shown) { return; }
      shown = want;
      s.opacity = want ? '1' : '0';
      s.visibility = want ? 'visible' : 'hidden';
      s.transform = want ? 'none' : 'translateY(12px)';
      s.transitionDelay = want ? '0s' : '0s, 0s, 0.25s, 0s, 0s';
      btn.tabIndex = want ? 0 : -1;
    }

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
      var top = doc.getElementById('top');   /* focus upar le jao, button gayab hota hai */
      if (top) { focusTarget(top); }
    });
    btn.addEventListener('mouseenter', function () { hot(true); });
    btn.addEventListener('mouseleave', function () { hot(false); });
    btn.addEventListener('focus', function () { hot(true); });
    btn.addEventListener('blur', function () { hot(false); });

    label();
    btn.tabIndex = -1;
    doc.body.appendChild(btn);
    update();

    window.addEventListener('scroll', throttle(update), { passive: true });
    doc.addEventListener('mek:langchange', label);
    window.addEventListener('beforeprint', function () { s.display = 'none'; });
    window.addEventListener('afterprint', function () { s.display = 'grid'; });
  }

  /* ==========================================================================
     12. MOTION POLISH (Masla 16)
     a) stagger : ek hi parent ke .reveal bachon par data-delay hook lagata hai
                  (asli delay setupReveal ka --reveal-delay deta hai, 70ms x number)
     b) tilt    : [data-tilt] aur hero ka report-card pointer ki taraf zara jhukte hain
        (buttons ka magnetic khichav Masla 7 mein hata diya gaya)
     b sirf mouse + hover + motion-allowed par. Fail ho to site waise hi chalti hai (safe()).
     ========================================================================== */
  function setupStagger() {
    var parents = [];
    each('.reveal:not([data-delay])', function (el) {
      var p = el.parentNode;
      if (p && parents.indexOf(p) < 0) { parents.push(p); }
    });
    parents.forEach(function (p) {
      var kids = Array.prototype.filter.call(p.children, function (c) {
        return c.classList.contains('reveal') && !c.hasAttribute('data-delay');
      });
      if (kids.length < 2) { return; }
      kids.forEach(function (c, i) { c.setAttribute('data-delay', String(Math.min(i + 1, 6))); });
    });
  }

  function setupPointerFx() {
    if (!media('(hover: hover) and (pointer: fine)') || reduced()) { return; }

    each('[data-tilt], .hero__visual .report-card', function (el) {
      var queued = false, ex = 0, ey = 0;
      el.setAttribute('data-tilt', '');
      function apply() {
        queued = false;
        var r = el.getBoundingClientRect();
        var x = clamp((ex - r.left) / r.width - 0.5, -0.5, 0.5);
        var y = clamp((ey - r.top) / r.height - 0.5, -0.5, 0.5);
        el.style.setProperty('--tilt-y', (x * 7).toFixed(2) + 'deg');
        el.style.setProperty('--tilt-x', (-y * 7).toFixed(2) + 'deg');
      }
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') { return; }
        ex = e.clientX; ey = e.clientY;
        el.classList.add('is-tilting');
        if (!queued) { queued = true; window.requestAnimationFrame(apply); }
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--tilt-x', '0deg');
        el.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  /* ==========================================================================
     4b. DEVELOPER CREDIT (footer)
     Naam/links sirf config.js ke DEVELOPER se. Khali URL wala link nahi banta.
     Sab kuch createElement/textContent se banta hai (innerHTML nahi).
     ========================================================================== */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  /* Chhote saaf inline icons (24x24, stroke currentColor). Har icon shapes ki list hai:
     [tag, {attributes}]. Naya platform: yahan ek entry barhao; na mile to generic "link" icon. */
  var DEV_ICONS = {
    linkedin: [
      ['path', { d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z' }],
      ['rect', { x: '2', y: '9', width: '4', height: '12' }],
      ['circle', { cx: '4', cy: '4', r: '2' }]
    ],
    youtube: [
      ['path', { d: 'M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17' }],
      ['path', { d: 'm10 15 5-3-5-3z' }]
    ],
    instagram: [
      ['rect', { x: '2', y: '2', width: '20', height: '20', rx: '5', ry: '5' }],
      ['path', { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' }],
      ['line', { x1: '17.5', x2: '17.51', y1: '6.5', y2: '6.5' }]
    ],
    github: [
      ['path', { d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4' }],
      ['path', { d: 'M9 18c-4.51 2-5-2-7-2' }]
    ],
    link: [
      ['path', { d: 'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1' }]
    ]
  };

  function devIcon(platform) {
    var key = String(platform || '').toLowerCase();
    var shapes = DEV_ICONS[key] || DEV_ICONS.link;
    var svg = doc.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'site-footer__dev-icon');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    shapes.forEach(function (sh) {
      var el = doc.createElementNS(SVG_NS, sh[0]);
      Object.keys(sh[1]).forEach(function (k) { el.setAttribute(k, sh[1][k]); });
      svg.appendChild(el);
    });
    return svg;
  }

  function devLink(href, className) {
    var a = doc.createElement('a');
    a.setAttribute('href', href);
    a.setAttribute('target', '_blank');
    a.setAttribute('class', className);
    addRel(a, ['noopener', 'noreferrer']);
    return a;
  }

  function setupDeveloper() {
    var dev = CFG.DEVELOPER;
    if (!dev || !dev.NAME) { return; }

    var portfolio = safeUrl(dev.PORTFOLIO);
    var socials = [];
    (dev.SOCIALS || []).forEach(function (s) {
      var url = safeUrl(s && s.URL);
      if (url && s.PLATFORM) { socials.push({ platform: String(s.PLATFORM), handle: String(s.HANDLE || ''), url: url }); }
    });

    /* 1) Footer credit row: .site-footer__legal ke andar */
    var legal = one('.site-footer__legal');
    if (legal && !legal.querySelector('.site-footer__credit')) {
      var credit = doc.createElement('span');
      credit.setAttribute('class', 'site-footer__credit');

      var label = doc.createElement('span');
      label.setAttribute('class', 'site-footer__credit-label');
      label.setAttribute('data-dev-label', '');
      label.textContent = 'Designed & developed by';
      credit.appendChild(label);

      var name;
      if (portfolio) {
        name = devLink(portfolio, 'site-footer__credit-name ltr');
        name.setAttribute('data-dev-link', 'portfolio');
      } else {
        name = doc.createElement('span');
        name.setAttribute('class', 'site-footer__credit-name ltr');
      }
      name.textContent = String(dev.NAME);
      credit.appendChild(name);

      if (socials.length) {
        var list = doc.createElement('span');
        list.setAttribute('class', 'site-footer__credit-links');
        socials.forEach(function (s) {
          var a = devLink(s.url, 'site-footer__dev-chip ltr');
          a.setAttribute('data-dev-link', s.platform.toLowerCase());
          a.setAttribute('aria-label', String(dev.NAME) + ' on ' + s.platform);
          if (s.handle) { a.setAttribute('title', s.handle); }
          a.appendChild(devIcon(s.platform));
          var txt = doc.createElement('span');
          txt.textContent = s.platform;
          a.appendChild(txt);
          list.appendChild(a);
        });
        credit.appendChild(list);
      }
      legal.appendChild(credit);
    }

    /* 2) Koi bhi [data-dev-link] element (HTML mein pehle se ho) ka href bharo */
    each('[data-dev-link]', function (el) {
      if (el.getAttribute('href')) { return; }
      var key = el.getAttribute('data-dev-link');
      var url = key === 'portfolio' ? portfolio : '';
      socials.forEach(function (s) { if (s.platform.toLowerCase() === key) { url = s.url; } });
      if (url) {
        el.setAttribute('href', url);
        el.setAttribute('target', '_blank');
        addRel(el, ['noopener', 'noreferrer']);
        /* "Built by" card ke chips: icon + saaf aria-label (footer chips jaisa) */
        if (el.classList.contains('builder-chip')) {
          if (!el.querySelector('svg')) { el.insertBefore(devIcon(key), el.firstChild); }
          el.setAttribute('aria-label', key === 'portfolio' ? String(dev.NAME) + ' – portfolio' : String(dev.NAME) + ' on ' + el.textContent.trim());
        }
      } else {
        el.hidden = true;
      }
    });

    /* 3) Label zubaan ke hisaab se (naam Latin hi rehta hai) */
    var tr = window.MEK_I18N && window.MEK_I18N.t;
    each('[data-dev-label]', function (el) {
      el.textContent = tr ? tr('footer.credit', 'Designed & developed by') : 'Designed & developed by';
    });
  }

  /* ==========================================================================
     13. TOP BAR — emergency line ki chalti hui patti (marquee)
     --------------------------------------------------------------------------
     HTML nahi badalta. Original <p> screen reader ke liye rehta hai (CSS usay
     marquee mode mein chhupa deta hai). JS .emergency-bar__track banata hai:
     2 barabar group, har group mein itni copies ke bar poori bhar jaye.
     CSS translate 0 -> -50% chalata hai, isliye loop seamless hai.
     JS na chale to purani static line dikhti rehti hai.
     ========================================================================== */
  var marqueeSync = null;

  function setupEmergencyMarquee() {
    var bar = one('.emergency-bar');
    var inner = bar && bar.querySelector('.emergency-bar__inner');
    var source = inner && inner.querySelector('p');
    if (!bar || !inner || !source) { return; }

    var SPEED = 55;   /* pixel / second (hamesha ek jaisi raftaar) */
    var track = doc.createElement('div');
    track.className = 'emergency-bar__track';
    track.setAttribute('aria-hidden', 'true');   /* clones screen reader ko nahi sunte */
    inner.appendChild(track);

    var lastKey = '';

    function makeGroup(copies) {
      var group = doc.createElement('div');
      group.className = 'emergency-bar__group';
      for (var i = 0; i < copies; i += 1) {
        var item = doc.createElement('span');
        item.className = 'emergency-bar__item';
        var text = doc.createElement('span');
        text.className = 'emergency-bar__text';
        text.innerHTML = source.innerHTML;   /* page ka apna (i18n se sanitize hua) HTML */
        item.appendChild(text);
        group.appendChild(item);
      }
      return group;
    }

    function sync(force) {
      var barWidth = inner.clientWidth;
      var key = source.innerHTML + '|' + barWidth;
      if (!force && key === lastKey) { return; }

      /* 1) ek copy ki chaurai naapo */
      while (track.firstChild) { track.removeChild(track.firstChild); }
      var probe = makeGroup(1);
      track.appendChild(probe);
      var itemWidth = probe.getBoundingClientRect().width;
      if (!barWidth || !itemWidth) {          /* reduced-motion mein track chhupa hota hai */
        while (track.firstChild) { track.removeChild(track.firstChild); }
        lastKey = '';
        return;
      }
      lastKey = key;

      /* 2) copies = ceil(bar / copy) + 1, 2 barabar groups */
      var copies = Math.ceil(barWidth / itemWidth) + 1;
      track.removeChild(probe);
      var first = makeGroup(copies);
      track.appendChild(first);
      track.appendChild(makeGroup(copies));

      /* 3) raftaar: group ki chaurai / SPEED (inline style attribute nahi, CSSOM) */
      var groupWidth = first.getBoundingClientRect().width;
      track.style.setProperty('--marquee-duration', (groupWidth / SPEED).toFixed(2) + 's');
      bar.classList.add('emergency-bar--marquee');
    }

    marqueeSync = sync;
    sync(true);

    window.addEventListener('resize', throttle(function () { sync(false); }));
    if (doc.fonts && doc.fonts.ready) { doc.fonts.ready.then(function () { sync(false); }); }

    /* reduced-motion browser mein badle to dobara naapo */
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      var again = function () { sync(true); };
      if (mq.addEventListener) { mq.addEventListener('change', again); }
      else if (mq.addListener) { mq.addListener(again); }
    }
  }

  /* ==========================================================================
     14. TICKER PATIYAN (Masla 8)
     Har track mein 2 barabar group hain (translate 0 -> -50% = seamless loop).
     Yahan: (a) group ko itni baar dohraya jata hai ke woh patti ki chaurai se
     lamba ho (1920px+ par gap na aaye), (b) raftaar constant rakhi jati hai:
     tape ~50px/s, departments ~40px/s (--ticker-duration, CSSOM se; inline style attribute nahi).
     Patiyan aria-hidden hain, clones bhi.
     ========================================================================== */
  function setupTickers() {
    var tracks = doc.querySelectorAll('.ticker__track');
    if (!tracks.length) { return; }

    var jobs = [];
    Array.prototype.forEach.call(tracks, function (track) {
      var groups = track.querySelectorAll('.ticker__group');
      if (groups.length < 2) { return; }
      var items = [];
      Array.prototype.forEach.call(groups[0].children, function (c) {
        var copy = c.cloneNode(true);
        copy.removeAttribute('data-i18n');
        items.push(copy);
      });
      var speed = track.parentNode.classList.contains('ticker__row--depts') ? 40 : 50;
      jobs.push({ track: track, groups: groups, items: items, speed: speed, key: '' });
    });

    function fill(group, copies, items) {
      while (group.firstChild) { group.removeChild(group.firstChild); }
      for (var c = 0; c < copies; c += 1) {
        items.forEach(function (it) { group.appendChild(it.cloneNode(true)); });
      }
    }

    function build(job, force) {
      var rowWidth = job.track.parentNode.clientWidth;
      if (!rowWidth) { return; }
      var key = rowWidth + '|' + (reduced() ? 'r' : 'm');
      if (!force && key === job.key) { return; }
      job.key = key;

      if (reduced()) {            /* CSS wahan sirf pehla group dikhata hai */
        fill(job.groups[0], 1, job.items);
        fill(job.groups[1], 1, job.items);
        return;
      }

      fill(job.groups[0], 1, job.items);
      var one = job.groups[0].getBoundingClientRect().width;
      if (!one) { return; }
      var copies = Math.max(1, Math.ceil(rowWidth / one));
      fill(job.groups[0], copies, job.items);
      fill(job.groups[1], copies, job.items);
      job.track.style.setProperty('--ticker-duration', ((one * copies) / job.speed).toFixed(1) + 's');
    }

    function all(force) { jobs.forEach(function (j) { build(j, force); }); }

    all(true);
    window.addEventListener('resize', throttle(function () { all(false); }));
    if (doc.fonts && doc.fonts.ready) { doc.fonts.ready.then(function () { all(true); }); }

    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      var again = function () { all(true); };
      if (mq.addEventListener) { mq.addEventListener('change', again); }
      else if (mq.addListener) { mq.addListener(again); }
    }
  }

  /* ==========================================================================
     SHURUAAT
     ========================================================================== */
  function init() {
    safe('liveLinks', setupLiveLinks);
    safe('contactLinks', setupContactLinks);
    safe('developer', setupDeveloper);
    safe('hardenLinks', hardenLinks);
    safe('header', setupHeader);
    safe('marquee', setupEmergencyMarquee);
    safe('tickers', setupTickers);
    safe('menu', setupMenu);
    safe('anchors', setupAnchors);
    safe('toc', setupToc);
    safe('stagger', setupStagger);
    safe('reveal', setupReveal);
    safe('progress', setupProgressFallback);
    safe('cursorGlow', setupCursorGlow);
    safe('pointerFx', setupPointerFx);
    safe('backToTop', setupBackToTop);

    /* Zubaan badalne par i18n naye links (<a> in translated text) laata hai: dobara check */
    doc.addEventListener('mek:langchange', function () {
      safe('developer', setupDeveloper);
      safe('hardenLinks', hardenLinks);
      if (marqueeSync) { safe('marquee', function () { marqueeSync(false); }); }
    });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
