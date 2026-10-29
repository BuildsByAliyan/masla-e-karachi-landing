# Masla-e-Karachi — Landing Website

Masla-e-Karachi ka introduction page: ek anonymous platform jahan Karachi ke log shehri masle report kar sakein. Yeh sirf landing website hai; asli platform abhi under development hai.

- Landing site: https://buildsbyaliyan.github.io/masla-e-karachi-landing/
- Asli platform: https://maslaekarachi.pk

Plain HTML + CSS + vanilla JavaScript. Koi framework, npm ya build step nahi. Site sirf English mein hai. Theme: dark charcoal + neon green.

## Pages
`index.html` (Home), `how-it-works.html`, `privacy.html`, `faq.html`, `terms.html`, `404.html`

## Folder structure
```
docs/                 poori website (GitHub Pages yahin se chalta hai)
  *.html              6 pages
  css/                variables, base, layout, components, pages (5 files, bundle ho chuki)
  js/                 config, i18n (text loader), main, counter, faq, base-404
  lang/               en.json (saara text, sirf yehi ek file)
  assets/             fonts, images, favicons
  humans.txt  robots.txt  sitemap.xml  .nojekyll
tools/                helper scripts, developer.json, favicon source (deploy nahi hote)
project-reference/    project ki context files (deploy nahi hoti)
```

## Local chalana
```
python3 -m http.server 8000 -d docs
```
Phir browser mein `http://localhost:8000` kholo.

## Kaise edit karein
- **Links aur settings:** `docs/js/config.js` (asli website ka link, contact email, site URL, developer info).
- **Contact email:** `docs/js/config.js` mein `CONTACT_EMAIL: 'hello@example.pk'` likho. Khali rahe to FAQ par "Contact email will be added at launch" dikhta hai.
- **Text:** `docs/lang/en.json` (sirf yeh ek file). HTML mein English text pehle se likha hota hai; JSON se wahi text update hota hai. Nayi key lagao to `data-i18n="key"` HTML mein aur key `en.json` mein dalo.
- **Colors, fonts, spacing:** `docs/css/variables.css`.
- **Design:** `docs/css/layout.css`, `components.css`, `pages.css` (bundle files; har hissa `/* >>> ... */` se alag nazar aata hai).
- **Rules:** inline `style=""`, inline script aur CDN mana hain (Content-Security-Policy). Sab paths relative rakho.

## Tools (`tools/`)
| File | Kaam |
| --- | --- |
| `make_favicons.py` | `tools/favicon-source/favicon.png` se saare favicon sizes banata hai (Pillow chahiye) |
| `apply_author_meta.py` | `developer.json` se author meta aur JSON-LD (sameAs links) lagata hai |
| `find_unused.py` | faltu files, CSS classes aur language keys dhoondta hai (kuch delete nahi karta) |
| `developer.json` | developer ka naam aur links (`docs/js/config.js` ke `DEVELOPER` jaisa rakho) |

Chalane ka tareeqa (project root se): `python3 tools/<script>.py docs`

## Deploy (GitHub Pages)
1. Repo GitHub par push karo.
2. Settings → Pages → Branch `main`, folder `/docs`.
3. Site `https://<username>.github.io/<repo-name>/` par khulti hai.

Username ya repo ka naam badalna ho to purane link ki jagah naya link in files mein badlo: `docs/*.html` (canonical, og:url, og:image, JSON-LD), `docs/sitemap.xml`, `docs/robots.txt`, aur `SITE_URL` in `docs/js/config.js`.

**Custom domain:** agar lagani ho to `docs/CNAME` file banao aur usmein sirf domain ki ek line likho (`https://` ke baghair, koi khali line nahi). Agar custom domain nahi hai to `docs/CNAME` file rakhni hi nahi hai; khali CNAME file GitHub Pages ko tod sakti hai.

## Credits
- **Design & development:** Aliyan Saleem — [Portfolio](https://portfolio-aliyan-saleem.vercel.app) · [LinkedIn](https://www.linkedin.com/in/aliyan-saleem-02a596378/) · [YouTube](https://www.youtube.com/@apexmotive.official) · [Instagram](https://www.instagram.com/creativestudi0.pk_/) · [GitHub](https://github.com/BuildsByAliyan)
- **Fonts:** Inter, Space Grotesk, DM Mono — SIL Open Font License 1.1. License texts: `docs/assets/fonts/licenses/`.
