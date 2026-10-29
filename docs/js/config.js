
/* ==========================================================================
   Masla-e-Karachi — config.js
   --------------------------------------------------------------------------
   YEH FILE SETTINGS KA "CONTROL ROOM" HAI.
   Asli website ka link, email aur on/off switches sirf yahin se badalte hain.
   Baaki saari JS files yahin se value parhti hain.

   Security:
   - Poora object freeze hai (koi doosri script chupke se link nahi badal sakti)
   - Clickjacking guard: koi doosri site is page ko <iframe> mein daal kar
     "overlay" hamla na kar sake (GitHub Pages header nahi de sakta, isliye JS)
   ========================================================================== */

(function () {
  'use strict';

  if (window.MEK_CONFIG) { return; } /* do baar load ho to pehli wali rahe */

  window.MEK_CONFIG = Object.freeze({
    /* Asli Masla-e-Karachi website. "Visit Real Website" ke saare buttons
       yahi link kholte hain. Sirf https:// links chalte hain.
       Link badalna ho to sirf yeh ek line badlo. */
    LIVE_SITE_URL: 'https://maslaekarachi.pk',

    /* Contact email. Abhi khali hai, isliye pages par
       "Contact email will be added at launch" likha aata hai.
       Email milte hi yahan likh do, masalan: 'hello@maslaekarachi.pk' */
    CONTACT_EMAIL: '',

    /* Landing site ka apna poora link.
       GitHub Pages:  'https://<username>.github.io/masla-e-karachi-landing/'
       Custom domain: 'https://<apna-domain>/'
       Canonical, og:url, og:image, JSON-LD, sitemap.xml aur robots.txt mein
       yehi link HTML/XML ke andar likha hota hai (JS unhein nahi badalti,
       kyunke WhatsApp/Facebook JS nahi chalate). Link badalna ho to README
       ka "Deploy" hissa dekho. */
    SITE_URL: 'https://buildsbyaliyan.github.io/masla-e-karachi-landing/',

    /* Developer credit (footer + Home ka "Built by" card).
       tools/developer.json ki copy - dono ek jaisi rakho.
       Khali URL wala social link site par dikhta hi nahi.
       Email yahan JAAN BOOJH kar khali hai: developer ka email public JS mein nahi jata. */
    DEVELOPER: Object.freeze({
      NAME: 'Aliyan Saleem',
      ROLE: 'Developer & Designer',
      PORTFOLIO: 'https://portfolio-aliyan-saleem.vercel.app',
      EMAIL: '',
      SHOW_EMAIL: false,
      SOCIALS: Object.freeze([
        Object.freeze({ PLATFORM: 'LinkedIn', HANDLE: 'aliyan-saleem', URL: 'https://www.linkedin.com/in/aliyan-saleem-02a596378/' }),
        Object.freeze({ PLATFORM: 'YouTube', HANDLE: '@apexmotive.official', URL: 'https://www.youtube.com/@apexmotive.official' }),
        Object.freeze({ PLATFORM: 'Instagram', HANDLE: 'creativestudi0.pk_', URL: 'https://www.instagram.com/creativestudi0.pk_/' }),
        Object.freeze({ PLATFORM: 'GitHub', HANDLE: 'BuildsByAliyan', URL: 'https://github.com/BuildsByAliyan' })
      ])
    }),

    /* Animation / extras ke switches (false = band) */
    FX_CURSOR_GLOW: true,   /* mouse ke peeche halka hara noor (sirf desktop) */
    BACK_TO_TOP: true,      /* neeche "upar jao" gol button */

    /* Doosri site is page ko iframe mein na khol sake. Sirf tab true karo
       jab aap khud kahin embed karna chahte ho. (localhost par guard band hai) */
    ALLOW_FRAMING: false
  });

  /* ---------- CLICKJACKING GUARD ---------- */
  var cfg = window.MEK_CONFIG;
  var local = /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(window.location.hostname);
  if (cfg.ALLOW_FRAMING || local) { return; }

  var framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }

  if (framed) {
    document.documentElement.style.display = 'none';
    try { window.top.location.replace(window.self.location.href); } catch (e) { /* cross-origin: page chhupa hi rahe */ }
  }
})();
