/* ==========================================================================
   Masla-e-Karachi — i18n.js  (English-only loader)
   --------------------------------------------------------------------------
   Site ab sirf English mein hai. Yeh chhota loader lang/en.json se text lekar
   page par laga deta hai, taake text edit karna asaan rahe (sirf en.json badlo).

   - JSON load na ho (ya khali ho) to page ka apna English text chalta rehta hai
   - <html lang="en" dir="ltr"> HTML mein pehle se hai, JS usay nahi chhedta

   SECURITY (pehle jaisi hi, kamzor nahi ki):
   - JSON se aane wala HTML seedha innerHTML mein nahi jata. Pehle sanitizer
     se guzarta hai: sirf <strong> <em> <a> <br> jaisi safe tags, safe links.
     (script, onclick, javascript: sab kat jata hai)
   - JSON ki keys/values validate hoti hain (sirf string, __proto__ jaisi
     keys block, lambi values reject)
   - Fetch par 10 second ka timeout

   HTML mein yeh attributes use hote hain:
     data-i18n="key"                -> text badalta hai
     data-i18n-html="key"           -> text + <strong>/<a> jaisi safe tags
     data-i18n-aria-label="key"     -> aria-label badalta hai
     data-i18n-content="key"        -> <meta content="..."> badalta hai
     data-i18n-alt / -title / -placeholder="key"

   Doosri JS files ke liye: window.MEK_I18N (lang, dir, t, onChange)
   aur 'mek:langchange' event (apply hone ke baad ek baar).
   ========================================================================== */

