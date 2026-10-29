/* ==========================================================================
   Masla-e-Karachi — base-404.js
   --------------------------------------------------------------------------
   404.html kisi bhi path par khulta hai (maslan /xyz ya /a/b/c), isliye
   relative links (css/, js/, assets/) toot sakte hain. Yeh chhoti script
   <head> mein sab se pehle chalti hai aur <base href> laga deti hai.

   - GitHub Pages (*.github.io): base = '/<repo-name>/'
   - Custom domain / localhost:  base = '/'

   Yeh SYNC script hai (defer/async nahi), isliye iske baad ke saare relative
   links base ke saath resolve hote hain. document.write ki jagah DOM use hota hai.
   ========================================================================== */

(function () {
  'use strict';

  var base = '/';

  if (/\.github\.io$/.test(location.hostname)) {
    var seg = location.pathname.split('/')[1];
    if (seg) { base = '/' + seg + '/'; }
  }

  var el = document.createElement('base');
  el.href = base;
  document.head.insertBefore(el, document.head.firstChild);
})();