(function () {
  'use strict';

  var LANG = 'en';
  var FETCH_TIMEOUT = 10000;
  var MAX_VALUE_LENGTH = 6000;

  var dict = {};          // load ho chuki (validated) en.json
  var htmlCache = {};     // sanitize ho chuke HTML fragments

  var ATTR_MAP = [
    { attr: 'aria-label',  data: 'data-i18n-aria-label' },
    { attr: 'content',     data: 'data-i18n-content' },
    { attr: 'alt',         data: 'data-i18n-alt' },
    { attr: 'title',       data: 'data-i18n-title' },
    { attr: 'placeholder', data: 'data-i18n-placeholder' }
  ];

  /* ---------- chhote helpers ---------- */
  function each(selector, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), fn);
  }

  function has(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function isUnsafeKey(k) {
    return k === '__proto__' || k === 'constructor' || k === 'prototype';
  }

  /* ==========================================================================
     SANITIZER (JSON se aane wale HTML ke liye) — pehle jaisa hi
     ========================================================================== */
  var ALLOWED_TAGS = {
    STRONG: 1, EM: 1, B: 1, I: 1, BR: 1, A: 1, SPAN: 1,
    CODE: 1, SMALL: 1, MARK: 1, WBR: 1, SUB: 1, SUP: 1
  };

  function safeHref(value) {
    var v = String(value || '').trim();
    if (!v) { return false; }
    var compact = v.replace(/[\u0000-\u0020]/g, '');   /* "java\nscript:" jaisi chaalein */
    if (/^\/\//.test(compact)) { return false; }         /* protocol-relative nahi */
    var scheme = /^([a-z][a-z0-9+.\-]*):/i.exec(compact);
    if (scheme) { return /^(https?|mailto|tel)$/i.test(scheme[1]); }
    return true;                                         /* relative link (faq.html#x, #id) */
  }

  function cleanAttrs(node) {
    var tag = node.tagName;
    Array.prototype.slice.call(node.attributes).forEach(function (attr) {
      var name = attr.name.toLowerCase();
      var val = attr.value;
      var ok = false;

      if (name === 'class') { ok = /^[\w\s\-]*$/.test(val); }
      else if (name === 'lang') { ok = /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(val); }
      else if (name === 'dir') { ok = /^(ltr|rtl|auto)$/.test(val); }
      else if (name === 'href' && tag === 'A') { ok = safeHref(val); }

      if (!ok) { node.removeAttribute(attr.name); }
    });

    if (tag === 'A' && node.hasAttribute('href') && /^https?:/i.test(node.getAttribute('href'))) {
      node.setAttribute('rel', 'noopener noreferrer');
    }
  }

  function cleanNode(parent) {
    Array.prototype.slice.call(parent.childNodes).forEach(function (node) {
      if (node.nodeType === 3) { return; }                        /* text: theek */
      if (node.nodeType !== 1 || !ALLOWED_TAGS[node.tagName]) {   /* comment, script, img, svg... */
        parent.removeChild(node);
        return;
      }
      cleanAttrs(node);
      cleanNode(node);
    });
  }

  function fragmentFor(key, html) {
    if (!htmlCache[key]) {
      var tpl = document.createElement('template');   /* template ka content "inert" hota hai */
      tpl.innerHTML = html;
      cleanNode(tpl.content);
      htmlCache[key] = tpl.content;
    }
    return htmlCache[key].cloneNode(true);
  }

  function setChildren(el, fragment) {
    while (el.firstChild) { el.removeChild(el.firstChild); }
    el.appendChild(fragment);
  }

  /* ==========================================================================
     en.json LOAD (validated)
     ========================================================================== */
  function validate(data) {
    var out = Object.create(null);
    if (!data || typeof data !== 'object' || Array.isArray(data)) { return out; }
    Object.keys(data).forEach(function (k) {
      var v = data[k];
      if (isUnsafeKey(k) || typeof v !== 'string' || v.length > MAX_VALUE_LENGTH) { return; }
      out[k] = v;
    });
    return out;
  }

  function load() {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = window.setTimeout(function () { if (ctrl) { ctrl.abort(); } }, FETCH_TIMEOUT);

    return fetch('lang/en.json', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (res) {
        if (!res.ok) { throw new Error('lang/en.json nahi mili'); }
        return res.json();
      })
      .then(function (data) {
        window.clearTimeout(timer);
        return validate(data);
      }, function (err) {
        window.clearTimeout(timer);
        throw err;
      });
  }

  /* ==========================================================================
     TEXT PAGE PAR LAGANA
     ========================================================================== */
  function apply() {
    each('[data-i18n]', function (el) {
      var key = el.getAttribute('data-i18n');
      if (has(dict, key)) { el.textContent = dict[key]; }
    });

    each('[data-i18n-html]', function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (has(dict, key)) { setChildren(el, fragmentFor(key, dict[key])); }
    });

    ATTR_MAP.forEach(function (m) {
      each('[' + m.data + ']', function (el) {
        var key = el.getAttribute(m.data);
        if (has(dict, key)) { el.setAttribute(m.attr, dict[key]); }
      });
    });
  }

  /* WhatsApp / social preview tags page ke title/description ke saath chalein */
  function syncMeta() {
    function meta(sel) { return document.querySelector(sel); }
    var title = document.title;
    var descEl = meta('meta[name="description"]');
    var desc = descEl ? (descEl.getAttribute('content') || '') : '';

    [['meta[property="og:title"]', title], ['meta[name="twitter:title"]', title],
     ['meta[property="og:description"]', desc], ['meta[name="twitter:description"]', desc]
    ].forEach(function (pair) {
      var el = meta(pair[0]);
      if (el && pair[1]) { el.setAttribute('content', pair[1]); }
    });
  }

  function finish() {
    apply();
    syncMeta();
    document.dispatchEvent(new CustomEvent('mek:langchange', { detail: { lang: LANG } }));
  }

  /* ---------- shuruaat ---------- */
  function init() {
    /* en.json na mile to page ka apna English text chalta hai */
    load().catch(function () { return {}; }).then(function (data) {
      dict = data;
      finish();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---------- Doosri JS files ke liye ---------- */
  window.MEK_I18N = {
    get lang() { return LANG; },
    get dir() { return 'ltr'; },
    onChange: function (cb) {
      document.addEventListener('mek:langchange', function (e) { cb(e.detail.lang); });
    },
    /* t('key', 'fallback', { name: 'Ali' })  ->  "{name}" ki jagah value */
    t: function (key, fallback, params) {
      var text = has(dict, key) ? dict[key] : (fallback || key);
      if (params) {
        text = text.replace(/\{(\w+)\}/g, function (m, p) { return has(params, p) ? String(params[p]) : m; });
      }
      return text;
    }
  };
})();
